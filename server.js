import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://gaurav-developer-portfolio.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // optional, if you need to send cookies
  })
);

app.use(express.json());

// Setup transporter with connection pooling for speed
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true, // reuse connections
  maxConnections: 5, // max parallel connections
  maxMessages: 100, // max messages per connection
});

// Contact route
app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body;

  // Respond immediately so user doesn't wait
  res.json({
    success: true,
    message: "Message received! Emails are being sent...",
  });

  // Send emails asynchronously in the background
  (async () => {
    try {
      await Promise.all([
        //  Email to admin
        transporter.sendMail({
          from: `"${name}" <${process.env.EMAIL_USER}>`,
          to: process.env.RECEIVER_EMAIL,
          replyTo: email,
          subject: subject || "📩 New Contact Form Message",
          html: `
            <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; padding: 16px 24px; text-align: center;">
                  <h2 style="margin: 0; font-size: 20px;">New Message Received 💬</h2>
                </div>
                <div style="padding: 24px;">
                  <p><strong>👤 Name:</strong> ${name}</p>
                  <p><strong>📧 Email:</strong> <a href="mailto:${email}" style="color:#3B82F6;">${email}</a></p>
                  <p><strong>📝 Subject:</strong> ${
                    subject || "(No Subject)"
                  }</p>
                  <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 16px;">
                    <p style="white-space: pre-line;">${message}</p>
                  </div>
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                  <p>This message was sent from your website contact form.</p>
                </div>
              </div>
            </div>
          `,
        }),

        // Auto-reply email to user
        transporter.sendMail({
          from: `"Gaurav Raj" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "✅ Thanks for contacting us!",
          html: `
            <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; text-align: center;">
                  <h2>Thank You for Getting in Touch 🙌</h2>
                </div>
                <div style="padding: 24px;">
                  <p>Hi <strong>${name}</strong>,</p>
                  <p>Thank you for reaching out! We’ve received your message and will get back to you as soon as possible.</p>
                  <p>Here’s a summary of what you sent:</p>
                  <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 8px;">
                    <p style="white-space: pre-line;">
                      <strong>Subject:</strong> ${
                        subject || "(No Subject)"
                      }<br><br>
                      ${message}
                    </p>
                  </div>
                  <p style="margin-top: 20px;">
                    Best regards,<br>
                    <strong>Gaurav Raj</strong><br>
                    <a href="mailto:${
                      process.env.EMAIL_USER
                    }" style="color:#3B82F6;">${process.env.EMAIL_USER}</a>
                  </p>
                </div>
                <div style="background-color: #f9fafb; padding: 14px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                  <p>This is an automated confirmation message. Please do not reply directly.</p>
                </div>
              </div>
            </div>
          `,
        }),
      ]);
      console.log("Both emails sent successfully!");
    } catch (err) {
      console.error("Email sending error:", err);
    }
  })();
});

// Start server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
