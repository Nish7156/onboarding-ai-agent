import { DynamicTool } from "@langchain/core/tools";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // app password
  },
});

export const emailTool = new DynamicTool({
  name: "send_welcome_email",
  description: "Send a welcome email to the candidate.",
  func: async (input) => {
    const { candidateName, candidateEmail } = input || {};
    if (!candidateName || !candidateEmail) {
      return "❌ Candidate name and email required";
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: candidateEmail,
      subject: `Welcome to the Company, ${candidateName}!`,
      text: `Hi ${candidateName},\n\nWelcome to the team! We are excited to have you onboard.\n\nBest regards,\nHR Team`,
      html: `<p>Hi <b>${candidateName}</b>,</p>
             <p>Welcome to the team! We are excited to have you onboard.</p>
             <p>Best regards,<br/>HR Team</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return `📧 Welcome email successfully sent to: ${candidateEmail}`;
    } catch (err) {
      console.error("Error sending email:", err);
      return `❌ Failed to send email to ${candidateEmail}: ${err.message}`;
    }
  },
});
