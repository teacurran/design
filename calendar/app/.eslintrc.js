module.exports = {
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      extends: 'love',
      parserOptions: {
        ecmaVersion: 2023
      },
      rules: {
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        "@typescript-eslint/consistent-type-definitions": "off",
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",

        // Consider removing these rule disables for more type safety in your app ✨
        // "@typescript-eslint/no-explicit-any": "off",
        // "@typescript-eslint/no-floating-promises": "off",
        // "@typescript-eslint/no-misused-promises": "off",
        // "@typescript-eslint/no-unsafe-assignment": "off",
        // "@typescript-eslint/no-unsafe-argument": "off",
        // "@typescript-eslint/no-unsafe-call": "off",
        // "@typescript-eslint/no-unsafe-return": "off",
        // "@typescript-eslint/no-unsafe-member-access": "off",
        // "@typescript-eslint/require-await": "off",
        "@typescript-eslint/return-await": "off",
      }
    }
  ],
}
