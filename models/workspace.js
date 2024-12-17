module.exports = (sequelize, DataTypes) => {
    const Workspace = sequelize.define('Workspace', {
      id_workspace: {
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
      }
    }, {
      tableName: 'workspace',
      timestamps: false
    });
  
    return Workspace;
  };