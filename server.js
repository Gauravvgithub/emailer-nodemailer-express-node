import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-frontend-domain.vercel.app",
    ],
    methods: ["POST"],
  })
);

app.use(express.json());

// Create reusable transporter (pooled for speed)
const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true,
  maxConnections: 3,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact Route
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  // Respond immediately to frontend
  res.status(200).json({
    success: true,
    message: "Message received! Sending emails in background...",
  });

  // ------------------ EMAIL TEMPLATE STYLES ------------------
  const baseStyle = `
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f9fafb;
    padding: 40px 0;
  `;

  const cardStyle = `
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    overflow: hidden;
  `;

  const headerStyle = `
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    text-align: center;
    padding: 20px 0;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.3px;
  `;

  const bodyStyle = `
    padding: 25px 35px;
    color: #374151;
    font-size: 16px;
    line-height: 1.6;
  `;

  const messageBoxStyle = `
    background: #f3f4f6;
    border-left: 4px solid #2563eb;
    padding: 15px;
    border-radius: 6px;
    white-space: pre-wrap;
    word-break: break-word;
    margin-top: 10px;
  `;

  const footerStyle = `
    text-align: center;
    font-size: 13px;
    color: #6b7280;
    padding: 15px 0;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  `;

  // ------------------ ADMIN EMAIL ------------------
  const adminMail = transporter.sendMail({
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.RECEIVER_EMAIL,
    replyTo: email,
    subject: subject || "New Contact Form Message",
    html: `
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          <div style="${headerStyle}">New Contact Message</div>
          <div style="${bodyStyle}">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || "(No subject)"} </p>
            <p><strong>Message:</strong></p>
            <div style="${messageBoxStyle}">${message}</div>
          </div>
          <div style="${footerStyle}">
            © ${new Date().getFullYear()} Portfolio Contact System
          </div>
        </div>
      </div>
    `,
  });

  // ------------------ USER EMAIL ------------------
  const userMail = transporter.sendMail({
    from: `"Gaurav" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Thank you for contacting us",
    html: `
      <div style="${baseStyle}">
        <div style="${cardStyle}">
          <div style="${headerStyle}">Thank You for Reaching Out</div>
          <div style="${bodyStyle}">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We’ve received your message and will get back to you shortly.</p>
            <p style="margin-top: 20px;"><strong>Your message:</strong></p>
            <div style="${messageBoxStyle}">${message}</div>
            <p style="margin-top: 25px;">Best regards,<br><strong>Gaurav</strong></p>
          </div>
          <div style="${footerStyle}">
            This is an automated acknowledgment from the contact form.
          </div>
        </div>
      </div>
    `,
  });

  try {
    await Promise.all([adminMail, userMail]);
    console.log("Emails sent successfully");
  } catch (err) {
    console.error("Error sending emails:", err);
  }
});

const PORT = process.env.PORT || 8285;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
