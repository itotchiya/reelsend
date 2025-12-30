import { Resend } from "resend";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Log configuration for debugging
console.log("[RESEND] API Key:", process.env.RESEND_API_KEY ? "SET" : "NOT SET");
console.log("[RESEND] From:", process.env.RESEND_FROM);

interface InvitationEmailParams {
  to: string;
  inviterName: string;
  roleName: string;
  inviteToken: string;
}

export async function sendInvitationEmail({
  to,
  inviterName,
  roleName,
  inviteToken,
}: InvitationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const setupUrl = `${appUrl}/setup-account?token=${inviteToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #18181b; font-size: 24px; margin: 0;">You're Invited to Reelsend!</h1>
          </div>
          
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            <strong>${inviterName}</strong> has invited you to join Reelsend as a <strong>${roleName}</strong>.
          </p>
          
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Click the button below to set up your account and get started.
          </p>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${setupUrl}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Set Up Your Account
            </a>
          </div>
          
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
            This invitation link will expire in 7 days.
          </p>
          
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
          
          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
            Reelsend - Professional Email Campaign Platform
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const fromEmail = process.env.RESEND_FROM || "onboarding@resend.dev";
    const formattedFrom = fromEmail.includes("<") ? fromEmail : `Reelsend <${fromEmail}>`;
    console.log("[EMAIL_SEND] From:", formattedFrom, "To:", to);

    const { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: [to],
      subject: `${inviterName} has invited you to join Reelsend`,
      html,
    });

    if (error) {
      console.error("Failed to send invitation email:", error);
      return { success: false, error };
    }

    console.log("[EMAIL_SENT] Success, ID:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return { success: false, error };
  }
}

interface OTPEmailParams {
  to: string;
  otp: string;
}

export async function sendOTPEmail({ to, otp }: OTPEmailParams) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #18181b; font-size: 24px; margin: 0;">Verification Code</h1>
          </div>
          
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Use the following code to verify your new email address. This code will expire in 10 minutes.
          </p>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: #f4f4f5; color: #18181b; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 32px; letter-spacing: 0.2em;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center;">
            If you didn't request this change, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
          
          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
            Reelsend - Professional Email Campaign Platform
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    const fromEmail = process.env.RESEND_FROM || "onboarding@resend.dev";
    const formattedFrom = fromEmail.includes("<") ? fromEmail : `Reelsend <${fromEmail}>`;

    const { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: [to],
      subject: `Your Verification Code: ${otp}`,
      html,
    });

    if (error) {
      console.error("Failed to send OTP email:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return { success: false, error };
  }
}
