const { Pool } = require('pg');

const pool = new Pool({
  user: 'student',
  host: 'localhost',
  database: 'mydatabase',
  password: '425198637',
  port: 5432,
});

pool.connect()
  .then(client => {
    console.log('✅ Успешное подключение к базе данных');
    return client.query('SELECT NOW()')
      .then(res => {
        console.log('Серверное время PostgreSQL:', res.rows[0]);
        client.release();
      });
  })
  .catch(err => console.error('❌ Ошибка подключения:', err));
