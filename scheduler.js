const { Source } = require('./models'); // чтобы проверить подключение
const cron = require('node-cron');
const { sitesConfig, runScheduledJob } = require('./fetchdata');

// Функция ожидания подключения к БД
async function waitForDatabase() {
  const maxAttempts = 30;
  const delayMs = 2000; // 2 секунды

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await Source.sequelize.authenticate();
      console.log('✅ Подключение к PostgreSQL успешно');
      return true;
    } catch (error) {
      console.log(`Попытка ${i}/${maxAttempts}: ожидание БД...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.error('❌ Не удалось подключиться к базе данных после всех попыток');
  process.exit(1);
}


async function runMigrations() {
  const { execSync } = require('child_process');
  try {
    console.log('🔧 Выполнение миграций...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграций');
    process.exit(1);
  }
}


async function start() {
  await waitForDatabase();
  await runMigrations();

  console.log('🕒 Запуск планировщика: полный парсинг');
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Запуск цикла парсинга всех источников...');
    for (const site of sitesConfig) {
        await runScheduledJob(site.name);
    }
    console.log('✅ Цикл парсинга завершён');
  });
}

start().catch(console.error);