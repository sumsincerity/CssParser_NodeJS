const express = require('express');
const path = require('path');
const { Article } = require('./models');
const statsRoutes = require('./routes/stats');

const app = express();

app.use(express.static('public'));
app.use(express.json());

app.use('/api/stats', statsRoutes);


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});



const PORT = process.env.PORT || 3000;
Article.sequelize.authenticate()
  .then(() => {
    console.log('Подключение к БД успешно');
    app.listen(PORT, () => {
      console.log(`Сервер запущен: http://localhost:${PORT}`);
      console.log(`Статистика: http://localhost:${PORT}/stats`);
    });
  })
  .catch(err => {
    console.error('Ошибка подключения к БД:', err);
    process.exit(1);
  });