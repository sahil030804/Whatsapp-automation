const { Sequelize } = require('sequelize');
const sequelizeConfig = require('../config/sequelizeConfig');
const { application } = require('../config');

const env = application.environment || 'development';
const config = sequelizeConfig[env];

if (!config) {
  throw new Error(`No configuration found for environment: ${env}`);
}

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    pool: config.pool,
    logging: config.logging,
    define: config.define,
    dialectOptions: config.dialectOptions
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes, Sequelize);
const WhatsAppAccount = require('./WhatsAppAccount')(sequelize, Sequelize.DataTypes, Sequelize);
const KnowledgeBase = require('./KnowledgeBase')(sequelize, Sequelize.DataTypes, Sequelize);
const KnowledgeChunk = require('./KnowledgeChunk')(sequelize, Sequelize.DataTypes, Sequelize);
const Conversation = require('./Conversation')(sequelize, Sequelize.DataTypes, Sequelize);
const Message = require('./Message')(sequelize, Sequelize.DataTypes, Sequelize);

// Create associations
const models = {
  User,
  WhatsAppAccount,
  KnowledgeBase,
  KnowledgeChunk,
  Conversation,
  Message
};

// Setup associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export sequelize instance and models
module.exports = {
  sequelize,
  Sequelize,
  ...models
};
