require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use((_req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:");
    next();
});

app.use((req, _res, next) => {
    console.log(`Запрос к: ${req.url}`);
    next();
});

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoutes);

app.use(express.static(path.join(__dirname, '..', 'public'))); // Обслуживаем все файлы из папки vs

app.get('/', (_req, res) => {
    res.send('Сервер работает!');
});

app.get('/login', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'account.html'));
});

app.listen(PORT, () => {
    console.log(`🟢 Сервер запущен на порту ${PORT}`);
});