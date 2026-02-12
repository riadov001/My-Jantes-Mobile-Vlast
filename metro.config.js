const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimization for large builds
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  compress: {
    reduce_funcs: false,
  },
};

// Handle potential memory issues by disabling large features temporarily
config.transformer.maxWorkers = 2;

module.exports = config;
