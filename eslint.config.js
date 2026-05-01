import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import react from '@vitejs/plugin-react';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**/*']
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      'firebase-rules': firebaseRulesPlugin,
    },
    rules: {
      ...firebaseRulesPlugin.configs['flat/recommended'].rules,
    },
  }
);
