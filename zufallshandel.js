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
  function randRange(min,max) {
    var range = max-min;
    assert (range >= 0);
    var ret = min + (Math.random() * range);
    if (ret > 2000) {
      ret = ret - (ret % 1000);
    }
    return ret;
  }
  function randIndex(list) {
    return (Math.random() * (list.length-1)).toFixed(0);
  }
  function choose(items) {
    var index = (Math.random() * (items.length-1)).toFixed(0);
    return items[index];
  }
  function generateCarDeal() {
    var oldValue = randRange(2000,10000);
    var budget = randRange(5000,40000);
    var newValue = randRange(11000,55000);
    var features = [
      "großer Kofferraum",
      "fünf Sitze",
      "Klimaanlage",
      "geringer Verbrauch"
    ];
    var wanted = [];
    for (i = 0; i < 3; i++) {
      var idx = randIndex(features);
      var item = features[idx];
      features.splice(idx, 1);
      wanted += item;
    }
    var left = "Du hast ein Budget von "+budget+"€ und dein altes Auto. "+
      "Du möchtest "+wanted+"."+
      "";
    var shared = "Ein neues Auto muss her. "+
      "Dafür kann das Alte verkauft werden.";
    var right = "Das Auto des Kunden könntest du für "+oldValue+"€ verkaufen, "+
      "aber dein Chef will mindestens 10% Gewinn."+
      "";
    return [left, shared, right];
  }
  function showScenario(scen) {
    assert (scen.length == 3);
    var left = scen[0];
    var shared = scen[1];
    var right = scen[2];
    document.getElementById("scenario").innerHTML =
      '<div id="left">'+left+'</div>' +
      '<div id="shared">'+shared+'</div>' +
      '<div id="right">'+right+'</div>';
  }
  showScenario(generateCarDeal());
}
