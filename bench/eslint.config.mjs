import { configs as sharedConfigs } from '@3846masa/configs/eslint/config.mjs';
import globals from 'globals';

const configs = [
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  ...sharedConfigs,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'sort/object-properties': "off",
      'sort/type-properties': "off",
      'sort/destructuring-properties': "off",
      'no-console': 'off',
      'no-restricted-imports': ['error', 'consola'],
    },
  },
];

export default configs;
