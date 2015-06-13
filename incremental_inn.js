(function() {
	const ID_GAMESTATE = "GAMESTATE";
	const ADD_PER_SECOND = 3;
	const SECONDS_PER_DAY = 2.78;
	const BEVERAGE_COUNT = 11;
	const MAX_NOTIFICATIONS = 6;
	const DAYS_PER_MONTH = 30;
	const MONTHS_PER_YEAR = 12;
	var STATE = Object();
	var innName = "Joe";
	var innkeeperName = "Joe";
	var cityName = "Sitty";
	var beverageList = [];

	function oneStep() {
		var now = Date.now();
		//console.log("step for "+elapsedTime_ms+"ms with counter = "+STATE.counter);
		var simulation_seconds = STATE.lastStepTime || now;
		while (simulation_seconds < now) {
			simulation_seconds += SECONDS_PER_DAY * 1000;
			simulateOneDay();
		}

		var elapsedTime_ms = Date.now() - STATE.lastStepTime;
		STATE.lastStepTime = now;
		STATE.counter += ADD_PER_SECOND * elapsedTime_ms / 1000;
		var sc = document.getElementById("counter");
		sc.innerHTML = STATE.counter | 0;
	}

	function simulateOneDay() {
		//console.log("compute day "+STATE.day);
		if (STATE.day % DAYS_PER_MONTH == 0)
			simulateMonthStart();
		sellBooze();
		monsterGrowth();
		cityGrowth();
		trimNotifications();
		STATE.day += 1;
	}

	function simulateMonthStart() {
		notify("Start of month "+getMonth()+" in year "+getYear());
	}

	function sellBooze() { }
	function monsterGrowth() { }
	function cityGrowth() { }

	function startGame() {
		var s = JSON.parse(window.localStorage.getItem(ID_GAMESTATE));
		if (!s) { /* new game, set initial state */
			resetState();
		} else { /* load old game */
			STATE = s;
		}
		initCachedState();
		setInterval(oneStep, 1900);
		setInterval(saveGame, 30*1000);
		oneStep();
	}

	function initCachedState() {
		/* Cached state is static wrt game. It is deterministically computed from the initial RNG seed, so no need to save it. */
		var rng = new RNG(STATE.startWeekday);
		innName = randInnName(rng);
		innkeeperName = randName(rng);
		cityName = randName(rng);
		var h1 = document.getElementById("inntitle");
		h1.innerHTML = 'The <span class="inn">'+innName+'</span> in <span class="city">'+cityName+'</span>';
		generateBeverages(rng);
	}

	function generateBeverages(rng) {
		for (var i=0; i<BEVERAGE_COUNT; i++) {
			var b = randBeverageName(rng);
			beverageList.push(b);
		}
	}

	function resetState() {
		var now = new Date();
		STATE = {
			"counter": 0,
			"lastStepTime": now,
			"startWeekday": now.getDay(),
			"day": 0,
			"goblins": {
				"population": 4,
				"level": 1,
			},
			"city": {
				"population": 14,
			},
			"inn": {
				"beverages": [],
			}
		};
	}

	function notify(msg) {
		var timeline = document.getElementById("timeline");
		var item = document.createElement("div");
		item.className = "item hidden";
		var p = document.createElement("p");
		var t = document.createTextNode(msg);
		p.appendChild(t);
		item.appendChild(p);
		timeline.insertBefore(item, timeline.childNodes[0]);
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

	function getDay() {
		return STATE.day % DAYS_PER_MONTH | 0;
	}
	function getMonth() {
		return STATE.day / DAYS_PER_MONTH % MONTHS_PER_YEAR | 0;
	}
	function getYear() {
		return STATE.day / DAYS_PER_MONTH / MONTHS_PER_YEAR | 0;
	}
	function getDateString() {
		return "day "+getDay()+" in the "+(getMonth()+1)+". month of the year "+getYear();
	}

	function saveGame() {
		var str = JSON.stringify(STATE);
		window.localStorage.setItem(ID_GAMESTATE, str);
		console.log("saved: "+str);
		notify("Saved game on day "+STATE.day+" aka "+getDateString()+".");
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

	function randInnName(rng) {
		var adj = ["Prancing", "Dancing", "Drinking", "Jolly",
			"Damned", "Dead", "Lost",
			"Cold", "Hot",
			"Red", "Green", "Blue", "Yellow", "Purpur"];
		var obj = ["Pony", "Dragon", "Lion", "Beetle", "Honey Bee",
			"Oak", "Walnut", "Birch", "Beech",
			"Kobold", "Orc", "Gnoll",
			"Rat", "Swine",
			"Lantern",
			"Wizard", "Pirate", "Paladin", "Baron", "Rogue", "Bard",
			"Deer", "Horse", "Oxen"];
		return rng.choice(adj) +" "+ rng.choice(obj);
	}

	function randBeverageName(rng) {
		var origin = randName(rng);
		var type = ["beer", "wine", "ale", "mead", "liquor", "cider", "whisky", "vodka", "sherry", "port"];
		var quality = ["crappy", "common", "nice", "tasty", "fine", "superb", "decent"];
		return rng.choice(quality) +" "+ capitalizeFirst(rng.choice(type)) + " from " + origin;
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

	var dummy_rng = new RNG(Date.now());
	startGame();
	notify("In the "+innName+" the innkeeper "+innkeeperName+" sells "+beverageList[0]);

})();
