const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Utilisé seulement pour la connexion standard
  oauthProvider: { type: String }, // Google/Facebook, etc.
  oauthId: { type: String }, // L'ID OAuth pour l'authentification
  status: {
    type: String,
    enum: ['online', 'offline', 'busy', 'away'],
    default: 'offline',
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
});

export default mongoose.model('User', UserSchema);