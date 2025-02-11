///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL 
///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL 
///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL 

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserModel from '../models/User.js';

export const googleStrategy = new GoogleStrategy({
  clientID: 'REDACTED',
  clientSecret: 'REDACTED',
  callbackURL: 'http://localhost:3000/api/users/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await UserModel.findOrCreateUser({
      nom: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      photo_de_profil: profile.photos[0].value
    });
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
});

passport.serializeUser((user, done) => {
  done(null, user.id_utilisateur);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});