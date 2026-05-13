const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve zustand's CJS builds instead of ESM (which uses
// import.meta that Metro doesn't transpile, causing a SyntaxError at runtime).
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
