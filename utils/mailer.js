const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or use 'Outlook', 'Yahoo', etc. based on your email
  auth: {
    user: process.env.EMAIL_USER,       // Your email address
    pass: process.env.EMAIL_PASS        // App password or email password
  }
});

async function sendVerificationEmail(email, token) {
  const verificationUrl = `http://localhost:3000/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your email - CutTime',
    html: `
      <h2>Verify Your Email</h2>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>If you did not request this, you can ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (err) {
    console.error('Error sending verification email:', err);
  }
}

module.exports = { sendVerificationEmail };
