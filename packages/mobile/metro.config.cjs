/**
 * Metro configuration for the CAP mobile app.
 *
 * Extends the official Expo Metro config (so asset registry, JSX, and Expo
 * transforms work) and adds the `@cap/shared` TypeScript-source sibling package
 * so web and mobile share the same domain/validation/service contracts without
 * a separate build step.
 */

const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const sharedPath = path.resolve(projectRoot, '..', 'shared')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [sharedPath]

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@cap/shared': path.join(sharedPath, 'src', 'index.ts'),
}

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
]

// Let Metro transpile the shared TypeScript source.
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'ts', 'tsx', 'json']

module.exports = config
