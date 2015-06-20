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

	function readBooks(event) {
		console.log("readBooks "+event);
		STATE.knowledge += 7;
		incSanityBy(-0.01)
		updateUI();
	}

	function makePause(event) {
		console.log("makePause "+event);
		STATE.knowledge -= 1;
		incSanityBy(0.01)
		updateUI();
	}

	function updateUI() {
		var rng = new RNG(1337);
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
			b.innerHTML = insaneText(text, 1.0 - STATE.sanity, rng);
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
		connectButtons();
		updateUI();
	}

	function connectButtons() {
		function connect(elemid, func) {
			document.getElementById(elemid).onclick = func;
		}
		connect("readBooks", readBooks);
		connect("makePause", makePause);
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

	function resetState() {
		var now = new Date();
		var globalSeed = now.getDay() * 1000;
		assert (globalSeed > GAME_VERSION, globalSeed+" <= "+GAME_VERSION);
		globalSeed += GAME_VERSION;
		console.log("globalSeed: "+globalSeed);
		STATE = {
			"knowledge": 0,
			"sanity": 1.0,
			"lastStepTime": now,
			"globalSeed": globalSeed,
		};
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
	}

	function trimNotifications() {
		var timeline = document.getElementById("timeline");
		if (timeline.childNodes.length > MAX_NOTIFICATIONS) {
			var item = timeline.childNodes[timeline.childNodes.length - 1];
			if (!item) return;
			item.className = "item hidden";
			setTimeout(function() {
				if (item.parentNode != timeline)
					return; /* things might have changed already */
				timeline.removeChild(item);
			}, 1000);
		}
	}

	function saveGame() {
		var str = JSON.stringify(STATE);
		window.localStorage.setItem(ID_GAMESTATE, str);
		console.log("saved: "+str);
		notify("Saved game on "+(new Date()));
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
