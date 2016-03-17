/*.--.     Alex Max Tobi          ,-. .--. 
 : .--'   Project C - Map       .'  :: ,. :
 : : _ .--.  .--. .-..-..---.    `: :: :: :
 : :; :: ..'' .; :: :; :: .; `    : :: :; :
 `.__.':_;  `.__.'`.__.': ._.'    :_;`.__.'
                        : :                
                        :_;
*/
var gotmap = function(mapContainer, options) {
	var defaultOptions = {
		'filter':false,
		'sidebar':false,
		'timeline':false,
		'defaultPersonImg':'img/persons/dummy.jpg',
		'deadPersonImg':'img/persons/skull.png',
		'cityDataSource':'https://got-api.bruck.me/api/cities',
		'realmDataSource':'https://got-api.bruck.me/api/realms',
		'pathDataSource':'https://got-api.bruck.me/api/paths',
		'episodeDataSource':'https://got-api.bruck.me/api/episodes/',
		'characterDataSource':'https://got-api.bruck.me/api/characters/',
		'bgTiles':'https://raw.githubusercontent.com/Rostlab/JS16_ProjectC_Group10/develop/tiles/bg/{z}/y{y}x{x}.png',
		'labelTiles':'https://raw.githubusercontent.com/Rostlab/JS16_ProjectC_Group10/develop/tiles/labels/{z}/y{y}x{x}.png',
		'errorTile':'https://raw.githubusercontent.com/Rostlab/JS16_ProjectC_Group10/develop/tiles/blank.png'
		'characterColors':['#F44336', '#2196F3', '#4CAF50', '#212121', '#7C4DFF', '#F8BBD0', '#FBC02D', '#795548', 
		'#00796B', '#536DFE', '#FFFFFF', '#FF5722']
	};
	
	// Merge User and Default Options
	if(typeof options == 'object') {
		for(var option in defaultOptions) {
			if(!(option in options)) {
				options[option] = defaultOptions[option];
			}
		}
	} else {
		options = defaultOptions;
	}
	
	// Will be later returned
	var publicFunctions = {};
	
	
	mapContainer = document.getElementById(mapContainer);
	timelineContainer = document.getElementById('timeline');
	
	// INIT Leaflet Map
	var map, cityStore, cityLayer, realmStore, realmsLayer, realmsShown;
	(function () {
		// Define a costum zoom handler because HBO did sth weird when scaling
		var hboZoom = L.extend({}, L.CRS.EPSG3857, {
			scale: function(zoom) {
				var factor;
				switch (zoom) {
					case 4:
						factor = 2.166;
						break;
					case 5:
						factor = 2.0915;
						break;
					default:
						factor = 2;
				}
				return 256 * Math.pow(factor, zoom);
			}
		});
		
		// Maximum viewable angle
		var bounds = new L.LatLngBounds(L.latLng(90,-180), L.latLng(-43.87, 171.37));
		
		// Configure the map
		var mapOptions = {
			maxZoom: 5,
			minZoom: 0,
			crs: hboZoom,
			mapBounds: bounds
		};
		
		// Make the map and center it in the viewpoint
		map = L.map(mapContainer, mapOptions).fitBounds(bounds);
		
		// Limit the display
		map.setMaxBounds(bounds);
		
		// HBO BG Tiles
		new L.tileLayer(options.bgTiles, {
			bounds: bounds,
			errorTileUrl: options.errorTile,
			noWrap: true,
			attribution: 'BG &copy; <a href="http://viewers-guide.hbo.com">HBO</a>'
		}).addTo(map);
		
		// Alex' Labeled Tiles
		new L.tileLayer(options.labelTiles, {
			bounds: bounds,
			errorTileUrl: options.errorTile,
			noWrap: true
		}).addTo(map);
		
		// Init Layer + List
		cityLayer = new L.layerGroup().addTo(map);
		cityStore = {};
		
		// Fetch the Data
		jQuery.get(options.cityDataSource, {},
			function (data) {
				var allCities = (typeof data == "object") ? data : JSON.parse(data);
				allCities.map(function (place) {
					place.coords = [parseFloat(place.coordY), parseFloat(place.coordX)]; // 
					cityStore[place.name] = place;
					var type = place.type || "other"; // Add Type to display correct label
					var prio = "prio"+place.priority; // Add priority to hide / show cities
					var extra = (place.priority == 6 || jQuery.inArray(place.name, ['Shadow Tower', 'Castle Black', 'Eastwatch by the Sea', 'Nightfort']) != -1) ? " wall-label" : ""; 
					if(place.coordY && place.coordX) {
						L.marker(place.coords, {
							icon: L.divIcon({className: ['gotmarker', type, prio].join(' ')})
						}).on('click', function () {
							publicFunctions.showModal(place.link, place.name, place.type);
						}).bindLabel(place.name, {
							noHide: true, 
							direction:'right',
							className: ['gotlabel', extra, prio].join(' ')
						}).addTo(cityLayer);
					}
				});
		});
		
		// Add a class to alter the labels
		map.on('zoomanim', function(e) { 
			var el = document.getElementById('map');
			if (el.className[el.className.length - 2] != 'm') {
				el.className += " zoom" + e.zoom;
			} else {
				el.className = el.className.slice(0, -1) + e.zoom;
			}
		});
		mapContainer.className += " zoom" + map.getZoom();
		
		// Init Layer + List
		realmsLayer = new L.LayerGroup();
		realmStore = {};
		realmsShown = false;
		
		jQuery.get(options.realmDataSource, {},
			function (data){
				var allRealms = (typeof data == "object") ? data : JSON.parse(data);
				allRealms.map(function (realm) {
					realm.poly = L.polygon(realm.path, {
						color: 'red', 
						opacity : 0.2
					}).bindLabel(realm.name, {
						className: 'gotmarker'
					}).addTo(realmsLayer);
					realmStore[realm.name] = realm;	
				});
		});
		
		//Realms Button
		var realmsCtrl = L.Control.extend({
		    options: {
		        position: 'topright'
		    },
		    onAdd: function(map) {
		        var c = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom glyphicon glyphicon-flag');
		        L.DomEvent.disableClickPropagation(c);
		        c.onclick = function() {
			        publicFunctions.toggleRealms();
		        };
		        return c;
		    },
		});
		map.addControl(new realmsCtrl());
	})();
	
	
	// INIT Timeline
	var episodeStore;
	(function () {
		// Append the Containers
		var sliderEl = jQuery('<div></div>').appendTo(timelineContainer);
		var infoEl = jQuery('<p></p>').appendTo(timelineContainer);
		
		// Init List
		episodeStore = [];
		
		// Fetch the Data
		jQuery.get(options.episodeDataSource, {},
			function (data){
				var allEpisodes = (typeof data == "object") ? data : JSON.parse(data);
				var episodesCount = allEpisodes.length;
				allEpisodes.map(function (episode) {
					episode.showTitle = "S" + episode.season +"E"+episode.nr+": " + episode.name;
					episodeStore[episode.totalNr]=episode;
				});
				infoEl.text(getEpisodeInfo(1) + " - " + getEpisodeInfo(2));
				sliderEl.slider({
					range: true,
					min: 1,
					max: episodesCount,
					values: [1, 2],
					animate: "slow",
					slide: function(event, ui) {
						selected = [ui.values[0], ui.values[1]];
						infoEl.text(getEpisodeInfo(ui.values[0]) + " - " + getEpisodeInfo(ui.values[1]));
						publicFunctions.updatePaths(selected);
					}
				});
			}
		);
		
		// Helper for Episode Info
		function getEpisodeInfo(i) {
			if(i < episodeStore.length) {
				return episodeStore[i].showTitle;
			} else {
				return "No Episode found";
			}
		}
	})();
	
	// INIT Filterbar and Characterlist
	var characterStore;
	(function () {
		// Init Elements
		var f = jQuery('#filter input'); // Filter Element
		var l = jQuery('<ul class="dropdown-menu"><li class="dropdown-header">Nothing found</li></ul>').insertAfter(f); // Dropdown
		
		// Init private helper Vars
		var selectedInDropdown = 0; // Index of highlighted Dropdown element
		var inputVal = ""; // Last used input
		var mouseOn = false; // Mouse over list?
		var focusOn = false; // Cursor in input?
		
		// Init List
		characterStore = {}; // Character Store
		
		var personList = { // TODO: Move it to DB later
			'Eddard Stark':'img/persons/eddard_stark.jpg',
			'Robb Stark':'img/persons/robb_stark.jpg',
			'Sansa Stark':'img/persons/sansa_stark.jpg',
			'Catelyn Stark':'img/persons/catelyn_stark.jpg',
			'Arya Stark':'img/persons/arya_stark.png',
			'Brandon Stark':'img/persons/bran_stark.jpg',
			'Rickon Stark':'img/persons/rickon_stark.jpg',
			'Jon Snow':'img/persons/jon_snow.jpg',
			'Daenerys Targaryen':'img/persons/daenerys_targaryen.jpg',
			'Tywin Lannister':'img/persons/tywin_lannister.png',
			'Jaime Lannister':'img/persons/jaime_lannister.png',
			'Cersei Lannister':'img/persons/cersei_lannister.jpeg',
			'Tyrion Lannister':'img/persons/tyrion_lannister.png'
		};
		
		
		jQuery.get(options.characterDataSource, {}, function(data) {
			var allCharacters = (typeof data == "object") ? data : JSON.parse(data);
			allCharacters.map(function (character) {
				if(personList[character.name]) {
					character.image = personList[character.name];
				}
				characterStore[character.name.toLowerCase()] = character;
			});
		});
		
		// Set events to know where the mouse is and do fading
		l.mouseenter(function() { // No need to fade in because it is already
			mouseOn = true;
		});
		
		l.mouseleave(function() {
			mouseOn = false;
			if(!focusOn) {
				l.fadeOut();
			}
		});
		
		// Set events to know where the cursor is and fade the list in/out
		f.focusin(function () {
			focusOn = true;
			l.fadeIn();
		});
		f.focusout(function () {
			focusOn = false;
			if(!mouseOn) {
				l.fadeOut();
			}
		});
		
		// Get the Return / UP / Down Keys early to prevent default beahvior
		f.keydown(function (event) {
			var key = event.keyCode;
			if(key == 13 || key == 38 || key == 40) {
				var lEl = l.find("li"); // All list elements
				event.preventDefault();
				if(key == 13) { // Return
						$(lEl[selectedInDropdown]).trigger('click'); // Click the Selected
						f.trigger('blur'); // leave the input
						selectedInDropdown = 0; // Delete Selection
						return;
				}
				$(lEl[selectedInDropdown]).removeClass('hover');
				if(key == 38) { // Up
					if(selectedInDropdown > 0) {
						selectedInDropdown--; // Move Selection Up
					}
				} else { // Down
					if(selectedInDropdown < lEl.length) {
						selectedInDropdown++; // Move Selection Down
					}
				}
				$(lEl[selectedInDropdown]).addClass('hover'); // Add hover to the new el
			}
		});
		
		// Trigger the search 
		f.keyup(function(event) {
			var s = f.val().toLowerCase();
			if(s == inputVal) { // Only when sth new happens
				return;
			} 
			inputVal = s;
			selectedInDropdown = 0;
			var maxResults = 20;
			var o1 = []; // Begins with
			var o2 = []; // Contains
			var p;
			for(var cName in characterStore) {
				var pos = cName.indexOf(s);
				if(pos != -1) {
					(pos === 0 ? o1 : o2).push(characterStore[cName]);
					if((maxResults--) === 0) {
						break;
					}
				}
			}
			var out = o1.concat(o2); // First beginning with e, then the rest
			l.empty(); // Delete the HTML li Elements
			if(out.length) {
				out.map(function(c,i) {
					var img = c.image || options.defaultPersonImg;
					var item = jQuery('<li><a href="#"><img src="'+img+'" class="img-circle"/>'+c.name+'</a></li>').click(function(e) {
						publicFunctions.addCharacter(c);
						l.fadeOut();
						return false;
					});
					if(i === 0) {
						item.addClass('hover');
					}
					l.append(item);
				});
			} else {
				l.append('<li class="dropdown-header">Nothing found</li>');
			}
		});
	})();
	
	// INIT Modal
	var gotModal;
	(function(){
		gotModal = jQuery('<div class="modal fade gotmap-modal" tabindex="-1" role="dialog" aria-labelledby="dynModalLabel">'+
			'<div class="modal-dialog modal-lg" role="document"><div class="modal-content"><div class="modal-header">'+
			'<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
			'<h3 class="modal-title" id="dynModalLabel"></h3></div><div class="modal-body"></div><div class="modal-footer">'+
			'<div class="pull-left classes"></div><a href="#" class="btn btn-warning wikilink" target="_blank">Show in Wiki</a>'+
			'<button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div></div></div></div>');
		$('body').append(gotModal);
	})();
	
	//########################################################//
	//                                                        //
	//                    Public Functions                    //
	//                                                        //
	//########################################################//
	
	// Modal Functions
	
	publicFunctions.showModal = function (link, title, cssclass) {
		gotModal.modal('show'); // Show the Modal
    	var headerEl = gotModal.find('.modal-header'); // Header Container
		var bodyEl = gotModal.find('.modal-body'); // Body Container
		
		if (title) { // If there is a title
			headerEl.show(); // Show the Top Bar
			$('#dynModalLabel').text(title); // Set the Title
			headerEl[0].className = "modal-header"; // Reset Classnames
			if(cssclass) { // Append classes when existing
				headerEl.addClass(cssclass);
			}
		} else {
			headerEl.hide(); // Hide it
		}
		
		// Show Spinner
		bodyEl.html("<span class='glyphicon glyphicon-cog glyph-spin glyph-big'></span>").addClass('text-center'); 
		
		var cEl = gotModal.find('.modal-footer .classes').empty(); // Classes Container
		gotModal.find('.wikilink').attr('href', link); // Update the Wiki-Link
		
		// Get the wiki
		jQuery.ajax({
			url: link 
		}).success(function(x) { // Show it
			var content = jQuery(x).find("#bodyContent");
			bodyEl.removeClass('text-center'); // Make it left aligned
			content.find("img").each(function (i, el) { // Fix the image URL
				el.src = "http://awoiaf.westeros.org"+el.src.substr(el.src.indexOf("/i"));
			});
			content.find("a").each(function (i, el) { // Fix the links
				if(el.href.indexOf("/i") !== -1)
				{
					el.href = "http://awoiaf.westeros.org"+el.href.substr(el.href.indexOf("/i"));
					el.target = "_blank";
				}
			});
			content.find(".catlinks li a").each(function (i, el) { // Pull the catlinks in the modal footer
				$(el).addClass("btn").addClass("btn-default").addClass("pull-left");
				cEl.append(el);
			});
			bodyEl.html(content);
		}).error(function () { // Display Error Message
			bodyEl.html("<span class='glyphicon glyphicon-alert glyph-big text-danger'></span>");
		});
	};
	
	publicFunctions.hideModal = function() {
		gotModal.modal('hide'); // Show the Modal
	};
	
	// Character Functions
	
	publicFunctions.addCharacter = function () {
		console.log('TODO addCharacter');
	};
	
	publicFunctions.removeCharacter = function () {
		console.log('TODO removeCharacter');
	};
	
	publicFunctions.showCharacter = function () {
		console.log('TODO showCharacter');
	};
	
	publicFunctions.hideCharacter = function () {
		console.log('TODO hideCharacter');
	};
	
	publicFunctions.toggleCharacter = function () {
		console.log('TODO toggleCharacter');
	};
	
	publicFunctions.removeAllCharacters = function () {
		console.log('TODO removeAllCharacters');
	};
	
	// Timeline Functions
	
	publicFunctions.updatePaths = function (selected) {
		console.log('TODO update Paths');
	};
	
	// Realms Functions
	
	/*
	 * showRealms
	 * 
	 * Shows the realm layer
	 * @TODO Options
	 *
	 * @return realmsShown
	 */
	publicFunctions.showRealms = function() {
		if(!realmsShown) {
			map.addLayer(realmsLayer);
			realmsShown = true;
			return realmsShown;
		}
	};
	
	/*
	 * hideRealms
	 * 
	 * Hide the realm layer
	 *
	 * @return realmsShown
	 */
	publicFunctions.hideRealms = function() {
		if(realmsShown) {
			map.removeLayer(realmsLayer);
			realmsShown = false;
			return realmsShown;
		}
	};
	
	/*
	 * toggleRealms
	 * 
	 * Invokes show/hide realm depending on realmsShown
	 *
	 * @return realmsShown
	 */
	publicFunctions.toggleRealms = function() {
		return realmsShown ? publicFunctions.hideRealms() : publicFunctions.showRealms();
	};
	
	// Credits
	
	/*
	 * credit
	 * 
	 * Show Team Members
	 *
	 * @return ourNames
	 */
	publicFunctions.credit = function() {
		return "GotMap by Maximilian Bandle @mbandle, Alexander Beischl @AlexBeischl, Tobias Piffrader @tpiffrader";
	};
	
	return publicFunctions;
}

jQuery(function() {
	mymap = gotmap('map', {
		'cityDataSource':'https://raw.githubusercontent.com/Rostlab/JS16_ProjectC_Group10/develop/data/cities.js',
		'realmDataSource':'file:///Volumes/Max%20HD/Users/max/Documents/TUM/JavaScript/data/realms.js',
		'pathDataSource':'file:///Volumes/Max%20HD/Users/max/Documents/TUM/JavaScript/data/paths.js'
	});
});