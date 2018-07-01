First, thank you for contributing to DIM! We're a community-driven project and we appreciate improvements large and small.

Here are some tips to make sure your pull request can be merged smoothly:

1. If you want to add a feature or make some change to DIM, consider [filing an issue](https://github.com/DestinyItemManager/DIM/issues/new) describing your idea first. This will give the DIM community a chance to discuss the idea, offer suggestions and pointers, and make sure what you're thinking of fits with the style and direction of DIM. If you want a more free-form chat, [join our Discord](https://discordapp.com/invite/UK2GWC7).
2. Resist the temptation to change more than one thing in your PR. Keeping PRs focused on a single change makes them much easier to review and accept. If you want to change multiple things, or clean up/refactor the code, make a new branch and submit those changes as a separate PR.
3. Please follow the existing style of DIM code when making your changes. While there's certainly room for improvement in the DIM codebase, if everybody used their favorite code style nothing would match up.
4. You can use any ES6/ES2015 features - we use Babel to compile out any features too new for browsers. We are also encouraging developers to write new code in [TypeScript](https://typescriptlang.org) and to use React instead of AngularJS where possible.
5. Take advantage of the [native JavaScript Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) and the [Underscore](http://underscorejs.org) library to write compact, easy-to-understand code.
6. Be sure to run `yarn run lint` before submitting your PR - it'll catch most style problems and make things much easier to merge.
7. Don't forget to add a description of your change to `CHANGELOG.md` so it'll be included in the release notes!

If you're looking to get started contributing to DIM, check out the [Quick Start](https://github.com/DestinyItemManager/DIM#quick-start) section of our README.
