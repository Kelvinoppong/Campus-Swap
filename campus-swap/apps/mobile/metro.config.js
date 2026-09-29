// Metro in an npm-workspaces monorepo: watch the whole workspace so edits to
// packages/shared reload the app, and resolve modules from both the app's own
// node_modules and the hoisted root one.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Without this, Metro walks up past the workspace root and can pick up a
// second copy of react-native.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
