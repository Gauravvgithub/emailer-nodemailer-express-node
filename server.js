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

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact Route
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message)
    return res
      .status(400)
      .json({ success: false, message: "All fields required." });

  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: subject || "New Contact Message",
      html: `
        <div style="font-family:'Segoe UI',sans-serif;padding:20px;background:#f9fafb">
          <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1)">
            <h2 style="color:#2563eb;">New Message Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || "(No subject)"}</p>
            <p style="margin-top:10px;"><strong>Message:</strong></p>
            <div style="background:#f3f4f6;padding:10px;border-radius:5px;">${message}</div>
          </div>
        </div>
      `,
    });

    res
      .status(200)
      .json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

const PORT = process.env.PORT || 8285;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
