const sendEmail = require('./utils/sendEmail');

sendEmail({
  to: 'your_email@example.com', // replace with your email
  subject: 'Test Email',
  html: '<p>This is a test from TaskFlow!</p>',
});