const esmModules = [
  'cbor-x',
  'electric-sql',
  'jose',
  'wa-sqlite',
  '@automerge/automerge-repo',
  '@libsql/client',
  '@libsql/hrana-client',
  '@libsql/isomorphic-fetch',
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
};
