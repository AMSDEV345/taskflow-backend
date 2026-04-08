const { Resend } = require('resend');
require('dotenv').config();

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY not found! Check your .env file.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: `TaskFlow <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully to', to);
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

module.exports = sendEmail;