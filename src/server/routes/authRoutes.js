const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: '../../.env' });
const db = require('../config/db');

const router = express.Router();
const pool = new Pool({
  user: 'student',
  host: 'localhost',
  database: 'mydatabase',
  password: '425198637',
  port: 5432,
});

// Настройка почтового транспорта
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Регистрация
router.post('/register', async (req, res) => {
  const { login, email, password } = req.body;

  try {
    const existingLogin = await pool.query('SELECT login FROM users WHERE login = $1', [login]);
    if (existingLogin.rows.length > 0) {
      const suggestions = [];
      for (let i = 1; i <= 5; i++) {
        const suggestedLogin = `${login}${Math.floor(Math.random() * 100)}`;
        const checkSuggestion = await pool.query('SELECT login FROM users WHERE login = $1', [suggestedLogin]);
        if (checkSuggestion.rows.length === 0) {
          suggestions.push(suggestedLogin);
        }
        if (suggestions.length >= 3) break;
      }

      return res.status(400).json({
        error: 'Логин уже занят',
        suggestions,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomUUID();

    await pool.query(
      'INSERT INTO users (login, email, password, verification_token) VALUES ($1, $2, $3, $4)',
      [login, email, hashedPassword, verificationToken]
    );

    const verificationLink = `http://localhost:5000/auth/verify/${verificationToken}`;
    const mailOptions = {
      to: email,
      subject: 'Подтверждение email',
      html: `
        <h2>Подтверждение email</h2>
        <p>Для завершения регистрации, подтвердите ваш email, нажав на кнопку:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; border-radius: 5px; text-decoration: none;">Подтвердить email</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Регистрация успешна. Проверьте email для подтверждения.' });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Подтверждение email
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query('UPDATE users SET is_verified = TRUE WHERE verification_token = $1 RETURNING id', [token]);

    if (result.rowCount === 0) {
      return res.sendFile(path.join(__dirname, 'public/verify-error.html'));
    }

    res.sendFile(path.join(__dirname, 'public/verify-success.html'));
  } catch (error) {
    console.error('Ошибка при подтверждении:', error);
    res.sendFile(path.join(__dirname, 'public/verify-error.html'));
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    if (user.rows.length === 0) return res.status(400).json({ error: 'Неверный логин или пароль' });

    if (!user.rows[0].is_verified) return res.status(403).json({ error: 'Email не подтверждён' });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ error: 'Неверный логин или пароль' });

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      id: user.rows[0].id, // Добавляем user_id
      token: token
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Восстановление пароля: отправка письма
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден.' });
    }

    const resetToken = crypto.randomUUID();
    const expiryTime = new Date(Date.now() + 3600000); // Устанавливаем срок действия токена на 1 час

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, expiryTime, user.rows[0].id]
    );

    const resetLink = `http://localhost:5000/auth/reset-password/${resetToken}`;
    const mailOptions = {
      to: email,
      subject: 'Сброс пароля',
      html: `
        <h2>Сброс пароля</h2>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #FF5722; color: white;">Сбросить пароль</a>
      `,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Письмо для сброса пароля отправлено!' });
  } catch (error) {
    console.error('Ошибка при восстановлении пароля:', error);
    res.status(500).json({ message: 'Ошибка на сервере.' });
  }
});

router.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'reset-password.html'));
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const user = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Токен недействителен или истёк.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.status(200).json({ message: 'Пароль успешно изменён!' });
  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error);
    res.status(500).json({ message: 'Ошибка на сервере.' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Папка для загрузки аватаров
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Уникальное имя для аватара
  },
});

const upload = multer({ storage: storage });

// Редактирование профиля
router.post('/update-profile', upload.single('avatar'), async (req, res) => {
  const { user_id, nickname, age, gender, emotions, introvert, genres } = req.body;
  const avatar = req.file ? req.file.path : null;

  console.log("Тело запроса:", req.body);

  try {
      const profileExists = await pool.query('SELECT 1 FROM user_profiles WHERE user_id = $1', [user_id]);

      if (profileExists.rows.length === 0) {
          const result = await pool.query(
              `INSERT INTO user_profiles (user_id, nickname, age, gender, emotions, introvert, genres, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
              [user_id, nickname, age, gender, `{${emotions.split(',').join(',')}}`, introvert === 'introvert', `{${genres.split(',').join(',')}}`, avatar]
          );
          res.status(200).json({ message: 'Профиль успешно создан', profile: result.rows[0] });
      } else {
          // Исправленное условие:
          const isIntrovert = introvert === 'introvert';

          const result = await pool.query(
              `UPDATE user_profiles SET
                  nickname = $1,
                  age = $2,
                  gender = $3,
                  emotions = $4,
                  introvert = $5,
                  genres = $6,
                  avatar = $7,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = $8 RETURNING *`,
              [nickname, age, gender, `{${emotions.split(',').join(',')}}`, isIntrovert, `{${genres.split(',').join(',')}}`, avatar, user_id]
          );
          console.log("Результат запроса:", result.rows[0]);
          res.status(200).json({ message: 'Профиль успешно обновлён', profile: result.rows[0] });
      }
  } catch (error) {
      console.error('Ошибка при обновлении/создании профиля:', error);
      res.status(500).json({ error: 'Ошибка обновления/создания профиля' });
  }
});

router.get('/profile', async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
  }

  try {
      const profile = await pool.query('SELECT nickname, age, gender, avatar, emotions, introvert, genres FROM user_profiles WHERE user_id = $1', [userId]);
      console.log("Данные из базы данных:", profile.rows[0]);
      console.log('Результат запроса к базе данных:', profile); // Проверка результата запроса

      if (profile.rows.length === 0) {
          return res.status(404).json({ error: 'Profile not found' });
      }

      const profileData = {
          nickname: profile.rows[0].nickname,
          age: profile.rows[0].age,
          gender: profile.rows[0].gender,
          avatar: profile.rows[0].avatar,
          emotions: profile.rows[0].emotions,
          introvert: profile.rows[0].introvert,
          genres: profile.rows[0].genres
      };

      res.json(profileData);
  } catch (error) {
      console.error('Error loading profile:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;

