const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const configPath = path.resolve(__dirname, '..', 'config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))['development'];

// Используйте переменную окружения DB_HOST, если задана, иначе значение из config.json
const dbHost = process.env.DB_HOST || config.host;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: dbHost,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging || false,
    ...(config.storage ? { storage: config.storage } : {})
  }
);

const db = {};
db.sequelize = sequelize;
db.Source = require('./source')(sequelize, Sequelize.DataTypes);
db.Article = require('./article')(sequelize, Sequelize.DataTypes);
db.Job = require('./job')(sequelize, Sequelize.DataTypes);

Object.values(db)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(db));

module.exports = db;
