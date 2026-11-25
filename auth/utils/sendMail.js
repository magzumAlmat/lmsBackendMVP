const nodemailer = require('nodemailer');
require('dotenv').config();

// Создаем транспорт для отправки писем через Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: text,
  };

  // Отправляем письмо
  return transporter.sendMail(mailOptions)
    .then((info) => {
      console.log('Email отправлен: ' + info.response);
    })
    .catch((error) => {
      console.error('Ошибка при отправке email:', error.message);
      throw error;
    });
}

module.exports = sendEmail;
