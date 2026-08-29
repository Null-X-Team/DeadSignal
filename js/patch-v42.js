// DeadSignal v42 — lock BUILD tag to v41 (ui/v40 were overwriting it)
(function () {
  function forceBuild() {
    try {
      var tag = document.getElementById("build-tag");
      if (tag) tag.textContent = "BUILD v41 — credits · fall · holes · limbs";
      var k = document.getElementById("menu-kicker");
      if (k) {
        var t = k.textContent || "";
        // only rewrite version labels, not death screen text
        if (/BUILD v/i.test(t) || /Null X Interactive/i.test(t)) {
          if (!/BUILD v41/i.test(t)) k.textContent = "Null X Interactive · BUILD v41";
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
    if (++n > 60) clearInterval(id); // first ~6s after load
  }, 100);
  // also re-assert whenever menu becomes visible
  try {
    var menu = document.getElementById("menu");
    if (menu && window.MutationObserver) {
      new MutationObserver(forceBuild).observe(menu, { attributes: true, attributeFilter: ["class"] });
    }
  } catch (e) {}
  console.log("[DeadSignal] v42 build-tag lock");
})();
