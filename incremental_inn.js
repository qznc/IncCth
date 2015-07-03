var Game = Game || {};

(function() {
	/* MONEY FLOW
 * world -> hero on creation
 * hero -> inn for booze (and rooming?)
 * inn -> world for beverages
 * inn -> city via taxes
 * hero -> city for equipment
 * hero -> goblins on death
 * goblins -> hero on death
 */

	const ID_GAMESTATE = "GAMESTATE";
	const GAME_VERSION = 1;
	const ADD_PER_SECOND = 3;
	const SECONDS_PER_DAY = 2.78;
	const BEVERAGE_COUNT = 11;
	const INITIAL_BEVERAGE_COUNT = 2;
	const MAX_NOTIFICATIONS = 6;
	const DAYS_PER_MONTH = 30;
	const MONTHS_PER_YEAR = 12;
	const BEVERAGE_QUALITY_NAME = "disgusting,crappy,common,decent,nice,tasty,fine,exceptional,superb,godlike".split(",");
	const MAX_DAYS_PER_STEP = 100;
	const MAX_BOOZE_PER_HERO = 2;
	var STATE = Object();
	var XRNG; /* RNG for non state things like UI */

	function incSanityBy(value) {
		var x = STATE.sanity + value;
		x = Math.max(0,x);
		x = Math.min(1.0,x);
		STATE.sanity = x;
	}

	function popKnowledgeItem() {
		var rknowl = STATE.readingKnowledge;
		var filtered = [];
		for (var i=0; i<rknowl.length; i++) {
			var item = rknowl[i];
			if (item.sanity    < STATE.sanity) continue;
			if (item.knowledge > STATE.knowledge) continue;
			filtered.push(i);
		}
		var index = XRNG.choice(filtered);
		var item = rknowl[index];
		STATE.readingKnowledge.splice(index,1);
		return item;
	}

	function readBooks(event) {
		var item = popKnowledgeItem();
		notify("You read about "+item.name+".");
		STATE.knowledge += 13 * STATE.sanity;
		incSanityBy(-0.1 * STATE.sanity);
		updateUI();
	}

	function getSleep(event) {
		console.log("getSleep "+event);
		var rng = new RNG(STATE.currentSeed);
		if (rng.nextFloat() > STATE.sanity) {
			var item = popKnowledgeItem();
			STATE.knowledge += 4 * STATE.sanity;
			incSanityBy(-0.02); // bad dreams
			notify("Your dreams are haunted by "+item.name+".");
		} else {
			incSanityBy(0.02); // rest
			notify("After some sleep your head feels more clear.");
		}
		updateUI();
	}

	function updateUI() {
		var rng = new RNG(STATE.currentSeed);
		STATE.currentSeed = rng.nextInt();

		var stable_rng = new RNG(STATE.globalSeed);
		function updateText(elemid,html) {
			document.getElementById(elemid).innerHTML = html;
		}
		updateText("stat-knowledge", STATE.knowledge | 0);
		updateText("stat-sanity", STATE.sanity.toFixed(2));
		var buttons = document.getElementsByTagName("button");
		for (var i=0; i<buttons.length; i++) {
			var b = buttons[i];
			var text = b.innerHTML;
			var puretext = b.getAttribute("puretext");
			if (puretext === null) {
				b.setAttribute("puretext", b.innerHTML);
			} else {
				text = puretext;
			}
			b.innerHTML = insaneText(text, 1.0 - STATE.sanity, stable_rng);
		}
		updateButtons();
	}

	function updateButtons() {
		function showButton(id) {
			var e = document.getElementById(id);
			var hp = document.getElementById("always_actions");
			hp.appendChild(e);
			e.classList.remove("hidden");
		}
		function hideButton(id) {
			var e = document.getElementById(id);
			e.classList.add("hidden");
			setTimeout(function() {
				var hp = document.getElementById("hiddenParent");
				hp.appendChild(e);
			}, 1000);
		}
		if (STATE.sanity < 0.7) {
			showButton("getSleep");
		} else {
			hideButton("getSleep");
		}
	}

	function startGame() {
		XRNG = new RNG(Date.now());
		var s = JSON.parse(window.localStorage.getItem(ID_GAMESTATE));
		if (!s) { /* new game, set initial state */
			resetState();
		} else { /* load old game */
			STATE = s;
		}
		setInterval(saveGame, 30*1000);
		setInterval(trimNotifications, 3*1000);
		connectButtons();
		updateUI();
	}

	function connectButtons() {
		function connect(elemid, func) {
			document.getElementById(elemid).onclick = func;
		}
		connect("readBooks", readBooks);
		connect("getSleep", getSleep);
		connect("reset", resetState);
	}

	function addElementWithText(parent, tag, text) {
		var child = document.createElement(tag);
		var txt = document.createTextNode(text);
		child.appendChild(txt);
		parent.appendChild(child);
	}

	function addElementWithInputText(parent, tag, text, id) {
		var child = document.createElement(tag);
		var input = document.createElement("input");
		input.value = text;
		input.id = id;
		input.class = "inputtext";
		input.type = "text";
		child.appendChild(input);
		parent.appendChild(child);
	}

	function initKnowledge() {
		var readknowledge = [];
		var minimum_knowledge = -2;
		function n(name,sanity,knowl) {
			readknowledge.push({'name': name, 'sanity': sanity, 'knowledge': minimum_knowledge++});
		}
		n("a Devourer in the Mist"                               , 1.0 );
		n("a Herald of S'glhuo"                                  , 1.0 );
		n("the Sea Horror"                                       , 0.91);
		n("the Widow in the Woods"                               , 0.99);
		n("a Devourer of Stars"                                  , 0.90);
		n("a Creator of Nile"                                    , 0.99);
		n("a Universe's Equilibrium"                             , 0.98);
		n("the Cold Flame"                                       , 0.98);
		n("a Lord of the Pole"                                   , 0.97);
		n("the Moon-God"                                         , 0.97);
		n("the Silent Shouter on the Hill"                       , 0.96);
		n("the Spider God"                                       , 0.96);
		n("a Spinner in Darkness"                                , 0.95);
		n("the Serpent Goddess"                                  , 0.95);
		n("the Aeg"                                              , 0.94);
		n("the Aega"                                             , 0.94);
		n("the Many-Mother"                                      , 0.93);
		n("the Bringer of Pestilence"                            , 0.92);
		n("a Master of the Crabs"                                , 0.92);
		n("the Soul-Chilling Ice-God"                            , 0.91);
		n("the Great Water Lizard"                               , 0.91);
		n("the Doom of Sarnath"                                  , 0.60);
		n("the Black One"                                        , 0.90);
		n("the Filler of Space"                                  , 0.90);
		n("He Who Comes in the Dark"                             , 0.90);
		n("the Berkeley Toad"                                    , 0.80);
		n("a Serpent-Bearded Byatis"                             , 0.70);
		n("a Horror from the Hills"                              , 0.90);
		n("the Feeder"                                           , 0.90);
		n("the Caug-Narfagn"                                     , 0.50);
		n("a Serpent Skirted One"                                , 0.90);
		n("a Master of the Runes"                                , 0.90);
		n("a Bloody Crooked One"                                 , 0.90);
		n("the Dark Water God"                                   , 0.90);
		n("the Living Flame"                                     , 0.90);
		n("the Burning One"                                      , 0.90);
		n("the Dream-Daemon"                                     , 0.90);
		n("the Destroying Eye"                                   , 0.90);
		n("the Waiting Dark"                                     , 0.90);
		n("the Mortician God"                                    , 0.80);
		n("She Whose Hand Embalms"                               , 0.90);
		n("the Burrower From the Bluff"                          , 0.90);
		n("a Eidolon of the Blind"                               , 0.80);
		n("the Stone-Thing"                                      , 0.90);
		n("a Lord of Lizards"                                    , 0.90);
		n("the White God"                                        , 0.90);
		n("the Pale Beast"                                       , 0.90);
		n("a God of the Labyrinth"                               , 0.90);
		n("the Star-Seed"                                        , 0.90);
		n("the Plant-God"                                        , 0.90);
		n("a Lord of the Volcano"                                , 0.90);
		n("Thoa"                                                 , 0.70);
		n("the Sound of the Deep Waters"                         , 0.90);
		n("the Inhabitant of the Lake"                           , 0.90);
		n("a Lord of Dead Dreams"                                , 0.90);
		n("the Blind God of the Moon"                            , 0.90);
		n("the Corrupter of Flesh"                               , 0.90);
		n("a Master of the Temple"                               , 0.90);
		n("the Twice-Invoked"                                    , 0.90);
		n("an Eater on the Insane"                               , 0.90);
		n("the Forgotten Old One"                                , 0.90);
		n("a God of the Black Stone"                             , 0.90);
		n("the Horror Under Warrendown"                          , 0.80);
		n("the Demon Bird-God"                                   , 0.90);
		n("the Bird-God of Balsagoð"                             , 0.40);
		n("the Destroyer God of the Aartna"                      , 0.70);
		n("an Eater of Dreams"                                   , 0.90);
		n("a Shadow of Night"                                    , 0.90);
		n("a Lurker in Doom-laden Shadows"                       , 0.90);
		n("a Mate of Othuyeg"                                    , 0.60);
		n("the Dark One"                                         , 0.90);
		n("the Contagion"                                        , 0.90);
		n("the Unspeakable"                                      , 0.60);
		n("He Who is Not to be Named"                            , 0.60);
		n("a Lord of Interstellar Spaces"                        , 0.60);
		n("the King in Yellow"                                   , 0.60);
		n("the Great Tentacled God"                              , 0.91);
		n("the Great One"                                        , 0.91);
		n("the God of Cykranosh"                                 , 0.41);
		n("a Ziulquag-Manzah"                                    , 0.31);
		n("Cthulhu's Mate"                                       , 0.21);
		n("a Xothic Matriarch"                                   , 0.61);
		n("the Shining Hunter"                                   , 0.91);
		n("a Mistress of Darkness"                               , 0.91);
		n("the Wind Walker"                                      , 0.91);
		n("the Wendigo"                                          , 0.91);
		n("a God of the Cold White Silence"                      , 0.91);
		n("a Guardian and the Key of the Watery Gates"           , 0.91);
		n("the Lobster of the Deep"                              , 0.91);
		n("a God of Yekub"                                       , 0.71);
		n("the Ravenous One"                                     , 0.91);
		n("a Bride of Cthulhu"                                   , 0.31);
		n("the Leviathan of Diseased"                            , 0.81);
		n("Cannoosut"                                            , 0.61);
		n("a All-in-All"                                         , 0.91);
		n("a Greater-than-Gods"                                  , 0.91);
		n("a Spawn of the Forgotten"                             , 0.91);
		n("the Devil-dingo"                                      , 0.91);
		n("the Grey"                                             , 0.91);
		n("the Forest-Goddess"                                   , 0.91);
		n("a Harbinger of Doom"                                  , 0.81);
		n("Mappo's Dragon"                                       , 0.41);
		n("the River Abomination"                                , 0.91);
		n("the Devourer"                                         , 0.81);
		n("the Cancer God"                                       , 0.91);
		n("a Lord of the Black Lake"                             , 0.91);
		n("the Monster in the Moon"                              , 0.91);
		n("the Charnel God"                                      , 0.61);
		n("the Great Ghoul"                                      , 0.61);
		n("a Lord of Zul-Bha-Sair"                               , 0.51);
		n("Morddoth"                                             , 0.41);
		n("the Thousand-Faced Moon"                              , 0.90);
		n("a Storm of Steel"                                     , 0.90);
		n("a She-Daemon of the Shadows"                          , 0.90);
		n("the Twin Spawn of Cthulhu"                            , 0.30);
		n("the Wolf-Thing"                                       , 0.90);
		n("the Stalker in the Snows"                             , 0.90);
		n("He Who Hunts"                                         , 0.90);
		n("the Forgotten God"                                    , 0.90);
		n("the Thing That Should Not Be"                         , 0.90);
		n("the Heart of the Ages"                                , 0.90);
		n("a Leech of the Aeons"                                 , 0.80);
		n("the Twin Blasphemies"                                 , 0.90);
		n("the Kraken Within"                                    , 0.90);
		n("the Zombifying Essence"                               , 0.90);
		n("a Haunter of the Red Abyss"                           , 0.90);
		n("the Shatterer"                                        , 0.90);
		n("Mnomquah's Mate"                                      , 0.60);
		n("the Oceanic Horror"                                   , 0.90);
		n("the Doom-Walker"                                      , 0.90);
		n("the Elder One"                                        , 0.90);
		n("the Leopard That Stalks the Night"                    , 0.90);
		n("a Treader of the Dust"                                , 0.90);
		n("the Eye of Z'ylsm"                                    , 0.70);
		n("He Who Dwells Beneath Our Feet"                       , 0.90);
		n("the Crystalloid Intellect"                            , 0.90);
		n("a Seeker in the Skies"                                , 0.90);
		n("the One From Sun Race"                                , 0.90);
		n("a Terror of the Hominids"                             , 0.80);
		n("He of the Ivory Throne"                               , 0.80);
		n("the Bearer of the Cup of the Blood of the Ancients"   , 0.90);
		n("the White Worm"                                       , 0.90);
		n("the Fire God"                                         , 0.90);
		n("the Hog"                                              , 0.80);
		n("the Crocodile God"                                    , 0.90);
		n("the Great Manipulator"                                , 0.70);
		n("Ishmagon"                                             , 0.50);
		n("the Fallen Wisdom"                                    , 0.90);
		n("a Eye of Wicked Sight"                                , 0.90);
		n("a Mistress of the Abyssal Slime"                      , 0.90);
		n("Death Reborn"                                         , 0.80);
		n("a Devourer of Souls"                                  , 0.90);
		n("the God in the Box"                                   , 0.90);
		n("the Big Black Thing"                                  , 0.90);
		n("the Tenebrous One"                                    , 0.90);
		n("the Burrower Beneath"                                 , 0.90);
		n("the Great Chthonian"                                  , 0.70);
		n("the Devourer in the Earth"                            , 0.90);
		n("the Lost One"                                         , 0.90);
		n("the Whiteness"                                        , 0.90);
		n("a Monarch of Night"                                   , 0.90);
		n("the Terror that Walketh in Darkness"                  , 0.90);
		n("the Shining One"                                      , 0.90);
		n("the Shadow in the Crimson Light"                      , 0.90);
		n("the Demon-God of Xuthal"                              , 0.60);
		n("the Godbeast"                                         , 0.90);
		n("the Sleeper of N'kai"                                 , 0.70);
		n("the Toad-God"                                         , 0.80);
		n("the Watery Dweller Beneath"                           , 0.90);
		n("a Father of the Swamps"                               , 0.90);
		n("the Bayou Plant God"                                  , 0.80);
		n("a Lord of Pain"                                       , 0.90);
		n("the Great Horned Mother"                              , 0.80);
		n("a Black Glory of the Creation"                        , 0.90);
		n("Mother and Father to All Marine Life"                 , 0.90);
		n("the Hermaphroditic God"                               , 0.70);
		n("the Thing from Beyond"                                , 0.90);
		n("a Keeper of the Secrets"                              , 0.90);
		n("Yig's Terrifying Son"                                 , 0.30);
		n("the Starfish God"                                     , 0.80);
		n("the Sleeper of Ravermos"                              , 0.70);
		n("a Doom of Shaggai"                                    , 0.70);
		n("the Dread One"                                        , 0.90);
		n("the Goat God"                                         , 0.80);
		n("the Ever-Consuming"                                   , 0.90);
		n("a Maker of Illusions"                                 , 0.90);
		n("a Lord of Unreality"                                  , 0.90);
		n("a Lord of Terror"                                     , 0.90);
		n("the Black Kraken of Atlantis"                         , 0.40);
		n("the Faceless One"                                     , 0.70);
		n("the Defiler"                                          , 0.90);
		n("the Worm-God of the Lords of Thule"                   , 0.60);
		n("a Father of Serpents"                                 , 0.90);
		n("a Master of the Seas"                                 , 0.90);
		n("the Dark Stalker"                                     , 0.90);
		n("the Dweller in the Depths"                            , 0.90);
		n("a Lord of the Things Which Dwell Beneath the Surface" , 0.90);
		n("the Oldest Dreamer"                                   , 0.90);
		n("a Chief of the Giants"                                , 0.90);
		n("the Thing in the Pit"                                 , 0.90);
		n("the All-Consuming Fog"                                , 0.90);
		n("the Black Lord of Whirling Vortices"                  , 0.90);
		n("the Twin Obscenities"                                 , 0.90);
		n("the Fiery Messenger"                                  , 0.90);
		n("a Dweller in the Depths"                              , 0.90);
		n("a Matriarch of Swarms"                                , 0.70);
		n("a Dark Silent One"                                    , 0.90);
		n("Old Night"                                            , 0.70);
		n("a Feaster from the Stars"                             , 0.90);
		n("the Sky-Devil"                                        , 0.90);

		// TODO the names from https://en.wikipedia.org/wiki/Cthulhu_Mythos_deities
		STATE.readingKnowledge = readknowledge;
	}

	function resetState() {
		var now = new Date();
		var globalSeed = (1+now.getDay()) * 1000;
		assert (globalSeed > GAME_VERSION, globalSeed+" <= "+GAME_VERSION);
		globalSeed += GAME_VERSION;
		console.log("globalSeed: "+globalSeed);
		STATE = {
			"knowledge": 0,
			"sanity": 1.0,
			"lastStepTime": now,
			"globalSeed": globalSeed,
			"currentSeed": globalSeed,
		};
		initKnowledge();
		/* remove all notifications */
		var notes = document.getElementById("notifications");
		while (notes.firstChild) {
			notes.removeChild(notes.firstChild);
		}
		updateUI();
	}

	var CRAZY_DIACRITICS = [ '\u030d', '\u0321', '\u033c', '\u0344', '\u0353', '\u0361' ];
	function insaneText(text, insanity, rng) {
		var len = text.length;
		var count = len * insanity / 2;
		if (len < 1) return text;
		for (var i=0; i<count; i++) {
			var index = rng.nextRange(1,len);
			var insert = rng.choice(CRAZY_DIACRITICS);
			text = [text.slice(0,index),insert,text.slice(index)].join("");
		}
		if (insanity > 0.1) { text = text.replace(/t/g, "ƚ"); }
		if (insanity > 0.2) { text = text.toLowerCase(); }
		if (insanity > 0.3) { text = text.replace(/l/g, "I"); }
		if (insanity > 0.4) { text = text.replace(/r/g, "ɿ"); }
		if (insanity > 0.5) { text = text.replace(/d/g, "₫"); }
		if (insanity > 0.6) { text = text.replace(/s/g, "ƨ"); }
		if (insanity > 0.7) { text = text.replace(/i/g, "!"); }
		if (insanity > 0.8) { text = text.replace(/e/g, "ɘ"); }
		if (insanity > 0.9) { text = text.replace(/a/g, "ɐ"); }
		return text;
	}

	function notify(msg) {
		var timeline = document.getElementById("notifications");
		var item = document.createElement("div");
		item.className = "notification hidden";
		var p = document.createElement("p");
		msg = insaneText(msg, 1.0 - STATE.sanity, XRNG);
		var t = document.createTextNode(msg);
		p.appendChild(t);
		item.appendChild(p);
		timeline.appendChild(item);
		setTimeout(function() {
			item.className = "item";
		}, 0);
		trimNotifications();
	}

	function trimNotifications() {
		var notes = document.getElementById("notifications");
		if (window.innerHeight * 0.8 < notes.offsetHeight) {
			var item = notes.children[0];
			item.className = "notification hidden";
			setTimeout(function() {
				if (item.parentNode != notes)
					return; /* things might have changed already */
				notes.removeChild(item);
			}, 1000);
		}
	}

	function saveGame() {
		var str = JSON.stringify(STATE);
		window.localStorage.setItem(ID_GAMESTATE, str);
		console.log("saved: "+str);
	}

	function setIfMissing(obj, key, val) {
		if (key in obj && obj[key] !== undefined && obj[key] !== null) return;
		//console.log("set "+key+" to "+val);
		obj[key] = val;
	}

	function assert(condition, message) {
		if (!condition) {
			message = message || "Assertion failed";
			if (typeof Error !== "undefined") {
				throw new Error(message);
			}
			throw message; // Fallback
		}
	}

	function niceNumber(n) {
		for (i = 7; i >= 0; i--) {
			var modfac = Math.pow(10,i);
			if (Math.abs(n) > (2*modfac)) {
				return n - (n % modfac);
			}
		}
		return n;
	}

	function capitalizeFirst(name) {
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	function randName(rng) {
		var syllables = "abi,gail,bel,bra,ham,dair,son,lia,line,dolph,an,ai,dan,leen,ara,gorn,bo,ro,mir,sam,wise,fro,do,pip,in,gan,dalf,sau,ron,gim,li,as,cle,chit,ho,mu,li,do,kro,ne,me,ge,sym,na,la,ne,so,non,su,syst,via,se,ze,la,nip,au,go,bal,nit,dug,be,tu,lan,de,mor,chi,rin,gu,ri,na,tur,urd,chau,rog,gon,goth,mon,gli,vae,tug,val,ko,tu,go,ru,li,cal,ko,morg,ria,sa,ran,vau,gond,cor,tum,pe,non,hho,to,pit,so,ne,riel,sih,po,ki,el,hor,he,nin,zu,sar,ces,ma,ran,deo,li,de,va,he,fei,va,ror,fe,me,can,da,be,ju,sae,nel,phi,en,dor,do,ran,ther,ari,aran,qui,roth,os,tai,nal,war,wor,rad,wa,rald,ash,bu,ren,to,ria".split(",");
		var name = rng.choice(syllables)
		/* like add a second syllable */
		if (rng.nextRange(0,10) < 9)
			name += rng.choice(syllables);
		/* maybe add a third syllable */
		if (rng.nextRange(0,10) < 4)
			name += rng.choice(syllables);
		return capitalizeFirst(name);
	}

	function RNG(seed) {
		// LCG using GCC's constants
		// see https://stackoverflow.com/questions/424292/seedable-javascript-random-number-generator
		this.m = 0x80000000; // 2**31;
		this.a = 1103515245;
		this.c = 12345;
		this.state = seed ? seed : Math.floor(Math.random() * (this.m-1));
	}
	RNG.prototype.nextInt = function() {
		this.state = (this.a * this.state + this.c) % this.m;
		return this.state;
	}
	RNG.prototype.nextFloat = function() {
		// returns in range [0,1]
		return this.nextInt() / (this.m - 1);
	}
	RNG.prototype.nextRange = function(start, end) {
		// returns in range [start, end): including start, excluding end
		// can't modulu nextInt because of weak randomness in lower bits
		var rangeSize = end - start;
		var randomUnder1 = this.nextInt() / this.m;
		return start + Math.floor(randomUnder1 * rangeSize);
	}
	RNG.prototype.choice = function(array) {
		return array[this.nextRange(0, array.length)];
	}

	/* expose public API */
	Game.reset = resetState;

	startGame();
})();
