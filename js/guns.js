// DeadSignal guns v36 — wire all real /imgs files
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
    img.onload = function () { if (onReady) onReady(img); };
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
    } catch (e) { return srcImg; }
  }
  window.DS_GUNS = {};
  window.DS_GUN_FLIP = {};

  loadFirst(["imgs/Glock.png", "imgs/glock.png"], function (img) {
    window.DS_GUNS.pistol = bakeFlipRight(img);
  });
  loadFirst(["imgs/mossberg590.jpg", "imgs/pump.png", "imgs/Pump.png"], function (img) {
    window.DS_GUNS.scatter = img;
    window.DS_GUNS.slug = img;
    window.DS_GUNS.cluster = img;
    window.DS_GUNS.shotgun = img;
  });
  loadFirst(["imgs/Hatchet.png", "imgs/hatchet.png"], function (img) {
    window.DS_GUNS.hatchet = img;
    window.DS_GUNS.melee = img;
  });
  loadFirst(["imgs/MP5.png", "imgs/mp5.png"], function (img) {
    window.DS_GUNS.smg = img;
  });
  loadFirst(["imgs/M4A1.png", "imgs/m4a1.png", "imgs/M16A4.png"], function (img) {
    window.DS_GUNS.carbine = img;
    window.DS_GUNS.rifle = img;
  });
  loadFirst(["imgs/M16A4.png"], function (img) {
    window.DS_GUNS.m16 = img;
  });
  loadFirst(["imgs/BarrettM82.png", "imgs/barrettm82.png"], function (img) {
    window.DS_GUNS.rail = img;
  });
  loadFirst(["imgs/M249SAW.jpg", "imgs/LMG.png", "imgs/lmg.png"], function (img) {
    window.DS_GUNS.auto = img;
    window.DS_GUNS.lmg = img;
    window.DS_GUNS.m249 = img;
  });
  loadFirst(["imgs/leveraction.png", "imgs/LeverAction.png"], function (img) {
    window.DS_GUNS.marksman = img;
    window.DS_GUNS.leveraction = img;
  });
  loadFirst(["imgs/M24sniper.jpeg", "imgs/sniper.png", "imgs/Sniper.png", "imgs/M24.png"], function (img) {
    window.DS_GUNS.sniper = img;
  });
  console.log("[DeadSignal] guns v36 loaded");
})();
