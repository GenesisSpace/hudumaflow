const MAILJET_API_URL = 'https://api.mailjet.com/v3.1/send';

const sendEmail = async ({ to, subject, text }) => {
  const credentials = Buffer.from(
    `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_API_SECRET}`
  ).toString('base64');

  const response = await fetch(MAILJET_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: process.env.EMAIL_USER, Name: 'HudumaFlow' },
          To: [{ Email: to }],
          Subject: subject,
          TextPart: text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mailjet API error (${response.status}): ${errorBody}`);
  }
};

module.exports = sendEmail;