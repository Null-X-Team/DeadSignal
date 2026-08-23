// DeadSignal — only load real imgs from /imgs (no fake/fallback art for other guns)
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

  // Only map weapons that have real dedicated images in /imgs
  window.DS_GUNS = {};
  window.DS_GUN_FLIP = {};

  loadFirst(["imgs/Glock.png", "imgs/glock.png"], function (img) {
    window.DS_GUNS.pistol = bakeFlipRight(img);
  });
  loadFirst(["imgs/pump.png", "imgs/Pump.png"], function (img) {
    window.DS_GUNS.scatter = img;
    window.DS_GUNS.slug = img;
    window.DS_GUNS.cluster = img;
  });
  loadFirst(["imgs/Hatchet.png", "imgs/hatchet.png"], function (img) {
    window.DS_GUNS.hatchet = img;
    window.DS_GUNS.melee = img;
  });
  loadFirst(["imgs/sniper.png", "imgs/Sniper.png"], function (img) {
    window.DS_GUNS.sniper = img;
    window.DS_GUNS.marksman = img;
  });
  loadFirst(["imgs/LMG.png", "imgs/lmg.png"], function (img) {
    window.DS_GUNS.auto = img;
  });
  // MP5, M4A1, M16A4, Barrett, HK417, UZI — no dedicated art → procedural draw only
  console.log("[DeadSignal] guns: real images only (Glock, pump, hatchet, sniper, LMG)");
})();
