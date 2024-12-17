module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
      id_message: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      contenu: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      date_envoi: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      fk_canal: {
        type: DataTypes.UUID,
        allowNull: false
      },
      fk_utilisateur: {
        type: DataTypes.UUID,
        allowNull: false
      }
    }, {
      tableName: 'message',
      timestamps: false
    });
  
    return Message;
  };