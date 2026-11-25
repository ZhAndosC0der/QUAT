const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// expo-sqlite includes a WebAssembly asset in its web bundle.
if (!config.resolver.assetExts.includes('wasm')) config.resolver.assetExts.push('wasm');
module.exports = config;
