# Destiny Item Manager
Destiny Item Manager (DIM) lets players the game [Destiny](http://destinythegame.com/) to easily move items between their Guardians and the Vault. The goals of DIM is to let players equip their guardians quickly.  It does this by removing manual steps needed when transfering items and with our Loadouts feature.  

Loadouts give players the ability to define sets of items that they want on their Guardians.  When a loadout is selected, DIM will move the items referenced by the Loadout to a Guardian.  IF the item was equipped by another guardian, the Loadouts feature will replace that item with a similar item, if possible, to allow the Loadout referenced item to be transfered.  With a single click of a button, you can have a PVP, PVE, or Raid-ready guardian.

DIM is based on the same services used by the Destiny Companion app to move and equip items. DIM will never ask for your credentials to [Bungie.net](http;//bungie.net).  Once logged into Bungie.net, DIM will be able to see your Guardians inventory and Vault.  Once you logout of Bungie, DIM will no longer have access to your Guardians or Vault.  

DIM will not be able to dismantle any of your items.  

To get started with DIM, download the extension from the [Chrome Store](https://chrome.google.com/webstore/detail/destiny-item-manager/apghicjnekejhfancbkahkhdckhdagna).

##Requirements
DIM is an extension that runs within the Chrome Desktop Web Browser.

##Quick start

Clone the repo: git clone https://github.com/kyleshay/DIM.

Install dependencies: `bower install` (if you don't already have bower installed, install it with `npm install -g bower`)

You can run this locally by enabling [Chrome Extensions Developer Mode](https://developer.chrome.com/extensions/faq#faq-dev-01) and point to the `app/` folder.

##Bugs and feature requests

Have a bug or a feature request? Please first search for [existing and closed issues](https://github.com/kyleshay/DIM/issues). If your problem or idea is not addressed yet, please open a new issue.


##Community
Keep track of development and community news.

Follow the conversation on [reddit](http://www.reddit.com/r/DestinyItemManager/) and talk to other users of DIM.  This is where we posts updates to DIM.

Chat with the developers on gitter.im.  [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kyleshay/DIM?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=body_badge).

##License
Code released under [the MIT license](http://choosealicense.com/licenses/mit/).
