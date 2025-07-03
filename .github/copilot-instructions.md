# General DIM Code Style

Always follow the [Contributing Guide](/docs/CONTRIBUTING.md).

## JS

- Pure JavaScript files should be named in lowercase kebab-case, with a .ts extension. These should not use a default export.
- Files with JSX should be named in PascalCase with a .tsx extension. In general we should have a separate file for each component. The component should be that module's default export, and the file should have the same name as the component.
- Prefer using "function" to declare functions over const arrow functions.

## CSS

- All CSS should be put in CSS modules. The CSS module file should have the same name as the file it is used from but with the extension .m.scss. The classes from the module should be imported as `styles` and referenced in JSX.
- Do not use inline styles.
- Do not use string classNames, only use CSS modules.
- Use the clsx helper to combine classNames or conditionally include classes.

## Tests

- For unit tests, prefer defining a table of inputs and expected outputs, and then looping through that to create tests. This is also called "table-style testing".
- Run `pnpm test -- -u` to update snapshots. This is especially necessary when adding new search terms.
- Run `pnpm build:beta` to make sure the code builds.
- Run `pnpm test` to run all tests.

## Localization

- Only ever add strings to `config/i18n.json`. Then run `pnpm i18n` and commit the updated `src/locale/en.json` file.
