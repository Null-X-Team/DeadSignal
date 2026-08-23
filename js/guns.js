// DeadSignal — weapon images from /imgs (fallback + procedural if missing)
(function () {
  function loadFirst(paths) {
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
    tryNext();
    return img;
  }
  var glock = loadFirst(["imgs/Glock.png", "imgs/glock.png", "img/gun_pistol.png"]);
  var pump = loadFirst(["imgs/pump.png", "imgs/Pump.png", "img/gun_scatter.png"]);
  var hatchet = loadFirst(["imgs/Hatchet.png", "imgs/hatchet.png"]);
  var sniper = loadFirst(["imgs/sniper.png", "imgs/Sniper.png", "img/gun_rifle.png"]);
  var lmg = loadFirst(["imgs/LMG.png", "imgs/lmg.png", "imgs/auto.png", "img/gun_auto.png"]);
  // Separate Image instances so flip flags never collide on shared objects
  var smgImg = loadFirst(["imgs/smg.png", "img/gun_smg.png", "imgs/Glock.png"]);
  var rifleImg = loadFirst(["imgs/rifle.png", "img/gun_rifle.png", "imgs/sniper.png"]);
  var railImg = loadFirst(["imgs/rail.png", "img/gun_rail.png", "imgs/sniper.png"]);

  // Map weapon id → image. Missing art falls back to closest silhouette;
  // engine draws procedural rectangle if image not complete.
  window.DS_GUNS = {
    pistol: glock,
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

  // true = source art points LEFT — engine mirrors so muzzle faces forward
  // Glock art faces left; pump/sniper/LMG/hatchet face right (no flip)
  window.DS_GUN_FLIP = {
    pistol: true,
    smg: true,
    burst: true,
    nailer: true
    // rail/plasma use sniper silhouette (faces right) — do not flip
  };
  console.log("[DeadSignal] guns queued", Object.keys(window.DS_GUNS));
})();
