// DeadSignal — load only real images from /imgs (armory + in-hand)
(function () {
  function loadFirst(paths, onReady) {
    var img = new Image();
    img.decoding = "async";
    var i = 0;
    function tryNext() {
      if (i >= paths.length) {
        console.warn("[DeadSignal] image missing", paths[0]);
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
      return srcImg;
    }
  }

  // Keys must match weapon.id for in-hand draw, and hold/id for armory thumbs
  window.DS_GUNS = {};
  window.DS_GUN_FLIP = {};

  // Glock 19
  loadFirst(["imgs/Glock.png", "imgs/glock.png"], function (img) {
    var g = bakeFlipRight(img);
    window.DS_GUNS.pistol = g;
    window.DS_GUN_FLIP.pistol = false;
  });

  // Pump shotguns (Remington 870, Mossberg 590, AA-12)
  loadFirst(["imgs/pump.png", "imgs/Pump.png"], function (img) {
    window.DS_GUNS.scatter = img;
    window.DS_GUNS.slug = img;
    window.DS_GUNS.cluster = img;
    window.DS_GUNS.shotgun = img;
  });

  // Hatchet
  loadFirst(["imgs/Hatchet.png", "imgs/hatchet.png"], function (img) {
    window.DS_GUNS.hatchet = img;
    window.DS_GUNS.melee = img;
  });

  // MP5
  loadFirst(["imgs/MP5.png", "imgs/mp5.png"], function (img) {
    window.DS_GUNS.smg = img;
  });

  // M4A1
  loadFirst(["imgs/M4A1.png", "imgs/m4a1.png"], function (img) {
    window.DS_GUNS.carbine = img;
    window.DS_GUNS.rifle = img;
  });

  // Barrett M82
  loadFirst(["imgs/BarrettM82.png", "imgs/barrettm82.png", "imgs/Barrett.png"], function (img) {
    window.DS_GUNS.rail = img;
  });

  // M249 SAW / LMG
  loadFirst(["imgs/LMG.png", "imgs/lmg.png"], function (img) {
    window.DS_GUNS.auto = img;
  });

  // Lever action (marksman)
  loadFirst(["imgs/leveraction.png", "imgs/LeverAction.png"], function (img) {
    window.DS_GUNS.marksman = img;
    window.DS_GUNS.leveraction = img;
  });

  // Sniper if present (M24)
  loadFirst(["imgs/sniper.png", "imgs/Sniper.png", "imgs/M24.png"], function (img) {
    window.DS_GUNS.sniper = img;
  });

  console.log("[DeadSignal] guns: Glock, pump, hatchet, MP5, M4A1, Barrett, LMG, leveraction (+ sniper if present)");
})();
