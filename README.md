# JS16_ProjectC
The known GoT world is vast and stretches over the three continents of Westeros, Essos and Sothorys. Readers of the Ice and Fire books will get acquainted and transported from King's Landing to the borders of the Seven Kingdoms, and further on across the Narrow Sea. Over two thousand characters mentioned in the books have been associated with multiple landmarks in the GoT world. Your mission is to find character-place associations and put those associations on an interactive GoT map. Such a tool will help us figure out where did Gregor “the hound” Clegane went on his travels and how are these travels coincide with the travels of Breanne of Tarth (hint: they never crossed paths in the books, however they had a deadly duel during the show).
# Links
    - Main wiki entry: https://rostlab.org/owiki/index.php/Javascript_technology_2016#Project_C

# Dependencies
    - Leaflet@v1.0.0-beta.2
    - jQuery
    - Bootstrap

# WORK IN PROGRESS
    - Editor for map

## How to run the tests
Install node modules:
```
npm update
```
Run tests:
```
grunt
```
or
```
npm test
```

#Usage

Example:
```
var map = require("gotmap");
map.config(object);
// object incluse two fields:
// apiLocation = link to the api
// apiToken = token for post/put/delete request to api
map.init();
// create a map
```
