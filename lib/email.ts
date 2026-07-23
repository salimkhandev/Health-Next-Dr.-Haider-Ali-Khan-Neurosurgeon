/**
 * Email utility — stub for Batch 2. Fully implemented in Batch 9.
 * All send functions are fire-and-forget: callers do `void sendX(...)`.
 * Failures are logged to Sentry (wired in Batch 10) and never surface to users.
 */

import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

async function send(to: string, subject: string, html: string) {
  try {
    await getResend().emails.send({
      from: `IlmPath <${process.env.SUPPORT_EMAIL ?? 'noreply@ilmpath.com'}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Log to Sentry in Batch 10 — don't throw, email failure must not block business logic
    console.error('[email] send failed', err);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await send(
    to,
    'Reset your IlmPath password',
    `<p>Click the link below to reset your password. It expires in 1 hour.</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>If you did not request this, ignore this email.</p>`
  );
}

// Stubs — expanded in Batch 9 with full branded templates
export async function sendPaymentReceivedStudent(to: string) {
  await send(to, 'Payment received', '<p>We received your payment screenshot. We will review within 24 hours.</p>');
}

export async function sendPaymentReceivedAdmin(studentName: string, adminEmail: string, adminPanelUrl: string) {
  await send(adminEmail, 'New payment to review', `<p>New payment submitted by ${studentName}. <a href="${adminPanelUrl}">Review here</a>.</p>`);
}

export async function sendPaymentApproved(to: string) {
  await send(to, 'Account activated', '<p>Your account is now active. Start learning!</p>');
}

export async function sendPaymentRejected(to: string, adminNote: string, supportEmail: string) {
  const reason = adminNote
    ? `Reason: ${adminNote}. `
    : '';
  await send(to, 'Payment not verified', `<p>We could not verify your payment. ${reason}Please contact us at ${supportEmail} to resolve, or resubmit your payment details.</p>`);
}

export async function sendCertificateReady(to: string, courseTitle: string, certUrl: string) {
  await send(to, 'Certificate ready', `<p>Congratulations! You have completed <strong>${courseTitle}</strong>. <a href="${certUrl}">Download your certificate</a>.</p>`);
}
