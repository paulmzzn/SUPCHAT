module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id_utilisateur: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      nom: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      mot_de_passe: {
        type: DataTypes.STRING,
        allowNull: false
      },
      photo_de_profil: {
        type: DataTypes.STRING
      },
      date_creation: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      fk_statut: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      tableName: 'utilisateur',
      timestamps: false
    });
  
    return User;
  };