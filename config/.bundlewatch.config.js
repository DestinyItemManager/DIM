const bundlewatchConfig = {
  files: [
    {
      path: 'dist/*.js',
      maxSize: '512kB',
      compression: 'brotli',
    },
  ],
  normalizeFilenames: '^.+?((-[0-9a-f]{6})?(-[0-9a-f]{16})?).js$',
  ci: {
    githubAccessToken: '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',
  },
};

module.exports = bundlewatchConfig;
