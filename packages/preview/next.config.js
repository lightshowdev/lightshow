const path = require('path');
module.exports = {
  basePath: '/preview',
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Prevent duplicate versions from peer dependencies
    config.resolveLoader.alias['react'] = path.resolve('./node_modules/react');

    return config;
  },
};
