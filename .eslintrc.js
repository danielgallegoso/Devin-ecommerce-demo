module.exports =
{
  env: { browser: true, es6: true, node: true },
  extends: ['plugin:react/recommended', 'airbnb'],
  parserOptions:
  {
    ecmaFeatures:
    {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['react'],
  rules: {
    "no-underscore-dangle": 0
  },
  overrides: [
    {
      files: ['**/*.test.js', 'backend/testUtils/**/*.js'],
      env: { jest: true },
      rules: {
        'import/no-extraneous-dependencies': [2, { devDependencies: true }],
        'import/prefer-default-export': 0
      }
    }
  ]
}