// channel.js
export default (sequelize, DataTypes) => {
  const Channel = sequelize.define('Channel', {
    id_canal: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fk_workspace: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'canal',
    timestamps: false
  });

  return Channel;
};