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
	const DEBUG = false;
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
			if (item.knowledge > STATE.safeKnowledge + STATE.knowledge) continue;
			filtered.push(i);
		}
		if (filtered.length == 0) {
			return {"name": "nothing new"};
		} else {
			var index = XRNG.choice(filtered);
			var item = rknowl[index];
			STATE.readingKnowledge.splice(index,1);
			return item;
		}
	}

	var YouReadVariants = [
		"You read about ",
		"The book is about ",
		"The book tells you about ",
		"The book describes ",
		"Your literature is about ",
		"Your literature tells you about ",
		"Your literature describes ",
	];

	function readBooks(event) {
		var item = popKnowledgeItem();
		var prefix = XRNG.choice(YouReadVariants);
		notify(prefix+item.name+".");
		STATE.knowledge += 8 * STATE.sanity;
		incSanityBy(-0.1 * STATE.sanity);
		updateUI();
	}

	var YouDreamVariants = [
		"You dream about ",
		"You have a nightmare about ",
		"Your dreams are haunted by ",
		"Your dreams are plagued by ",
	];

	var YouRestVariants = [
		"After some sleep your head feels more clear.",
		"Some sleep and you greatly refreshed.",
		"You wake up.",
		"Everything is fine after a good nights sleep.",
		"The comfortable warmth of your bed steadies your soul.",
		"After sleeping soundly, you are ready for more.",
		"You dream nothing at all. Refreshing.",
		"Your dreams are cheerful. Interesting, given your literary preferences.",
		"Your dreams are erotic. Is that good or bad for your sanity?",
		"How wonderful some sleep can be.",
		"No nightmares.",
	];

	function getSleep(event) {
		var rng = new RNG(STATE.currentSeed);
		if (rng.nextFloat() > STATE.sanity) {
			var item = popKnowledgeItem();
			STATE.knowledge += 4 * STATE.sanity;
			incSanityBy(-0.02); // bad dreams
			var prefix = XRNG.choice(YouDreamVariants);
			notify(prefix+item.name+".");
		} else {
			incSanityBy(0.04); // rest
			var msg = XRNG.choice(YouRestVariants);
			notify(msg);
		}
		updateUI();
	}

	var DeathKnowledge = [
		"the gruesome death of <name>",
		"how <name> was tortured and killed by an asian cult",
		"the mysterious disappearance of <name>",
		"how <name> was murdered by an insane dog",
		"the bloody murder of <name>",
		"how a suicide murderer killed <name> and herself",
		"how <name> killed himself with a fork",
		"how <name> killed himself in the asylum",
		"how a mysterious illness killed <name>",
		"how <name> was killed after long torture",
	];

	function writeDown(event) {
		notify("You, "+STATE.charName+", write everything down, so somebody else can take over.");
		STATE.safeKnowledge += STATE.knowledge * STATE.sanity;
		newCharacter();
		var msg = XRNG.choice(DeathKnowledge).replace("<name>", STATE.charName);
		STATE.readingKnowledge.unshift({'name': msg, 'sanity': 0.99, 'knowledge': 1});
		updateUI();
	}

	function newCharacter() {
		var oldName = STATE.charName;
		STATE.knowledge = 0;
		STATE.sanity = 1.0;
		STATE.charName = randName();
		STATE.place = randPlace();
		youSitInLibrary();
	}

	function randPlace() {
		var places = [
			"Arkham",
			"Dunwich",
			"Innsmouth",
			"Kingsport",
		];
		return XRNG.choice(places);
	}

	function randName() {
		var firstNames = "Robert Randolph Herbert Joel Harley Hazel Richard Abraham Eliot Dan Ash Titus John Bran George Edward".split(" ");
		var surNames = "Carter West Blake Manton Warren Heald Pickman Helsing Cain Williams Ness Crucian Kirowan Morn Challenger".split(" ");
		return XRNG.choice(firstNames) +" "+ XRNG.choice(surNames);
	}

	function updateUI() {
		var rng = new RNG(STATE.currentSeed);
		STATE.currentSeed = rng.nextInt();

		completenessCheck();
		sanityCheck();

		var stable_rng = new RNG(STATE.globalSeed);
		function updateText(elemid,html) {
			document.getElementById(elemid).innerHTML = html;
		}
		updateText("stat-knowledge", STATE.knowledge | 0);
		updateText("stat-safeknowledge", STATE.safeKnowledge | 0);
		if (DEBUG) {
			updateText("stat-sanity", STATE.sanity.toFixed(2));
		} else {
			updateText("stat-sanity", insaneText("feels good", 1.0 - STATE.sanity, stable_rng));
		}
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

	function completenessCheck() {
		if (STATE.readingKnowledge.length > 0) return;
		resetState();
		notify("In an alternate reality, mankind figured out the Great Old Ones and destroyed them. (You won. Game has been reset.)");
	}

	function sanityCheck() {
		if (STATE.sanity > 0.1) return; /* everthing is fine */
		notify("You, "+STATE.charName+", lost your sanity. Unable to write or talk any coherent sentence, your knowledge is lost.");
		newCharacter();
	}

	function updateButtons() {
		function showElem(id) {
			var e = document.getElementById(id);
			e.classList.remove("hidden");
			return e;
		}
		function hideElem(id) {
			var e = document.getElementById(id);
			e.classList.add("hidden");
			return e;
		}
		function showButton(id) {
			var e = showElem(id);
			var hp = document.getElementById("always_actions");
			hp.appendChild(e);
		}
		function hideButton(id) {
			var e = hideElem(id);
			setTimeout(function() {
				var hp = document.getElementById("hiddenParent");
				hp.appendChild(e);
			}, 1000);
		}
		if (STATE.sanity < 0.76) showButton("getSleep");
		if (STATE.sanity > 0.95) hideButton("getSleep");
		if (STATE.knowledge > 50) showButton("writeDown");
		if (STATE.knowledge < 10) hideButton("writeDown");
		if (STATE.knowledge > 10) showElem("stat-tr-knowledge");
		if (STATE.knowledge < 1 && STATE.safeKnowledge < 1) hideElem("stat-tr-knowledge");
		if (STATE.safeKnowledge > 10) showElem("stat-tr-safeKnowledge");
		if (STATE.safeKnowledge < 1) hideElem("stat-tr-safeKnowledge");
		if (DEBUG) showElem("stat-tr-sanity");
	}

	function startGame() {
		XRNG = new RNG(Date.now());
		var s = JSON.parse(window.localStorage.getItem(ID_GAMESTATE));
		if (!s) { /* new game, set initial state */
			resetState();
		} else { /* load old game */
			STATE = s;
			youSitInLibrary();
		}
		setInterval(saveGame, 30*1000);
		setInterval(trimNotifications, 1500);
		connectButtons();
		updateUI();
	}

	function connectButtons() {
		function connect(elemid, func) {
			document.getElementById(elemid).onclick = func;
		}
		connect("readBooks", readBooks);
		connect("getSleep", getSleep);
		connect("writeDown", writeDown);
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
		var minimum_knowledge = -12;
		function n(name,sanity) {
			readknowledge.push({'name': name, 'sanity': sanity, 'knowledge': minimum_knowledge++});
		}
		n("an entity of living sound", 1.0 );
		n("a humanoid torso with tentacles instead of limbs", 1.0 );
		n("a tall, shadowy humanoid figure with yellow glowing eyes and strange protrusions like the branches of dead trees", 1.0 );
		n("a gigantic crab", 1.0 );
		n("a gigantic water lizard", 1.0 );
		n("a black, slimy mass covered in eyes and mouths", 1.0 );
		n("a gigantic, multicolored toad with one eye, a proboscis, crab-like claws, and tentacles below the mouth", 1.0 );
		n("a vampiric elephant-like humanoid with a mouth on the end of its trunk", 1.0 );
		n("a marine tentacled horror made of fish, whale and octopus-like features", 1.0 );
		n("a mix between a giant human, an octopus, and a dragon", 1.0 );
		n("a gigantic black mass of tentacles with a single green eye at the centre", 1.0 );
		n("a formless mound with one arm-like appendage", 1.0 );
		n("a huge, eyeless, black, soft-shelled tortoise with a triangular head and two whip-like tails, and suckers on the end of each tail", 1.0 );
		n("a jewel-facetted, semi-crystalline geode with mineral tentacles", 1.0 );
		n("a gigantic saurian creature and endowed with a mane of tentacles", 1.0 );
		n("a white orb hiding an enormous magenta excrescence, like an orchid or a lamprey mouth with emerald tentacles tipped with hands emerging from the mass", 1.0 );
		n("a huge, pallid, gelatinous oval with a myriad legs and multiple eyes", 1.0 );
		n("a bluish-brown, slimy monstrosity riddled with holes, and an occasional malformed head", 1.0 );
		n("a titanic mass of jelly material", 1.0 );
		n("a giant three-eyed slug with metallic spines, and tiny, pyramid-like feet underneath", 1.0 );
		n("a gigantic wattled slug-thing", 1.0 );
		n("a gigantic, black, toad-like creature with an impossibly malevolent glare, or a tentacled, scaled, bat-winged entity", 1.0 );
		n("a great shadow-thing with two red, glaring eyes", 1.0 );
		n("a polypous, ravenous floating mass endowed with tentacles, drills and suckers", 1.0 );
		n("a towering greenish trunk with a crown of tentacles, a row of multiple eyes and a couple of additional, lateral grasping appendages", 1.0 );
		n("a gigantic mouth surrounded by countless tentacles", 1.0 );
		n("a levitating, sinuous, glowing creature", 1.0 );
		n("a gigantic, corpse-like human with webbed feet and glowing red eyes", 1.0 );
		n("a great shining ball of energy", 1.0 );
		n("a squat, sea cucumber-like monstrosity with five eyes, three-toed, taloned appendages and large mouth", 1.0 );
		n("a humanoid with four, seven-clawed arms with tentacles in place of legs", 1.0 );
		n("a female seductive humanoid entity covered in vines and vegetal parts", 1.0 );
		n("a lustrous orb floating at the centre of a whirling vortex of razor-sharp, metallic looking blades", 1.0 );
		n("a succubus-like fiend with alien traits and tentacles in place of the hair", 1.0 );
		n("a huge shell-endowed beings, with eight segmented limbs and six long arms ending with claws", 1.0 );
		n("a ferocious and towering wolf-like humanoid with bat wings", 1.0 );
		n("a gigantic beating heart secluded in a parallel dimensions", 1.0 );
		n("a blurry, dark, kraken-like entity", 1.0 );
		n("a giraffe-like reptilian monster", 1.0 );
		n("a huge, tentacled mollusc", 1.0 );
		n("a twisting, ropy-tentacled mass with a single alien face somewhere in the center of the slimy squirming mass", 1.0 );
		n("a black, fanged, cycloptic demon with arms like swaying serpents", 1.0 );
		n("a tall humanoid with an eyeless, sea anemone-like face and a beaked grinning mouth", 1.0 );
		n("a miniature, wrinkled mummy with stiff, outstretched claws", 1.0 );
		n("a shark-like humanoid", 1.0 );
		n("a titanic raptorial fiend with a huge, single eye and a crown of tentacles", 1.0 );
		n("a three-eyed, gilled, proboscidian monster with a globular torso, six long, sinuous limbs ending in black paws with crab-like claws, and covered in what appears to be hair, but is actually tiny tentacles", 1.0 );
		n("a dead-black leafless oak tree, hot to the touch, with a single red eye at the centre", 1.0 );
		n("an eyeless, alien humanoid entity massively overgrown with strange flesh and machinery", 1.0 );
		n("a dark smoky column with red malevolent eyes and a grotesque face imprisoned in a vintage box", 1.0 );
		n("a mouthless, grotesque humanoid with pale tentacles protruding from underneath a dark robe", 1.0 );
		n("a huge, furry, almost humanoid toad, or a bat-like sloth", 1.0 );
		n("a huge faceless creature with various appendages sprouting from its head, a beard of oozing horns, and many reddish teats and fish-like fins sprouting from an egg-shaped body", 1.0 );
		n("a naked, obese, headless humanoid with a mouth in the palm of each hand", 1.0 );
		n("a festering, bubbling mass that constantly churns and whirls, putting forth vestigial appendages and reabsorbing them", 1.0 );
		n("an obese bat-winged humanoid with a long polypous snout and a wide mouth opening in the belly", 1.0 );

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
		n("an All-in-All"                                        , 0.91);
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

		n("Yig", 0.80);
		n("Cthylla", 0.80);
		n("Yog-Sothoth", 0.80);
		n("Shub-Niggurath", 0.80);
		n("Azathoth", 0.80);
		n("Nyarlathotep", 0.80);
		n("Cthulhu", 0.70);

		// TODO the names from https://en.wikipedia.org/wiki/Cthulhu_Mythos_deities
		console.log("Knowledge items total: "+readknowledge.length);
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
			"safeKnowledge": 0,
			"sanity": 1.0,
			"lastStepTime": now,
			"globalSeed": globalSeed,
			"currentSeed": globalSeed,
			"charName": randName(),
			"place": randPlace(),
		};
		initKnowledge();
		/* remove all notifications */
		var notes = document.getElementById("notifications");
		while (notes.firstChild) {
			notes.removeChild(notes.firstChild);
		}
		updateUI();
		youSitInLibrary();
	}

	function youSitInLibrary() {
		notify("You, "+STATE.charName+", sit in a library in "+STATE.place+".");
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
		if (window.innerHeight * 0.7 < notes.offsetHeight) {
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
		console.log("saved game");
	}

	function setIfMissing(obj, key, val) {
		if (key in obj && obj[key] !== undefined && obj[key] !== null) return;
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
