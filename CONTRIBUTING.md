## Developer Quick start
Clone the repo:

* `git clone https://github.com/DestinyItemManager/DIM.git`

Install dependencies:

* Install [NodeJS](https://nodejs.org/).
* Install [Yarn](https://yarnpkg.com/en/docs/install). If you're used to NPM, see "[Migrating from NPM](https://yarnpkg.com/lang/en/docs/migrating-from-npm/)". If you were already using NPM with DIM, run `yarn` to convert to Yarn. **Note (2018/4/25): Yarn from Homebrew will come with NodeJS 10, which isn't ready for prime time. Either install via `npm install -g yarn` or downgrade Node after installing.**
* Windows-based developers will need to install `windows-build-tools` (`yarn global add windows-build-tools`) globally prior to running `yarn install`. Refer to issue #1439 for [details](https://github.com/DestinyItemManager/DIM/issues/1439).
* Linux-based developers will need to install `build-essential` (`sudo apt-get install -y build-essential`) prior to runninng `yarn install`.
* Run `yarn install`.
  * Note that on Windows, the Git Bash shell may fail to fetch all necessary packages even when run as Admin ([details](https://github.com/DestinyItemManager/DIM/issues/2487)). If that's the case, simply use cmd as Admin instead.
* It is highly recommended to use [VSCode](https://code.visualstudio.com/) to work on DIM. When you open DIM in VSCode, accept the recommended plugins it suggests.

Check code Style
* `yarn lint` will tell you if you're following the DIM code style (and automatically fix what it can).

Run your own local web server
* Run `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem -subj '/CN=www.mydom.com/O=My Company Name LTD./C=US'` to generate server certificates.
* After the one-time setup, run `yarn start` and you're off to the races. Changes to CSS or React components should show up automatically without needing to reload the page (watch the console for details).

Get your own API key:

1. Goto [Bungie](https://www.bungie.net/en/Application)
1. Click `Create New App`
1. Enter any application name, and `https://github.com/YourGithubUsername/DIM`
1. For `Oauth Client type` select `Confidential`
1. Set your redirect url to `https://127.0.0.1:8080/return.html` (or whatever the IP or hostname is of your dev server)
1. Select all scopes _except_ the Administrate Groups/Clans
1. Enter `https://127.0.0.1:8080` as the `Origin Header`
1. Run `yarn install && yarn start`
1. Copy your API-key, Oauth Client_id, and OAuth client_secret from bungie.net into DIM developer settings panel when it is loaded.

Check out the [docs](https://github.com/DestinyItemManager/DIM/blob/master/docs) folder for more tips.
