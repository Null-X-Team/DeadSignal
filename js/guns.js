// DeadSignal — weapon images from /imgs (fallback to procedural if missing)
(function () {
  function load(src) {
    var img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onerror = function () { console.warn("[DeadSignal] image missing:", src); };
    return img;
  }
  var glock = load("imgs/Glock.png");
  var pump = load("imgs/pump.png");
  var hatchet = load("imgs/Hatchet.png");
  // Map every weapon id — reuse closest art when custom art missing
  window.DS_GUNS = {
    pistol: glock,
    scatter: pump,
    smg: glock,
    rail: glock,
    hatchet: hatchet,
    melee: hatchet,
    carbine: glock,
    burst: glock,
    slug: pump,
    sniper: glock,
    auto: glock,
    plasma: glock,
    nailer: glock,
    marksman: glock,
    cluster: pump
  };
  console.log("[DeadSignal] guns queued", Object.keys(window.DS_GUNS));
})();
