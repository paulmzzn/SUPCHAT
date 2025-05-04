///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL
///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL
///QUAND MISE EN LIGNE, CHANGER LE CALLBACK URL

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import UserModel from "../models/User.js";

<<<<<<< HEAD
export const googleStrategy = new GoogleStrategy(
  {
    clientID:
      "REDACTED",
    clientSecret: "REDACTED",
    callbackURL: "http://192.168.1.107:3000/api/users/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log("Google profile:", profile); // Pour le débogage
=======
export const googleStrategy = new GoogleStrategy({
  clientID: 'REDACTED',
  clientSecret: 'REDACTED',

  callbackURL: 'http://192.168.252.234:3000/api/users/auth/google/callback'

}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile); // Pour le débogage

>>>>>>> 6050c0e09738175ec30d2b9614d3c0e6e7cdc0ef

      const user = await UserModel.findOrCreateUser({
        nom: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        photo_de_profil: profile.photos[0].value,
      });

      console.log("User after findOrCreate:", user); // Debug log

      if (!user) {
        return done(null, false);
      }

      // Vérifier que l'ID utilisateur existe
      if (!user.id_utilisateur) {
        console.error("User ID missing:", user);
        return done(new Error("User ID missing"));
      }

      return done(null, user);
    } catch (error) {
      console.error("Erreur dans la stratégie Google:", error);
      return done(error, null);
    }
  }
);

<<<<<<< HEAD
export const githubStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://192.168.1.107:3000/api/users/auth/github/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Récupérer l'email principal
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        // Prend l'email principal et vérifié
        email =
          profile.emails.find((e) => e.primary && e.verified)?.value ||
          profile.emails.find((e) => e.primary)?.value ||
          profile.emails.find((e) => e.verified)?.value ||
          profile.emails[0].value;
=======

export const githubStrategy = new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,

  callbackURL: 'http://192.168.252.234:3000/api/users/auth/github/callback'

}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Récupérer l'email principal
    let email = null;
    if (profile.emails && profile.emails.length > 0) {
      // Prend l'email principal et vérifié
      email = profile.emails.find(e => e.primary && e.verified)?.value
        || profile.emails.find(e => e.primary)?.value
        || profile.emails.find(e => e.verified)?.value
        || profile.emails[0].value;
    }
    // Si toujours pas d'email, tente de récupérer via l'API GitHub
    if (!email) {
      // Utilise l'API GitHub pour récupérer les emails (nécessite le scope user:email)
      const fetch = (await import('node-fetch')).default;
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'SUPCHAT-App'
        }
      });
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        if (Array.isArray(emailsData)) {
          email = emailsData.find(e => e.primary && e.verified)?.email
            || emailsData.find(e => e.primary)?.email
            || emailsData.find(e => e.verified)?.email
            || emailsData[0]?.email;
        }
>>>>>>> 6050c0e09738175ec30d2b9614d3c0e6e7cdc0ef
      }
      // Si toujours pas d'email, tente de récupérer via l'API GitHub
      if (!email) {
        // Utilise l'API GitHub pour récupérer les emails (nécessite le scope user:email)
        const fetch = (await import("node-fetch")).default;
        const emailsResponse = await fetch(
          "https://api.github.com/user/emails",
          {
            headers: {
              Authorization: `token ${accessToken}`,
              "User-Agent": "SUPCHAT-App",
            },
          }
        );
        if (emailsResponse.ok) {
          const emailsData = await emailsResponse.json();
          if (Array.isArray(emailsData)) {
            email =
              emailsData.find((e) => e.primary && e.verified)?.email ||
              emailsData.find((e) => e.primary)?.email ||
              emailsData.find((e) => e.verified)?.email ||
              emailsData[0]?.email;
          }
        }
        if (!email) {
          return done(
            new Error(
              "Votre compte GitHub ne fournit pas d'email public ou vérifié. Veuillez vérifier vos paramètres GitHub ou utiliser un autre moyen de connexion."
            ),
            null
          );
        }
      }
      const user = await UserModel.findOrCreateUser({
        nom: profile.displayName || profile.username,
        email,
        githubId: profile.id,
        photo_de_profil:
          profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      });
      if (!user || !user.id_utilisateur) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
);

// Sérialisation : stocker uniquement l'ID
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id_utilisateur); // Debug log
  if (!user.id_utilisateur) {
    return done(new Error("User ID missing during serialization"));
  }
  done(null, user.id_utilisateur);
});

// Désérialisation : récupérer l'utilisateur complet
passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user ID:", id); // Debug log
    const user = await UserModel.getUserById(id);
    if (!user) {
      console.log("No user found with ID:", id);
      return done(null, false);
    }
    console.log("Deserialized user:", user); // Debug log
    done(null, user);
  } catch (error) {
    console.error("Deserialize error:", error);
    done(error, null);
  }
});
