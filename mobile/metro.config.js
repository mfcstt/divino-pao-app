const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Adiciona suporte a extensões .mjs (utilizado por lucide-react-native)
config.resolver.sourceExts.push("mjs");

module.exports = withNativeWind(config, { input: "./global.css" });
