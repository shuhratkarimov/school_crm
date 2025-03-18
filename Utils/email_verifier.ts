import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()
async function sendVerificationEmail(username: string, email: string, randomCode: number) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.VERIFIER_EMAIL,
      pass: process.env.VERIFIER_GOOGLE_PASS_KEY,
    },
  });

  await transporter.sendMail({
    from: `Verifying service of ${process.env.VERIFIER_EMAIL}>`,
    to: email,
    subject: "Verifying email",
    text: "to sign up",
    html: `<div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      "
    >
      <div
        style="
          text-align: center;
          padding: 20px;
          background-color:rgb(107, 218, 96);
          border-radius: 6px;
          color: #fff;
        "
      >
        <h1 style="margin: 0; font-size: 24px;">Tasdiqlash Kodingiz</h1>
      </div>

      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
          Hurmatli ${username.toUpperCase()}, ro'yxatdan o'tishni yakunlash uchun quyidagi
          tasdiqlash kodini kiriting:
        </p>
        <div
          style="
            font-size: 36px;
            font-weight: bold;
            color:rgb(107, 218, 96);
            background-color: #e9ecef;
            padding: 10px 20px;
            border-radius: 6px;
            display: inline-block;
            letter-spacing: 5px;
          "
        >
          ${randomCode}
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Ushbu kod 2 daqiqa ichida amal qiladi. Kodni kiritishda muammo
          yuzaga kelsa, iltimos biz bilan bog'laning (${process.env.VERIFIER_EMAIL}).
        </p>
      </div>

      <footer
        style="
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
        "
      >
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} NodeJSProduction</p>
        <p style="margin: 0;">
          Ushbu email avtomatik yuborildi, unga javob berishga hojat yo'q.
        </p>
      </footer>
    </div>
    `,
  });
}

export default sendVerificationEmail
