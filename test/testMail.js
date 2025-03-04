
const fs = require('fs');
require('dotenv').config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log('.env exists:', fs.existsSync('./.env') ? 'Yes' : 'No');

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'yoruichi.13.01@gmail.com', // Замени на свой email
  subject: 'Проверка',
  text: 'Тестовое сообщение',
})
  .then(() => console.log('Сообщение успешно отправлено'))
  .catch(err => console.error('Ошибка при отправке:', err));
  
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
