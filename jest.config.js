const esmModules = [
  'cbor-x',
  'electric-sql',
  'jose',
  'wa-sqlite',
  '@automerge/automerge-repo',
  '@journeyapps/powersync-sdk-common',
  '@journeyapps/powersync-sdk-web',
  '@journeyapps/wa-sqlite',
  '@sqlite\\.org/sqlite-wasm',
  '@vlcn\\.io/crsqlite-wasm',
  '@vlcn\\.io/wa-sqlite',
  '@vlcn\\.io/xplat-api',
];

export default {
  verbose: false,
  resolver: '<rootDir>/test/jest/resolver.cjs',
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(' + esmModules.join('|') + ')/.*)',
  ],
  transform: {'^.+\\.(mjs|js|jsx|ts|tsx)?$': 'babel-jest'},
  setupFiles: ['jsdom-worker'],
};
