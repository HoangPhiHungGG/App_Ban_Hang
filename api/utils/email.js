const nodemailer = require("nodemailer");
require("dotenv").config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS; // App Password recommended

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "Email credentials not found in .env file. Email sending will be disabled."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, verificationToken, port) => {
  if (!EMAIL_USER || !EMAIL_PASS) return; // Don't attempt if no creds

  // Use environment variable for base URL in production
  const verificationUrl = `http://localhost:${
    port || 8000
  }/verify/${verificationToken}`;
  const mailOptions = {
    from: `"MovieTime Tickets" <${EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email for MovieTime",
    text: `Please click the following link to verify your email: ${verificationUrl}`,
    html: `<p>Please click the following link to verify your email:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully to", email);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

// Add other email functions here if needed (e.g., booking confirmation)

module.exports = {
  sendVerificationEmail,
  // export other functions
};
