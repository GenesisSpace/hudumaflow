const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  
  // which was blocking the whole /register request from ever responding.
  connectionTimeout: 10000, // 10s to establish the connection
  greetingTimeout: 10000,   // 10s to receive the SMTP greeting
  socketTimeout: 15000,     // 15s of inactivity on the socket
});

const sendEmail = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: `"HudumaFlow" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;