// DeadSignal — drop your gun images here
// Option A: point at image URLs (PNG/WebP recommended, ~64x32 or similar)
// Option B: paste data:image/png;base64,... strings
//
// Example:
//   window.DS_GUNS = {
//     pistol:  load("img/guns/pistol.png"),
//     scatter: load("img/guns/scatter.png"),
//     smg:     load("img/guns/smg.png"),
//     rifle:   load("img/guns/rifle.png"),
//     auto:    load("img/guns/auto.png"),
//     rail:    load("img/guns/rail.png"),
//   };
//
// Keys must match weapon ids: pistol, scatter, smg, rifle, auto, rail

(function () {
  function load(src) {
    var img = new Image();
    img.src = src;
    return img;
  }
  // Leave empty until you add art — game uses procedural guns as fallback
  window.DS_GUNS = window.DS_GUNS || {
    // pistol:  load("img/guns/pistol.png"),
    // scatter: load("img/guns/scatter.png"),
    // smg:     load("img/guns/smg.png"),
    // rifle:   load("img/guns/rifle.png"),
    // auto:    load("img/guns/auto.png"),
    // rail:    load("img/guns/rail.png"),
  };
  console.log("[DeadSignal] guns.js loaded", Object.keys(window.DS_GUNS));
})();
