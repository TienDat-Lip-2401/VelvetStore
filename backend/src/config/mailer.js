const nodemailer = require('nodemailer');
require('dotenv').config();

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

// Chưa cấu hình SMTP (môi trường dev) -> in nội dung ra console thay vì gửi
const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`[Mail chưa cấu hình SMTP] To: ${to} | ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, html });
};

module.exports = { sendMail };
