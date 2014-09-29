var timer_end = 11;
var timer_state = 0;
var timer_running = false;
var timer_step_seconds = 1;
function updatetimer() {
  setTimeout(updatetimer,timer_step_seconds*1000);
  if (!timer_running) return;
  timer_state += timer_step_seconds;
  if (timer_end <= timer_state) {
    timer_state = timer_end;
    document.getElementById("timer").className = "finished";
  } else {
    document.getElementById("timer").className = "running";
  }
  function doubleDigitNumber(n) {
    return ("00"+Math.floor(n)).slice(-2);
  }
  var minutes = doubleDigitNumber(timer_state / 60);
  var seconds = doubleDigitNumber(timer_state % 60);
  document.getElementById("timer").innerHTML = minutes+":"+seconds;
}
updatetimer();
function starttimer() { /* start from 0 */
  timer_running = true;
  timer_state = 0;
}
function pausetimer() { /* pause or continue */
  timer_running = !timer_running;
}
function generate() {
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
  function generateCar(moneyMax, desiredFeatures) {
    var brands = [
      "Lamborarri",
      "BMUU",
      "Wolkenwagen",
      "Julia Romeo",
      "Cadillatti",
      "Seab",
      "Maserhatsu",
      "Mitsuyota"
    ];
    var brand = choose(brands);
    var surplus = randRange(-8000, 10000);
    var price = niceNumber(moneyMax + surplus);
    var features = [];
    if (price > moneyMax-4000)
      features.push(randPop(desiredFeatures));
    if (price > moneyMax+1000)
      features.push(randPop(desiredFeatures));
    if (price > moneyMax+8000)
      features.push(randPop(desiredFeatures));
    features = features.join(", ");
    return "Ein "+brand+" für "+price+"€ mit: "+features;
  }
  function generateTwist() {
    if (randRange(1,100) < 30) {
      var timelimit = niceNumber(randRange(2,9));
      if (timer_end > timelimit*60) {
        timer_end = timelimit*60;
      }
      return "<p>Du musst die Verhandlung innerhalb von "+timelimit+"&nbsp;Minuten abgeschlossen haben!</p>";
    }
    if (randRange(1,100) < 30) {
      var choices = [
        "<p>Du bist bekannt. Achte auf deinen Ruf!</p>",
        "<p>Die Verhandlung wird aufgezeichnet und möglicherweise veröffentlicht. Verhalte dich entsprechend!</p>",
        "<p>Dein Gegenüber hat einen schlechten Ruf. Sei vorsichtig!</p>",
        "<p>Sprich so wenig wie möglich!</p>",
      ];
      return randPop(choices);
    }
    return "";
  }
  function generateCarDeal() {
    var oldValue = niceNumber(randRange(2000,10000));
    var budget = niceNumber(randRange(5000,40000));
    var moneyMax = oldValue + budget;
    var features = [
      "großer Kofferraum",
      "sieben Sitze",
      "Klimaanlage",
      "ASP",
      "geringer Verbrauch"
    ];
    var wanted = [];
    for (i = 0; i < 3; i++) {
      wanted.push(randPop(features));
    }
    var shared = "<p>Ein neues Auto muss her. "+
      "Dafür kann das Alte verkauft werden.</p>";
    var right = "<p>Das Auto des Kunden könntest du für "+oldValue+"€ verkaufen, "+
      "aber dein Chef will mindestens 10% Gewinn."+
      "</p>";
    for (i = 0; i < 3; i++) {
      right += "<p>"+generateCar(moneyMax,wanted.slice(0))+"</p>"
    }
    wanted = wanted.join(", ");
    var left = "<p>Du hast ein Budget von "+budget+"€ und dein altes Auto. "+
      "Du möchtest: "+wanted+"."+
      "</p><p>"+
      "Du könntest vielleicht noch ein paar tausend von deinem Schwiegervater "+
      "leihen, aber den Stress willst du dir eigentlich ersparen."+
      "</p>";
    return [left, shared, right];
  }
  function generatePrisonerDilemma() {
    var kk = niceNumber(randRange(100,10000));
    var sk = niceNumber(kk * randRange(1.4,1.9));
    var ks = niceNumber(kk * randRange(1.4,1.9));
    var shared = "<p>"+
    "Jeder muss sich für Kooperation oder Sabotage entscheiden. "+
    "Die Entscheidung wird gleichzeitig/geheim getroffen."+
    "</p><p>"+
    "Wenn beide sabotieren, gewinnt niemand etwas. "+
    "Wenn beide kooperieren, gewinnt jeder jeweils "+kk+"€. "+
    "Abschließend können Teilgewinne übergeben werden. "+
    "</p>";
    var left = "<p>"+
    "Wenn nur du sabotierst, dann gewinnst du "+sk+"€.";
    "</p>";
    var right = "<p>"+
    "Wenn nur du sabotierst, dann gewinnst du "+ks+"€.";
    "</p>";
    return [left, shared, right];
  }
  function generateLotto() {
    var win = niceNumber(randRange(10000,1000000));
    var shared = "<p>"+
    "Ihr habt zusammen Lotto gespielt und "+win+"€ gewonnen. "+
    "</p>";
    var left = "<p>"+
    "Du hast das Los für 12€ gekauft. "+
    "Deine Investition, dein Risiko, dein Gewinn."+
    "</p>";
    var right = "<p>"+
    "Du hast die Zahlen getippt. "+
    "Du bist also hauptverantwortlich für den Gewinn. "+
    "</p>";
    return [left, shared, right];
  }
  function generatePutzplan() {
    var count = niceNumber(randRange(3,7));
    var items = [
      "Wäsche waschen",
      "Spülen",
      "Saugen",
      "Finanzen",
      "Abstauben",
      "Kochen",
      "Einkaufen",
      "Müll rausbringen",
    ];
    var chosen = [];
    for (i = 0; i < count; i++) {
      chosen.push(randPop(items));
    }
    var shared = "<p>"+
    "Ihr teilt die Aufgaben im Haushalt unter euch auf."+
    "<ul><li>"+
    chosen.join("</li><li>")+
    "</li></ul>"+
    "</p>";
    var left = "<p>"+
    "Du bist der Hauptverdiener und arbeitest länger."+
    "</p>";
    var right = "<p>"+
    "Dir gehört die Wohnung."+
    "</p>";
    return [left, shared, right];
  }
  function showScenario(scen) {
    assert (scen.length == 3);
    var left = scen[0] + generateTwist();
    var shared = scen[1];
    var right = scen[2] + generateTwist();
    document.getElementById("scenario").innerHTML =
      '<div id="left"><h2>A</h2>'+left+'</div>' +
      '<div id="shared"><h2>Aufgabe</h2>'+shared+'</div>' +
      '<div id="right"><h2>B</h2>'+right+'</div>';
  }
  var cases = [
    generatePutzplan,
    generateLotto,
    generatePrisonerDilemma
  ];
  /* reset timer end to 10 minutes
   * scenario generation might lower this */
  timer_end = 10*60;
  showScenario(randPop(cases)());
}
