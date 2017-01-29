# Destiny Item Manager

[![Build Status](https://travis-ci.org/DestinyItemManager/DIM.svg?branch=master)](https://travis-ci.org/DestinyItemManager/DIM)

Destiny Item Manager (DIM) lets [Destiny](http://destinythegame.com/)  game players easily move items between their Guardians and the Vault. DIM's goal is to let players equip their guardians quickly. Our Loadouts feature accomplishes this by removing manual steps needed when transferring items.

Loadouts give players the ability to define sets of items that they want on their Guardians. When a loadout is selected, DIM will move all of the items referenced by the Loadout to a Guardian. If the item was equipped by another guardian, the Loadouts feature will replace that item with a similar item, if possible, to allow the Loadout referenced item to be transferred. With a single click of a button, you can have a PVP, PVE, or Raid-ready guardian.

DIM is based on the same services used by the Destiny Companion app to move and equip items. DIM will never ask for your credentials to [Bungie.net](https://www.bungie.net).  Once logged into Bungie.net, DIM will be able to see your Guardians inventory and Vault.  Once you logout of Bungie, DIM will no longer have access to your Guardians or Vault.

DIM will not be able to dismantle any of your items.

To get started with DIM, download the extension from the [Chrome Store](https://chrome.google.com/webstore/detail/destiny-item-manager/apghicjnekejhfancbkahkhdckhdagna).

To beta test new features in DIM, download the beta extension from the [Chrome Store](https://chrome.google.com/webstore/detail/destiny-item-manager-beta/mkiipknpfaacbjdagdeppdacpgpdjklc).

## Translation

If you speak a language other than English that Destiny supports (Italian, German, French, Spanish, Japanese, or Portuguese), a great way to help with DIM development is to provide translations. See [the Translation guide](https://github.com/DestinyItemManager/DIM/blob/dev/TRANSLATIONS.md) for more info on how to help.


##Requirements
DIM is an extension that runs within the Chrome Desktop Web Browser.

##Quick start

Clone the repo:

* `git clone https://github.com/DestinyItemManager/DIM.git`

Install dependencies:

* `npm install`
* Windows-based developers will need to install `windows-build-tools` (`npm install --global windows-build-tools`) globally prior to running `npm install`. Refer to issue #1439 for [details](https://github.com/DestinyItemManager/DIM/issues/1439).

Check code Style
* `npm run lint` will tell you if you're following the DIM code style (and automatically fix what it can).

Build in dev mode (extension)
* `npm start`. This will bundle and copy all the assets, as well as watch for changes. You can now run DIM locally by enabling [Chrome Extensions Developer Mode](https://developer.chrome.com/extensions/faq#faq-dev-01) and point to the `dist` folder.

Build in dev mode (website)
* `npm run server`. Visit the URL it prints out to load DIM. It will update automatically as you change files.

Get your own API key:

* Goto [Bungie](https://www.bungie.net/en/Application)
* Open your extension in another tab, copy the url up to `/index.html`.
* Paste your extension url into the `Origin Header` section on bungie.net
* Copy your API-key from bungie.net into DIM developer settings panel when it is loaded.

Check out our [contributor guide](https://github.com/DestinyItemManager/DIM/blob/dev/CONTRIBUTING.md) for more tips.

##Bugs and feature requests

Have a bug or a feature request? Please first search for [existing and closed issues](https://github.com/DestinyItemManager/DIM/issues). If your problem or idea is not addressed yet, please open a new issue.

##Community
Keep track of development and community news.

Follow the conversation on [reddit](http://www.reddit.com/r/DestinyItemManager/) and talk to other users of DIM.  This is where we posts updates to DIM.

##License
Code released under [the MIT license](http://choosealicense.com/licenses/mit/).
