import cssModules from '@bhollis/eslint-plugin-css-modules';
import react from '@eslint-react/eslint-plugin';
import { fixupPluginRules } from '@eslint/compat';
import eslint from '@eslint/js';
import arrayFunc from 'eslint-plugin-array-func';
import github from 'eslint-plugin-github';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import * as regexpPlugin from 'eslint-plugin-regexp';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// TODO: different configs for JS vs TS
export default tseslint.config(
  { name: 'eslint/recommended', ...eslint.configs.recommended },
  ...tseslint.configs.recommendedTypeChecked,
  {
    name: 'typescript-eslint/parser-options',
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...tseslint.configs.stylisticTypeChecked,
  regexpPlugin.configs['flat/recommended'],
  {
    name: 'react',
    ...reactPlugin.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
        linkComponents: [
          // Components used as alternatives to <a> for linking, eg. <Link to={ url } />, from React Router
          { name: 'Link', linkAttribute: 'to' },
          { name: 'NavLink', linkAttribute: 'to' },
        ],
      },
    },
  },
  { name: 'array-func', ...arrayFunc.configs.all },
  {
    name: 'css-modules',
    plugins: {
      'css-modules': cssModules,
    },
    rules: { 'css-modules/no-unused-class': ['error', { camelCase: true }] },
  },
  { name: 'sonarjs/recommended', ...sonarjs.configs.recommended },
  {
    ...reactHooks.configs.flat.recommended,
    rules: {
      // Core hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // TODO: Enable react compiler rules when they are fixed and we are using
      // react compiler. Until then they are noisy and slow.
    },
  },
  {
    // We want to choose which rules to enable from the github plugin, not use a preset.
    name: 'github',
    plugins: {
      github: fixupPluginRules(github),
    },
    rules: {
      'github/array-foreach': 'error',
      'github/async-currenttarget': 'error',
      'github/async-preventdefault': 'error',
      'github/no-innerText': 'error',
    },
  },
  {
    name: 'jsx-a11y',
    files: ['**/*.tsx'],
    plugins: {
      'jsx-a11y': fixupPluginRules(jsxA11y),
    },
    rules: {
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/autocomplete-valid': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
    },
  },
  {
    name: 'eslint-react',
    ...react.configs['recommended-type-checked'],
  },
  {
    name: 'global ignores',
    ignores: [
      '*.m.scss.d.ts',
      '*.m.css.d.ts',
      'src/build-browsercheck-utils.js',
      'src/testing/jest-setup.cjs',
      'src/fa-subset.js',
      'src/data/font/symbol-name-sources.ts', // TODO: fix the source!
    ],
  },
  {
    name: 'dim-custom',
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // TODO: limit to service worker
        ...globals.serviceworker,
        ...globals.es2021,
        $featureFlags: 'readonly',
        ga: 'readonly',
        $DIM_FLAVOR: 'readonly',
        $DIM_VERSION: 'readonly',
        $DIM_BUILD_DATE: 'readonly',
        $DIM_WEB_API_KEY: 'readonly',
        $DIM_WEB_CLIENT_ID: 'readonly',
        $DIM_WEB_CLIENT_SECRET: 'readonly',
        $DIM_API_KEY: 'readonly',
        $BROWSERS: 'readonly',
        workbox: 'readonly',
        React: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-alert': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-empty': 'off',
      'no-implicit-coercion': 'error',
      'no-restricted-globals': [
        'error',
        'name',
        'location',
        'history',
        'menubar',
        'scrollbars',
        'statusbar',
        'toolbar',
        'status',
        'closed',
        'frames',
        'length',
        'top',
        'opener',
        'parent',
        'origin',
        'external',
        'screen',
        'defaultstatus',
        'crypto',
        'close',
        'find',
        'focus',
        'open',
        'print',
        'scroll',
        'stop',
        'chrome',
        'caches',
        'scheduler',
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['testing/*'],
              message: 'You cannot use test helpers in regular code.',
            },
          ],
          paths: [
            {
              name: 'i18next',
              importNames: ['t'],
              message: 'Please import t from app/i18next-t.',
            },
            {
              name: 'es-toolkit',
              importNames: [
                'compact',
                'mapValues',
                'isEmpty',
                'sortBy',
                'count',
                'invert',
                'sumBy',
                'take',
                'noop',
              ],
              message:
                'Please use functions from app/util/collections or native equivalents instead.',
            },
            {
              name: 'es-toolkit',
              importNames: ['uniq'],
              message: 'Please use Array.from(new Set(foo)) or [...new Set(foo)] instead.',
            },
            {
              name: 'es-toolkit',
              importNames: ['uniqBy'],
              message: 'Please use the uniqBy from app/utils/util instead',
            },
            {
              name: 'es-toolkit',
              importNames: ['groupBy'],
              message: 'Use Object.groupBy or Map.groupBy instead.',
            },
            {
              name: 'es-toolkit',
              importNames: ['cloneDeep'],
              message: 'Use structuredClone instead.',
            },
            {
              name: 'es-toolkit',
              importNames: ['sortBy'],
              message:
                'Use the native .sort or .toSorted functions with compareBy and chainComparator.',
            },
            {
              name: 'es-toolkit',
              importNames: ['compact'],
              message: 'Use the compact function from app/util/collections instead.',
            },
            {
              name: 'es-toolkit',
              importNames: ['isEmpty'],
              message: 'Use the isEmpty function from app/util/collections instead.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='compact'][arguments.0.callee.property.name='map']",
          message: 'Please use `filterMap` instead',
        },
        {
          selector:
            "CallExpression[callee.name='clsx'][arguments.length=1][arguments.0.object.name='styles'],CallExpression[callee.name='clsx'][arguments.length=1][arguments.0.type='Literal']",
          message: 'Unnecessary clsx',
        },
        {
          selector: 'TSEnumDeclaration:not([const=true])',
          message: 'Please only use `const enum`s.',
        },
      ],
      // TODO: Switch to @stylistic/eslint-plugin-js for this one rule
      'spaced-comment': [
        'error',
        'always',
        { exceptions: ['@__INLINE__'], block: { balanced: true } },
      ],
      'arrow-body-style': ['error', 'as-needed'],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-return-await': 'off',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      'prefer-regex-literals': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-spread': 'error',
      radix: 'error',
      yoda: ['error', 'never', { exceptRange: true }],
      'prefer-template': 'error',
      'class-methods-use-this': ['error', { exceptMethods: ['render'] }],
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-private-class-members': 'error',
      'func-name-matching': 'error',
      'logical-assignment-operators': 'error',
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-no-target-blank': 'off',
      'react/display-name': 'off',
      'react/prefer-stateless-function': 'warn',
      'react/no-access-state-in-setstate': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-children-prop': 'error',
      'react/no-unused-state': 'error',
      'react/button-has-type': 'error',
      'react/prop-types': 'off',
      'react/self-closing-comp': 'error',
      'react/function-component-definition': 'error',
      'react/no-redundant-should-component-update': 'error',
      'react/no-unsafe': 'error',
      'react/jsx-no-constructed-context-values': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never', propElementValues: 'always' },
      ],
      'react/iframe-missing-sandbox': 'error',
      'react/jsx-key': 'off',
      'react/forbid-component-props': [
        'error',
        {
          forbid: [
            'onMouseEnter',
            'onMouseLeave',
            'onMouseOver',
            'onMouseOut',
            'onTouchStart',
            'onTouchEnd',
            'onTouchCancel',
          ],
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/non-nullable-type-assertion-style': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_.',
          argsIgnorePattern: '^_.',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'off',
        {
          ignoreConditionalTests: true,
          ignoreTernaryTests: false,
          ignoreMixedLogicalExpressions: true,
          ignorePrimitives: {
            boolean: true,
            number: false,
            string: true,
          },
        },
      ],
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      'no-implied-eval': 'off',
      '@typescript-eslint/no-implied-eval': 'error',
      'array-func/prefer-array-from': 'off',
      'react/no-unused-prop-types': 'off',
      'css-modules/no-undef-class': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-small-switch': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/prefer-immediate-return': 'off',
      'sonarjs/no-nested-switch': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/no-unstable-default-props': 'off',
      '@eslint-react/naming-convention/component-name': 'warn',
      '@eslint-react/dom/no-dangerously-set-innerhtml': 'off',
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-layout-effect': 'off',
      '@eslint-react/prefer-read-only-props': 'off',
      // This is busted right now
      '@eslint-react/naming-convention/use-state': 'off',
    },
  },
  {
    files: ['src/**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // The process-worker needs to be extra fast, so we disable a few rules here.
    files: ['src/app/loadout-builder/process-worker/**/*.ts'],
    rules: {
      '@typescript-eslint/prefer-for-of': 'off',
    },
  },
  {
    name: 'tests',
    files: ['**/*.test.ts', 'src/testing/**/*.ts'],
    rules: {
      // We don't want to allow importing test modules in app modules, but of course you can do it in other test modules.
      'no-restricted-imports': 'off',
    },
  },
);
