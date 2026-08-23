// DeadSignal — your gun images from /imgs
// Glock → pistol, pump → scatter. Drop more PNGs in imgs/ and add lines below.
(function () {
  function load(src) {
    var img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onerror = function () { console.warn("[DeadSignal] gun image missing:", src); };
    return img;
  }
  window.DS_GUNS = {
    pistol: load("imgs/Glock.png"),
    scatter: load("imgs/pump.png")
    // smg: load("imgs/your-smg.png"),
    // rail: load("imgs/your-rail.png"),
  };
  // Optional melee skin later:
  // window.DS_HATCHET = load("imgs/Hatchet.png");
  console.log("[DeadSignal] guns queued", Object.keys(window.DS_GUNS));
})();
