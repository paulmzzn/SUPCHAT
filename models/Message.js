// models/messageModel.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Importe ton instance Sequelize

const Message = sequelize.define('Message', {
  id_message: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fk_channel: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  fk_user: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'messages',
  timestamps: true,  // ou false selon tes préférences
});

export default Message;