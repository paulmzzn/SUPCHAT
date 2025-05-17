// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Désactiver la vérification du Hot Module Replacement pour Hermes
// Cela résout généralement les problèmes de compatibilité avec ReactRefreshRuntime
config.resolver.resolverMainFields = ['hermes', 'react-native', 'browser', 'main'];

// Configurations supplémentaires pour améliorer la compatibilité entre Hermes et React Refresh
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {},
  // Configuration pour éviter les problèmes avec ReactRefreshRuntime
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;