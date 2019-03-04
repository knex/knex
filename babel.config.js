'use strict';

const isDev = process.env.npm_lifecycle_event === 'dev';

module.exports = function(api) {
  const presets = [
    [
      '@babel/preset-env',
      Object.assign(
        {},
        isDev ? { targets: { node: 'current' } } : { targets: { node: 6 } }
      ),
    ],
  ];
  const plugins = ['add-module-exports'];

  api.cache(() => process.env.NODE_ENV); // Invalidate cache when building for a different environment
  return {
    presets,
    plugins,
  };
};
