// DeadSignal v42 — build-tag lock (points at current build: v43)
(function () {
  var LABEL = "BUILD v43 — credits locked";
  var KICKER = "Null X Interactive · BUILD v43";
  function forceBuild() {
    try {
      var tag = document.getElementById("build-tag");
      if (tag) tag.textContent = LABEL;
      var k = document.getElementById("menu-kicker");
      if (k) {
        var t = k.textContent || "";
        if (/BUILD v/i.test(t) || /Null X Interactive/i.test(t)) {
          if (!/BUILD v43/i.test(t)) k.textContent = KICKER;
        }
      }
      var copy = document.getElementById("menu-copy");
      if (copy && /Space = KICK|Shotgun falloff|Limbs fly/i.test(copy.textContent || "")) {
        copy.textContent = "Kills give credits. Bodies fall. Holes + limbs.";
      }
    } catch (e) {}
  }
  forceBuild();
  var n = 0;
  var id = setInterval(function () {
    forceBuild();
    if (++n > 80) clearInterval(id);
  }, 100);
  try {
    var menu = document.getElementById("menu");
    if (menu && window.MutationObserver) {
      new MutationObserver(forceBuild).observe(menu, { attributes: true, attributeFilter: ["class"] });
    }
  } catch (e) {}
  console.log("[DeadSignal] v42 build-tag lock → v43");
})();
