# Privacy Information #

Information in DIM is kept between Bungie and you (item notes are kept in local storage).  With this release we're additionally calling
[destinytracker.com](http://destinytracker.com/) to get community-sourced weapon rankings.

There's no non-public information sent to receive generic rankings, but there is non-public information sent to them if you want to rate or
comment on your gear (or to see the discussions that have taken place).

You need go to the settings menu to opt in to sending any of this information.  Here's a breakdown of what's being sent (that isn't already visible to the public).

# What we send #

* InstanceId
    * *A unique ID specific to the player's version of a weapon.*
    * It is...
        * sent when getting weapon reviews to identify the reviews the user wrote themselves.
        * sent when submitting a review to make sure we don't get duplicate reviews.
* MembershipId
    * *A unique ID identifying the player's account on Bungie.Net.*
        * It's being sent when submitting a review to get an ID that identifies the reviewer.
* DisplayName
    * *Name of the player's account (think: XBL gamertag, PSN ID).*
        * It's being sent when submitting a review to give a name to the reviewer.