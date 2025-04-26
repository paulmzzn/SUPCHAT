///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL 
///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL 
///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL 

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserModel from '../models/User.js';

export const googleStrategy = new GoogleStrategy({
  clientID: 'REDACTED',
  clientSecret: 'REDACTED',
  callbackURL: 'http://192.168.223.1:3000/api/users/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile); // Pour le débogage

    const user = await UserModel.findOrCreateUser({
      nom: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      photo_de_profil: profile.photos[0].value
    });

    console.log('User after findOrCreate:', user); // Debug log

    if (!user) {
      return done(null, false);
    }

    // Vérifier que l'ID utilisateur existe
    if (!user.id_utilisateur) {
      console.error('User ID missing:', user);
      return done(new Error('User ID missing'));
    }

    return done(null, user);
  } catch (error) {
    console.error('Erreur dans la stratégie Google:', error);
    return done(error, null);
  }
});

// Sérialisation : stocker uniquement l'ID
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.id_utilisateur); // Debug log
  if (!user.id_utilisateur) {
    return done(new Error('User ID missing during serialization'));
  }
  done(null, user.id_utilisateur);
});

// Désérialisation : récupérer l'utilisateur complet
passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user ID:', id); // Debug log
    const user = await UserModel.getUserById(id);
    if (!user) {
      console.log('No user found with ID:', id);
      return done(null, false);
    }
    console.log('Deserialized user:', user); // Debug log
    done(null, user);
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error, null);
  }
});