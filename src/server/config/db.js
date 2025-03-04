const { Pool } = require('pg');

const pool = new Pool({
  user: 'student',
  host: 'localhost',
  database: 'mydatabase',
  password: '425198637',
  port: 5432, // стандартный порт PostgreSQL
});

pool.connect()
  .then(client => {
    console.log('🟢 Успешное подключение к базе данных');
    client.release(); // освобождаем подключение после использования
  })
  .catch(err => {
    console.error('🔴 Ошибка подключения к базе данных', err);
  })

module.exports = pool;
