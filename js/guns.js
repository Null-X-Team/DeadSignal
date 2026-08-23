// DeadSignal — images from /imgs
(function () {
  function load(src) {
    var img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onerror = function () { console.warn("[DeadSignal] image missing:", src); };
    return img;
  }
  window.DS_GUNS = {
    pistol: load("imgs/Glock.png"),
    scatter: load("imgs/pump.png"),
    hatchet: load("imgs/Hatchet.png"),
    melee: load("imgs/Hatchet.png")
  };
  console.log("[DeadSignal] guns+hatchet queued", Object.keys(window.DS_GUNS));
})();
