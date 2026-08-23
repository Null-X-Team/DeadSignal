// DeadSignal — your gun images from /imgs
// Glock → pistol, pump → scatter (shotgun). Add more later.
(function () {
  function load(src) {
    var img = new Image();
    img.src = src;
    return img;
  }
  window.DS_GUNS = {
    pistol: load("imgs/Glock.png"),
    scatter: load("imgs/pump.png")
    // smg: load("imgs/your-smg.png"),
    // rail: load("imgs/your-rail.png"),
  };
  // Hatchet available later for melee/kick skin:
  // window.DS_HATCHET = load("imgs/Hatchet.png");
  console.log("[DeadSignal] guns loaded", Object.keys(window.DS_GUNS));
})();
