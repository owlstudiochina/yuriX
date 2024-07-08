module.exports = {
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  // 使用正则表达式匹配所有__tests__文件夹中的xxx.spec.js或者xxx.test.js
  testMatch: ['**/__tests__/**/*.(spec|test).js'],

  // 其他配置项
  verbose: true,
  testEnvironment: 'jsdom',
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/'],
};
