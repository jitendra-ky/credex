/* eslint-disable no-console */

const { Resend } = require("resend");

type SendTestEmailOptions = {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  text: string;
};

async function sendTestEmail(options: SendTestEmailOptions): Promise<void> {
  const resend = new Resend(options.apiKey);

  const response = await resend.emails.send({
    from: options.fromEmail,
    to: options.toEmail,
    subject: options.subject,
    text: options.text,
  });

  console.log("Resend response:");
  console.log(response);
}

async function main(): Promise<void> {
  const options: SendTestEmailOptions = {
    apiKey: "put here here when testing",
    fromEmail: "support@jitendraky.tech",
    toEmail: "jitendraky.tech@gmail.com",
    subject: "Resend test email",
    text: "Hello from Resend test script.",
  };

  await sendTestEmail(options);
}

main().catch((error) => {
  console.error("Failed to send test email:");
  console.error(error);
  process.exit(1);
});
