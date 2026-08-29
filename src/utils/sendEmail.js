const nodemailer = require('nodemailer');
const dns = require('dns');

// Render (and several other hosts) can't route to IPv6 addresses, which was
// causing "connect ENETUNREACH <ipv6 address>" when Node resolved Gmail's
// SMTP host to IPv6 first. This forces Node's DNS resolution to prefer IPv4
// globally — the officially recommended fix for this exact class of bug.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const transporter = nodemailer.createTransport({
  // Explicit host/port instead of `service: 'gmail'` — the shorthand's
  // internal "well-known service" preset was overriding our family/tls
  // options in ways that weren't taking effect.
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4,
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