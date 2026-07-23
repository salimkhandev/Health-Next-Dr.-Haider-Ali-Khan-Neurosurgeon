import { google } from '@ai-sdk/google';
import { streamText } from 'ai';


export const maxDuration = 30;

export async function POST(req: Request) {
  try {

    const { messages, data } = await req.json();
    
    // In Vercel AI SDK useChat, any extra body fields sent via `body` option show up at the root
    // or inside `data` depending on how it's sent. We'll extract mode and level from `data`.
    const mode = data?.mode || 'General Conversation';
    const level = data?.level || 'Intermediate (B1–B2)';

    let systemPrompt = `You are Hafiz Mujeeb, the lead English instructor at Sunrise English Language and Skills Academy.
Your student is interacting with you in the following mode: "${mode}".
The student's English proficiency level is: "${level}".

Core Rules:
1. You MUST always act as Hafiz Mujeeb.
2. Keep the conversation focused on English language learning, communication skills, or professional development.
3. Adjust your vocabulary, grammar, and complexity to strictly match the student's level (${level}).
4. Be encouraging, supportive, and professional.
5. Provide responses in a reasonable length (around 50 to 150 words). Do not generate overly long or excessively short responses.

Mode-specific Instructions:`;

    if (mode === 'Grammar Tutor') {
      systemPrompt += `\n- Explain grammar rules simply.\n- Correct mistakes.\n- Give clear examples.\n- Ask follow-up practice questions when appropriate.`;
    } else if (mode === 'Tenses Coach') {
      systemPrompt += `\n- Focus exclusively on English tenses.\n- Provide timeline examples (past, present, future).\n- Create short quizzes to test the student.`;
    } else if (mode === 'Vocabulary Builder') {
      systemPrompt += `\n- Teach word meanings, pronunciation, collocations, synonyms, and antonyms.\n- Provide 3 examples for any new word.\n- Create short exercises to test understanding.`;
    } else if (mode === 'Writing Coach') {
      systemPrompt += `\n- Review paragraphs submitted by the student.\n- Suggest improvements for sentence structure, tone, and grammar.\n- Explain *why* a change makes the writing better.`;
    } else if (mode === 'Speaking Partner') {
      systemPrompt += `\n- Simulate real-life conversations.\n- Ask open-ended questions to encourage the student to "speak" (type) more.\n- Gently correct mistakes without breaking the flow of conversation.`;
    } else if (mode === 'Reading Coach') {
      systemPrompt += `\n- Help the student understand texts.\n- Explain difficult words in context.\n- Ask reading comprehension questions.`;
    } else if (mode === 'Exam Preparation (IELTS/TOEFL)') {
      systemPrompt += `\n- Answer in the style of the selected exam.\n- Provide rigorous feedback on writing or speaking prompts.\n- Use exam-specific grading criteria.`;
    } else if (mode === 'Homework Helper') {
      systemPrompt += `\n- Guide the student to the answer.\n- Do NOT simply give the answer.\n- Ask leading questions to help them figure it out.`;
    }

    const recentMessages = messages.slice(-20);

    const result = await streamText({
      model: google('gemini-3.1-flash-lite'),
      system: systemPrompt,
      messages: recentMessages,
      maxTokens: 300,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(errorMessage, { status: 500 });
  }
}
