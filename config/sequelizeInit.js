// config/sequelizeInit.js
import { Sequelize, DataTypes } from 'sequelize';
import configModule from '../config/config.js';
import UserModel from '../models/user.js';
import WorkspaceModel from '../models/workspace.js';
import ChannelModel from '../models/channel.js';
import MessageModel from '../models/message.js';

const env = process.env.NODE_ENV || 'development';
const config = configModule[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importer les modèles
db.User = UserModel(sequelize, DataTypes);
db.Workspace = WorkspaceModel(sequelize, DataTypes);
db.Channel = ChannelModel(sequelize, DataTypes);
db.Message = MessageModel(sequelize, DataTypes);

// Définir les associations
db.Workspace.hasMany(db.Channel, { foreignKey: 'fk_workspace' });
db.Channel.belongsTo(db.Workspace, { foreignKey: 'fk_workspace' });

db.Channel.hasMany(db.Message, { foreignKey: 'fk_canal' });
db.Message.belongsTo(db.Channel, { foreignKey: 'fk_canal' });

db.User.hasMany(db.Message, { foreignKey: 'fk_utilisateur' });
db.Message.belongsTo(db.User, { foreignKey: 'fk_utilisateur' });

export default db;