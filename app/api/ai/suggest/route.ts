import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface ConversationMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface PatientContext {
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  allergies: string[];
  chronicConditions: string[];
  recentDiagnoses?: string[];
}

/**
 * POST /api/ai/suggest
 * Body: { symptoms, patient, history, followUpMessage? }
 *
 * - On first call (no followUpMessage): sends full clinical context + symptoms
 * - On follow-up calls: sends the accumulated conversation + new doctor message
 *
 * Never auto-finalises a diagnosis — all output is marked "Suggested".
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI assistant unavailable — API key not configured.' },
      { status: 503 }
    );
  }

  const body = await req.json();
  const {
    symptoms,
    patient,
    conversationHistory,
    followUpMessage,
  }: {
    symptoms: string[];
    patient: PatientContext;
    conversationHistory: ConversationMessage[];
    followUpMessage?: string;
  } = body;

  // Build system instruction
  const systemPrompt = `You are a clinical AI assistant supporting Dr. Haider Ali Khan, MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma — a practicing Neurosurgeon at Health Next clinic.

Your role is ADVISORY ONLY. You provide decision-support to the doctor. You NEVER finalise a diagnosis, prescribe, or replace clinical judgment. All suggestions must be labelled as "Suggested" or "Possible".

PATIENT CONTEXT:
- Name: ${patient.fullName}
- MRN: ${patient.mrn}
- Age: ${patient.age} | Gender: ${patient.gender}
- Known Allergies: ${patient.allergies.length ? patient.allergies.join(', ') : 'None'}
- Chronic Conditions: ${patient.chronicConditions.length ? patient.chronicConditions.join(', ') : 'None'}
${patient.recentDiagnoses?.length ? `- Recent Diagnoses: ${patient.recentDiagnoses.join(', ')}` : ''}

Specialise your response to the neurosurgical and neurological domain when relevant.
Format your initial response as valid JSON with this structure:
{
  "possibleConditions": [{"name": "...", "reasoning": "..."}],
  "suggestedTests": ["..."],
  "suggestedMedicines": [{"name": "...", "dosage": "..."}],
  "allergyConflicts": ["medicine name if it conflicts with patient allergies"],
  "clinicalNote": "Brief additional clinical note for the doctor"
}

For follow-up conversation messages, respond in plain text (not JSON). Be concise and clinically precise.`;

  // Determine content structure
  let contents: ConversationMessage[];

  if (!followUpMessage) {
    // Initial request — send system + symptoms as first user turn
    const userMessage = `Current presenting symptoms: ${symptoms.join(', ')}.
Please provide a structured differential diagnosis, suggested confirmatory tests, and medicine options. Remember to check for allergy conflicts.`;

    contents = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] },
    ];
  } else {
    // Follow-up — include history + new message
    const history = conversationHistory.map((m) => ({
      role: m.role,
      parts: m.parts,
    }));
    contents = [
      ...history,
      { role: 'user', parts: [{ text: followUpMessage }] },
    ];
  }

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: 'AI assistant temporarily unavailable.' }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // For initial response, parse JSON; for follow-ups return plain text
    if (!followUpMessage) {
      try {
        // Strip markdown code fences if Gemini wraps in ```json
        const cleaned = rawText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ type: 'initial', suggestions: parsed, rawText });
      } catch {
        // Gemini returned non-JSON — return as plain text note
        return NextResponse.json({ type: 'text', rawText });
      }
    } else {
      return NextResponse.json({ type: 'followup', rawText });
    }
  } catch (err) {
    console.error('AI request failed:', err);
    return NextResponse.json({ error: 'AI assistant unavailable. Clinical records can still be saved.' }, { status: 503 });
  }
}
