const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async (to, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Acme <onboarding@resend.dev>",
      to: [to],
      subject: "Your OTP for Complaints Registration",
      html: `<p>Your OTP is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    });

    if (error) {
      console.error("Error sending email:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = { sendOTP };
