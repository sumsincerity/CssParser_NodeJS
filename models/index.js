const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const configPath = path.resolve(__dirname, '..', 'config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))['development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
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