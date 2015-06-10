(function() {
	const ID_GAMESTATE = "gstate";
	const ADD_PER_SECOND = 3;
	var STATE = Object();

	function oneStep() {
		var now = Date.now();
		var elapsedTime_ms = Date.now() - STATE.lastStepTime;
		STATE.lastStepTime = now;
		//console.log("step for "+elapsedTime_ms+"ms with counter = "+STATE.counter);

		STATE.counter += ADD_PER_SECOND * elapsedTime_ms / 1000;
		var sc = document.getElementById("counter");
		sc.innerHTML = STATE.counter | 0;
	}

	function startGame() {
		var s = Save.load(ID_GAMESTATE) || {};
		setIfMissing(s, "counter", 0);
		setIfMissing(s, "lastStepTime", Date.now());
		STATE = s;
		setInterval(oneStep, 1000);
		setInterval(saveGame, 10*1000);
		oneStep();
	}

	function saveGame() {
		Save.save(ID_GAMESTATE, STATE);
		//console.log("saved");
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

	function randRange(min,max) {
		var range = max-min;
		assert (range >= 0);
		return min + (Math.random() * range);
	}

	function randIndex(list) {
		return (Math.random() * (list.length-1)).toFixed(0);
	}

	function choose(items) {
		var index = (Math.random() * (items.length-1)).toFixed(0);
		return items[index];
	}

	function randPop(list) {
		var idx = randIndex(list);
		var item = list[idx];
		list.splice(idx,1);
		return item;
	}

	function randInnName() {
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
		return choose(adj) +" "+ choose(obj);
	}
	console.log("Welcome to the "+randInnName()+"! Finest tavern here!");

	startGame();
})();
