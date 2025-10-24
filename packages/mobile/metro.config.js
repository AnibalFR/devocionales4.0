const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
