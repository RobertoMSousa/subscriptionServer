# README

## Table of Contents

- [Details](#details)
- [Requirements](#requirements)
- [Installation](#installation)
- [Build](#build)
- [Usage](#usage)
- [Testing](#testing)
- [Support](#support)
- [Contributing](#contributing)
- [Credits](#credits)
- [Suggestions](#suggestions)


## Details
### Name
subscriptionServer

### Description
A server that manages the user signIn, signUp process allows the user to subscribe to content and display the content only if the subscription is valid and payments up to date.

### Author
Roberto Sousa


## Requirements
- Install [Node.js](https://nodejs.org/en/)
- Install [MongoDB](https://docs.mongodb.com/manual/installation/)
- Install [VS Code](https://code.visualstudio.com/)


## Installation
- Install dependencies
```
yarn
```
- Start mongoDB locally
```
mongod
```
- Start the local project
```
yarn develop
```

Navigate to `http://localhost:3000`

##Build
| Yarn Script | Description |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `start`                   | Does the same as 'npm run serve'. Can be invoked with `npm start`                                 |
| `build`                   | Full build. Runs ALL build tasks (`build-sass`, `build-ts`, `tslint`, `copy-static-assets`)       |
| `serve`                   | Runs node on `dist/server.js` which is the apps entry point                                       |
| `watch`                   | Runs all watch tasks (TypeScript, Sass, Node). Use this if you're not touching static assets.     |
| `test`                    | Runs tests using Jest test runner                                                                 |
| `build-ts`                | Compiles all source `.ts` files to `.js` files in the `dist` folder                               |
| `watch-ts`                | Same as `build-ts` but continuously watches `.ts` files and re-compiles when needed               |
| `build-sass`              | Compiles all `.scss` files to `.css` files                                                        |
| `watch-sass`              | Same as `build-sass` but continuously watches `.scss` files and re-compiles when needed           |
| `tslint`                  | Runs TSLint on project files                                                                      |
| `copy-static-assets`      | Calls script that copies JS libs, fonts, and images to dist directory                             |
| `develop`                 | Start the project with the dev options on                                                         |


## Testing
For this project, I chose [Jest](https://facebook.github.io/jest/) as our test framework.
While Mocha is probably more common, Mocha seems to be looking for a new maintainer and setting up TypeScript testing in Jest is wicked simple.

## Support
Please [open an issue](<place link here>) for support.

## Credits
This repository was created based on the Microsoft repository provided [here](https://github.com/Microsoft/TypeScript-Node-Starter).

## Suggestions
- [TSLint](https://marketplace.visualstudio.com/items?itemName=eg2.tslint)
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)