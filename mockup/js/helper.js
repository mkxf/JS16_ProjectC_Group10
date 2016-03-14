/*.--.     Alex Max Tobi          ,-. .--. 
 : .--'   Project C - Map       .'  :: ,. :
 : : _ .--.  .--. .-..-..---.    `: :: :: :
 : :; :: ..'' .; :: :; :: .; `    : :: :; :
 `.__.':_;  `.__.'`.__.': ._.'    :_;`.__.'
                        : :                
                        :_;
*/
var mapHelpers = {
	// Launch wiki informations
	wikiModal: function (link, title, cssclass) {
		$('#dynModal').modal('show');// Show the Modal
    	var tEl = $('#dynModal .modal-header'); // Header Container
		var bEl = $('#dynModal .modal-body'); // Body Container
		
		if (title) { // If there is a title
			tEl.show(); // Show the Bar and Fill it
			$('#dynModalLabel').text(title);
			if(cssclass) {
				tEl.addClass(cssclass);
			}
		} else {
			tEl.hide(); // Hide it
		}
		
		// Show Spinner
		bEl.html("<span class='glyphicon glyphicon-cog glyph-spin glyph-big'></span>").addClass('text-center'); 
		
		var cEl = $('#dynModal .modal-footer .classes').empty(); // Classes Container
		$('#dynModal .wikilink').attr('href', link); // Update the Wiki-Link
		
		// Get the wiki
		jQuery.ajax({
			url: link 
		}).success(function(x) { // Show it
			var content = $(x).find("#bodyContent");
			bEl.removeClass('text-center'); // Make it left aligned
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
			bEl.html(content);
		}).error(function () { // Display Error Message
			bEl.html("<span class='glyphicon glyphicon-alert glyph-big text-danger'></span>");
		});
	},
	
	// Set Pins
	characterPins: function (character) {
		var marker = mapHelpers.colorMarker(character.color, character.img);
	}, 
	
	// Make some colorful markers
	colorMarker: function(color, imgSrc) {
		var img = imgSrc ? '<img src="'+imgSrc+'" />' : '';
		return L.divIcon({
	    	className: 'colormarker',
	    	html:'<span class="glyphicon glyphicon-map-marker" style="color:'+color+';">'+img+'</span>'
		});
	},
	
	characters: {},
	
	colors: ['#F44336', '#2196F3', '#4CAF50', '#212121', '#7C4DFF', '#F8BBD0', '#FBC02D', '#795548', 
		'#00796B', '#536DFE', '#FFFFFF', '#FF5722'],
		
	// Add a character to the list
	addCharacter: function(c) {
		if(!this.characters[c.name]) { // If not in the list, add it
			var count = Object.keys(this.characters).length; // # of Characters
			c.color = this.colors[count % this.colors.length]; // Rotate the colors
			var img;
			if(personList[c.name]) {// Image defined or use default
				img = personList[c.name].img;
			} else {
				img = defaultPersonImage; 
			}
			
			// Make new elem
			var character = $('<div class="character"><img src="'+img+'"'+
				'class="img-circle" style="border-color:'+c.color+'"/></div>');
			var charInfo = $('<div class="characterinfo"></div>');
			var name = $('<div class="name">'+c.name+'</div>');
			var house = $('<div class="house">'+c.house+'</div>');
			var moreInfo = $('<a>More info</a>');
		
			mapHelpers.characterPins(c); // Show the character pins
			$("#characters").append(character);// Add it to the list
			character.append(charInfo);
			charInfo.append(name);
			if(c.house){
				charInfo.append(house);
			}
			if(personList[c.name]){
				charInfo.append(moreInfo);
			}
			c.polyline =  L.polyline([], {color: c.color}).addTo(characterInfo);
			var marker = mapHelpers.colorMarker(c.color, img);
			c.startMarker = L.marker([0,0], {icon:marker}).addTo(characterInfo);
			c.endMarker = L.marker([0,0], {icon:marker}).addTo(characterInfo);
			
			character.click(function (e) { // Bind the click listener
				var el = $(e.target); // Clicked Element
				if(!el.hasClass('character')) {
					el = el.parents('.character'); // Get the container
				}
				if(el.hasClass('disabled')) { // Toggle the class name (de-)activate it
					el.removeClass('disabled');
					c.polyline.addTo(characterInfo);
					c.startMarker.addTo(characterInfo);
					c.endMarker.addTo(characterInfo);
				} else {
					el.addClass('disabled');
					c.polyline.remove();
					c.startMarker.remove();
					c.endMarker.remove();
				}
				mapHelpers.characterPins(c);
			});
			
			moreInfo.click(function (e) {
				var el = $(e.target);
				mapHelpers.wikiModal(personList[c.name].link, c.name, c.house);
				return false; // Prevent Default + Bubbling
			});
			
			c.el = character;
			this.characters[c.name] = c; // Save it
			this.updatePaths();
		}
	},
	
	selection: [0,1],
	
	// display the selected paths
	updatePaths: function(selection) {
		var toArray = function(s) { // make e.g. "1-3" to [1,3]
			if(typeof s == "number") {
				return s;
			}
			s = s.split('-');
			return [parseInt(s[0]), parseInt(s[s.length-1])];
		};
		var sel = this.selection = selection ? toArray(selection) : this.selection; // Perform it on the slider input
		
		var displayIt = function(pathInfo) { // Check whether to display the path
			var p = toArray(pathInfo);
			if(p.length == 1 || p[1] === "") {
				return (p[0] >= sel[0] && p[0] <= sel[1]);
			}
			return (p[0] >= sel[0] && p[1] <= sel[1]);
		};
	
		var getC = function(p) { // get Coordinates
			cs.push([p[0], p[1]]);
		};
		for(var k in this.characters) { // Check if path exists and display
			if(paths[k]) { // If there is path info
				var c = this.characters[k];
				var cs = []; // Collect the Coordinates
				for(var k2 in paths[k]) {
					if(displayIt(k2)) {
						paths[k][k2].map(getC);
					}
				}
				c.polyline.setLatLngs(cs);
				var start = cs.shift(); // Get the first
				c.startMarker.setLatLng(start); // Display start Marker
				c.endMarker.setLatLng(cs.length > 0 ? cs.pop() : start); // Display End Marker
			} else {
				// Set some points
			}
		}
	}
};