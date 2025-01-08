// Exporter les modèles
export const User = db.User;
export const Workspace = db.Workspace;
export const Channel = db.Channel;
export const Message = db.Message;

const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importer les modèles
db.User = require('../models/user.js')(sequelize, DataTypes);
db.Workspace = require('../models/workspace.js')(sequelize, DataTypes);
db.Channel = require('../models/channel.js')(sequelize, DataTypes);
db.Message = require('../models/message.js')(sequelize, DataTypes); // Assurez-vous que ceci correspond exactement au nom du fichier

// Définir les associations
db.Workspace.hasMany(db.Channel, { foreignKey: 'fk_workspace' });
db.Channel.belongsTo(db.Workspace, { foreignKey: 'fk_workspace' });

db.Channel.hasMany(db.Message, { foreignKey: 'fk_canal' });
db.Message.belongsTo(db.Channel, { foreignKey: 'fk_canal' });

db.User.hasMany(db.Message, { foreignKey: 'fk_utilisateur' });
db.Message.belongsTo(db.User, { foreignKey: 'fk_utilisateur' });

module.exports = db; // Exportation par défaut


