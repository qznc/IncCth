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

	startGame();
})();
