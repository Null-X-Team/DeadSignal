// DeadSignal — weapon images from /imgs
// Glock source faces LEFT → bake a right-facing canvas so muzzle always points forward
(function () {
  function loadFirst(paths, onReady) {
    var img = new Image();
    img.decoding = "async";
    var i = 0;
    function tryNext() {
      if (i >= paths.length) {
        console.warn("[DeadSignal] all paths failed", paths);
        return;
      }
      img.src = paths[i++];
    }
    img.onerror = tryNext;
    img.onload = function () {
      if (onReady) onReady(img);
    };
    tryNext();
    return img;
  }

  // Bake horizontally flipped copy so art faces RIGHT (muzzle +X)
  function bakeFlipRight(srcImg) {
    try {
      var c = document.createElement("canvas");
      c.width = srcImg.naturalWidth || srcImg.width;
      c.height = srcImg.naturalHeight || srcImg.height;
      if (!c.width || !c.height) return srcImg;
      var ctx = c.getContext("2d");
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(srcImg, 0, 0);
      var out = new Image();
      out.src = c.toDataURL("image/png");
      return out;
    } catch (e) {
      console.warn("[DeadSignal] flip bake failed", e);
      return srcImg;
    }
  }

  var glockRaw = loadFirst(["imgs/Glock.png", "imgs/glock.png"], function (img) {
    var flipped = bakeFlipRight(img);
    window.DS_GUNS.pistol = flipped;
    console.log("[DeadSignal] Glock baked right-facing");
  });
  var pump = loadFirst(["imgs/pump.png", "imgs/Pump.png"]);
  var hatchet = loadFirst(["imgs/Hatchet.png", "imgs/hatchet.png"]);
  var sniper = loadFirst(["imgs/sniper.png", "imgs/Sniper.png"]);
  var lmg = loadFirst(["imgs/LMG.png", "imgs/lmg.png"]);
  var smgImg = loadFirst(["imgs/smg.png", "imgs/Glock.png"]);
  var rifleImg = loadFirst(["imgs/rifle.png", "imgs/sniper.png"]);
  var railImg = loadFirst(["imgs/rail.png", "imgs/sniper.png"]);

  window.DS_GUNS = {
    pistol: glockRaw,
    scatter: pump,
    smg: smgImg,
    rail: railImg,
    hatchet: hatchet,
    melee: hatchet,
    carbine: rifleImg,
    burst: smgImg,
    slug: pump,
    sniper: sniper,
    auto: lmg,
    plasma: railImg,
    nailer: smgImg,
    marksman: sniper,
    cluster: pump
  };

  // pistol baked right-facing — no runtime flip
  window.DS_GUN_FLIP = {
    smg: true,
    burst: true,
    nailer: true
  };
  console.log("[DeadSignal] guns queued", Object.keys(window.DS_GUNS));
})();
