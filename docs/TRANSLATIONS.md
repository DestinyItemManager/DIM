# Supported Languages
Due to what information is provided by Bungie about item names and descriptions the following languages are the only languages that will be supported by DIM:
  - English
  - French
  - German
  - Italian
  - Japanese
  - Korean
  - Portuguese (BR)
  - Spanish
  - Spanish (Latin America)
  - Polish
  - Russian
  - Chinese (Traditional)

# Translating DIM

We use [i18next](https://github.com/i18next/ng-i18next) for all our translated strings, so if you want to translate something that's currently English-only, take a look at that. Usually it's as simple as replacing some text with `<span ng-i18next="KEY"></span>` and then defining KEY in the i18n file. Within code, you need to use the `$i18next.t` service - see `D1StoresService` for an example.

# Join the translation team @ Crowdin
 [Crowdin](https://crowdin.com/project/destiny-item-manager/invite?d=65a5l46565176393s2a3p403a3u22323e46383232393h4k4r443o4h3d4c333t2a3j4f453f4f3o4u643g393b343n4)

There are two different roles available per language

| Role | Responsibilities |
|------|------------------|
| Translator | Provide Translations |
| Proofreader | Provide Translations and verify translations of others |

# Translators
Using the 'Show' dropdown menu, select 'Untranslated'.
Translate these to your language.

As translations are changed they will automatically be marked as 'Fuzzy'.
Using the 'Show' dropdown menu, select 'Fuzzy'.
Verify these translations as the wording in English has been changed.

*Translations are not considered complete, until they have been proofread.*

# Proofreaders
*Ensure you mark all completed and correct translations as proofread!*

# Raising Issues/Comments
If a translation is wrong ensure you mark it as 'Fuzzy' or comment as an issue.
If you just apply a comment stating something is wrong, the only way someone would see it is if they were reading all the comments on all the keys.

# Discord
Also ensure you join the [Discord](https://discord.gg/NV2YeC8) and PM DelphiActual for an invite to the translation channel(#i18n). If you have any questions about translating/translations do not hesitate to ask in the #i18n channel.

# Plurals & Gender
Plurals, and gender are handled by strings that end in _plural, _male, or _female. If your language does not require the plural or gender form just copy the singular or neutral form and mark the translation as 'Fuzzy' and 'Proofread'. By marking it 'Fuzzy' it will not be downloaded automatically.

If your language requires plural or gender support for a translation do not hesitate to ask!

# List of Plural & Gender keys
 - BungieService.ItemUniquenessExplanation
 - FarmingMode.Desc
 - FarmingMode.MakeRoom.Desc
 - ItemService.BucketFull.Guardian
 - Loadouts.Applied
 - Loadouts.MakeRoomDone

# Variables
| Variable | Resolves to |
|----------|-------------|
| {{store}} | Exo Male Warlock, etc |

## Translation Team
| Language           | Reviewers        | Translators |
|--------------------|------------------|-------------|
| German (de)        | Korben85, StefanGose | dleising, itspick |
| French (fr)        | Julian, yannickguillemot, qcmethical |  ScaRdrow  |
| Italian (it)       | simonefranza, Theovorn | |
| Japanese (ja)      | omar_senpai, thatjapanesedude, winy0808 | chickenmer |
| Portuguese (pt-br) | SiLeNtWaLkEr, brunnopleffken |  |
| Spanish (es)       | JaviG1105 | Bec04015, Jakio, Pochev, tsps_03 |

# Translation Coordinator

delphiactual

# Translation Managers

bhollis, eutral, Sunburned_Goose
