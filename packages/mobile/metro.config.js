const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for ESM packages like @gluestack-ui
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Add unstable_enablePackageExports to support package.json "exports" field
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
