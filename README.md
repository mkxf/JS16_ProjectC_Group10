# GOTMAP (JS16_ProjectC)
The known GoT world is vast and stretches over the three continents of Westeros, Essos and Sothorys. Readers of the Ice and Fire books will get acquainted and transported from King's Landing to the borders of the Seven Kingdoms, and further on across the Narrow Sea. Over two thousand characters mentioned in the books have been associated with multiple landmarks in the GoT world. Your mission is to find character-place associations and put those associations on an interactive GoT map. Such a tool will help us figure out where did Gregor “the hound” Clegane went on his travels and how are these travels coincide with the travels of Breanne of Tarth (hint: they never crossed paths in the books, however they had a deadly duel during the show).
# Links
    Main wiki entry: <https://rostlab.org/owiki/index.php/Javascript_technology_2016#Project_C>    
#Usage

Example:
```javascript
var map = require("gotmap");
map.config(object);
// object incluse two fields:
// apiLocation = link to the api
// apiToken = token for post/put/delete request to api
map.init();
// create a map
```

Dependencies
============
    - Leaflet@v0.7.7
    - jQuery
    - Bootstrap

# Work in progress

    - Editor for map

# HOWTO
##run web page:
Install the gotmap and open the map:

```shell
npm install gotmap
open node_modules/gotmap/mockup/mockup.html
```

## Run Editor
```shell
open editor/editor.html
```

## Run the tests
Install node modules:
```shell
npm update
```
Run tests:
```shell
grunt
```
or
```shell
npm test
```

#
Konstruktor([htmlEl] mapEl, [htmlEl] filterEl, [htmlEl] timelineEl, [htmlEl] sidebarEl)
# Map API

## Modal
Show the modal:
```javascript
showModal([string] id, [string] title, [string] cssclass)
```
Hide the modal:
```javascript
hideModal()
```
## Characters in the map
Add a character:
```javascript
addCharacter([string] id)
```
Remove a character:
```javascript
removeCharacter([string] id)
```
Show a character:
```javascript
showCharacter([string] id)
```
Hide a character:
```javascript
hideCharacter([string] id)
```
Toggle a character:
```javascript
toggleCharacter([string] id)
```
Delete all characters:
```javascript
deleteAllCharacters()
```

## Paths
Update paths:
```javascript
updateTimeline([array] range)
```
## Realms
Show realms:
```javascript
showRealms([bool] color, [double] opacity)
```
Hide realms:
```javascript
hideRealms()
```
Toggle realms:
```javascript
toggleRealms()
```
## Credits:
```javascript
showTeamMembers()
```