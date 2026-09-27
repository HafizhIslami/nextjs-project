import sendEmail from "../utils/sendEmail";

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);

export const canSendPlatformEmail = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM_EMAIL
  );

export const sendMerchantOwnerInvitation = async (input: {
  email: string;
  ownerName: string;
  merchantName: string;
  activationUrl: string;
}) => {
  if (!canSendPlatformEmail()) return false;
  const merchantName = escapeHtml(input.merchantName);
  const ownerName = escapeHtml(input.ownerName);
  const activationUrl = escapeHtml(input.activationUrl);
  await sendEmail({
    email: input.email,
    subject: `Activate your ${input.merchantName.replace(/[\r\n]/g, " ")} account`,
    message: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#23191f">
        <h1>Welcome to ${merchantName}</h1>
        <p>Hello ${ownerName}, your merchant website is ready.</p>
        <p><a href="${activationUrl}" style="display:inline-block;padding:12px 18px;background:#a7194b;color:#fff;text-decoration:none;border-radius:8px">Activate account</a></p>
        <p>This private link expires in 48 hours. If you did not expect this invitation, ignore this message.</p>
      </div>
    `,
  });
  return true;
};
