const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

// Use Expo's metro config as the base and extend it for the monorepo layout.
const projectRoot = path.resolve(__dirname);
const mobileRoot = path.resolve(__dirname, 'mobile');

const config = getDefaultConfig(projectRoot);

// Ensure Metro watches the mobile folder and resolves modules from the repo root.
config.watchFolders = config.watchFolders || [];
if (!config.watchFolders.includes(mobileRoot)) {
  config.watchFolders.push(mobileRoot);
}

// Ensure resolver maps to repo-level node_modules to avoid duplicate copies.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = new Proxy({}, {
  get: (target, name) => path.join(projectRoot, `node_modules/${name}`),
});

module.exports = config;

