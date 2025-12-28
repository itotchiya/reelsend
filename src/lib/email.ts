import nodemailer from "nodemailer";

// Log SMTP configuration (without password) for debugging
console.log("[SMTP_CONFIG] Host:", process.env.SMTP_HOST);
console.log("[SMTP_CONFIG] Port:", process.env.SMTP_PORT);
console.log("[SMTP_CONFIG] User:", process.env.SMTP_USER ? "SET" : "NOT SET");
console.log("[SMTP_CONFIG] Password:", process.env.SMTP_PASSWORD ? "SET" : "NOT SET");
console.log("[SMTP_CONFIG] From:", process.env.SMTP_FROM);

// Create transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

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
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">R</span>
            </div>
            <h1 style="color: #18181b; font-size: 24px; margin: 0;">You're Invited!</h1>
          </div>
          
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            <strong>${inviterName}</strong> has invited you to join Reelsend as a <strong>${roleName}</strong>.
          </p>
          
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Click the button below to set up your account and get started.
          </p>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
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

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Reelsend" <noreply@reelsend.com>',
    to,
    subject: `${inviterName} has invited you to join Reelsend`,
    html,
  };

  try {
    console.log("[EMAIL_SEND] From:", mailOptions.from, "To:", mailOptions.to);
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return { success: false, error };
  }
}
