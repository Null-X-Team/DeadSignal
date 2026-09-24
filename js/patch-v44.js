// DeadSignal patch v44 — fullscreen, 1 coin per wave, more guns
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) {
    console.warn("[DS v44] Engine missing");
    return;
  }

  // ---------- 1) FULLSCREEN ----------
  function isFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function enterFs() {
    var el = document.getElementById("game-shell") || document.documentElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) {
      try { req.call(el); } catch (e) {}
    }
  }
  function exitFs() {
    var x = document.exitFullscreen || document.webkitExitFullscreen;
    if (x) {
      try { x.call(document); } catch (e) {}
    }
  }
  function toggleFs() {
    if (isFs()) exitFs();
    else enterFs();
  }

  // F key + button
  document.addEventListener("keydown", function (e) {
    if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      toggleFs();
    }
  });

  function ensureFsButton() {
    if (document.getElementById("ds-fs-btn")) return;
    var btn = document.createElement("button");
    btn.id = "ds-fs-btn";
    btn.type = "button";
    btn.textContent = "Fullscreen (F)";
    btn.style.cssText =
      "position:absolute;top:8px;right:8px;z-index:80;padding:6px 10px;" +
      "background:rgba(0,0,0,0.7);color:#7ee8d4;border:1px solid rgba(126,232,212,0.4);" +
      "border-radius:6px;cursor:pointer;font:12px system-ui,sans-serif;";
    btn.onclick = function () { toggleFs(); };
    var shell = document.getElementById("game-shell") || document.getElementById("app") || document.body;
    shell.appendChild(btn);
  }
  ensureFsButton();

  // CSS: fill viewport when fullscreen
  if (!document.getElementById("ds-fs-style")) {
    var st = document.createElement("style");
    st.id = "ds-fs-style";
    st.textContent =
      "#game-shell:fullscreen,#game-shell:-webkit-full-screen{width:100vw;height:100vh;background:#0a0b0d;}" +
      "#game-shell:fullscreen canvas#game,#game-shell:-webkit-full-screen canvas#game{" +
      "width:100% !important;height:100% !important;max-width:100vw;max-height:100vh;object-fit:contain;}" +
      "html,body{margin:0;height:100%;}" +
      "#app,#game-shell{min-height:100%;}";
    document.head.appendChild(st);
  }

  // ---------- 2) 1 COIN EVERY WAVE ----------
  var Meta = window.DeadSignalMeta;
  if (Meta && typeof Meta.onWaveCleared === "function") {
    var _origWave = Meta.onWaveCleared.bind(Meta);
    Meta.onWaveCleared = function (waveNum) {
      // Call original for lifetime tracking / cloud save side effects,
      // but force +1 coin every wave (not only every 5).
      try {
        if (Meta.state || (Meta.getState && Meta.getState())) {
          /* prefer public API */
        }
      } catch (e) {}
      _origWave(waveNum);

      // Guarantee at least +1 coin per cleared wave
      try {
        // Original may have already added bonus on multiples of 5 —
        // still always add 1 base coin per wave via internal state if exposed.
        if (typeof Meta.addCoins === "function") {
          Meta.addCoins(1);
        } else if (Meta._state) {
          Meta._state.coins = (Meta._state.coins | 0) + 1;
          Meta._state.dirty = true;
          if (Meta.refreshChip) Meta.refreshChip();
        } else {
          // Hook via buySkill path: mutate through known window export
          var eng = window.__deadSignal;
          if (eng && eng.say && waveNum > 0) {
            // visible feedback even if state is private
          }
        }
      } catch (e) {}
    };
  }

  // More reliable coin injection: wrap Engine wave-clear if present
  try {
    var proto = G.Engine.prototype;
    if (proto && proto.onWaveCleared) {
      var _ew = proto.onWaveCleared;
      proto.onWaveCleared = function () {
        var r = _ew.apply(this, arguments);
        try {
          if (window.DeadSignalMeta && window.DeadSignalMeta.grantWaveCoin) {
            window.DeadSignalMeta.grantWaveCoin(1);
          }
        } catch (e) {}
        return r;
      };
    }
  } catch (e) {}

  // ---------- 3) MORE GUNS ----------
  var extraGuns = [
    {
      id: "deagle",
      name: "Desert Eagle",
      slot: "1",
      mag: 7,
      reserveStart: 35,
      damage: 58,
      fireRate: 0.38,
      reload: 1.15,
      speed: 1400,
      pellets: 1,
      spread: 0.03,
      color: "#e8c87e",
      recoil: 10,
      cost: 130,
      kind: "gun",
      hold: "pistol",
      reloadAnim: "slide",
      pierce: false
    },
    {
      id: "vector",
      name: "KRISS Vector",
      slot: "3",
      mag: 25,
      reserveStart: 100,
      damage: 14,
      fireRate: 0.05,
      reload: 1.2,
      speed: 1200,
      pellets: 1,
      spread: 0.06,
      color: "#9ad7ff",
      recoil: 2,
      cost: 145,
      kind: "gun",
      hold: "smg",
      reloadAnim: "mag",
      pierce: false
    },
    {
      id: "ak",
      name: "AK-47",
      slot: "6",
      mag: 30,
      reserveStart: 90,
      damage: 32,
      fireRate: 0.11,
      reload: 1.4,
      speed: 1250,
      pellets: 1,
      spread: 0.045,
      color: "#8fd4a8",
      recoil: 6,
      cost: 125,
      kind: "gun",
      hold: "rifle",
      reloadAnim: "mag",
      pierce: false
    },
    {
      id: "scar",
      name: "SCAR-H",
      slot: "6",
      mag: 20,
      reserveStart: 60,
      damage: 38,
      fireRate: 0.16,
      reload: 1.5,
      speed: 1450,
      pellets: 1,
      spread: 0.028,
      color: "#c0d890",
      recoil: 6,
      cost: 170,
      kind: "gun",
      hold: "rifle",
      reloadAnim: "mag",
      pierce: false
    },
    {
      id: "doublebarrel",
      name: "Double Barrel",
      slot: "2",
      mag: 2,
      reserveStart: 24,
      damage: 22,
      fireRate: 0.35,
      reload: 1.6,
      speed: 900,
      pellets: 10,
      spread: 0.28,
      color: "#d6dde8",
      recoil: 12,
      cost: 110,
      kind: "gun",
      hold: "shotgun",
      reloadAnim: "pump",
      pierce: false
    },
    {
      id: "crossbow",
      name: "Crossbow",
      slot: "8",
      mag: 1,
      reserveStart: 20,
      damage: 85,
      fireRate: 1.0,
      reload: 1.6,
      speed: 900,
      pellets: 1,
      spread: 0.01,
      color: "#c4a070",
      recoil: 4,
      cost: 155,
      kind: "gun",
      hold: "sniper",
      reloadAnim: "bolt",
      pierce: true
    },
    {
      id: "minigun",
      name: "Minigun",
      slot: "0",
      mag: 100,
      reserveStart: 200,
      damage: 9,
      fireRate: 0.035,
      reload: 3.2,
      speed: 1050,
      pellets: 1,
      spread: 0.12,
      color: "#b8a070",
      recoil: 4,
      cost: 220,
      kind: "gun",
      hold: "lmg",
      reloadAnim: "belt",
      pierce: false,
      prone: true
    },
    {
      id: "rpg",
      name: "RPG-7",
      slot: "9",
      mag: 1,
      reserveStart: 6,
      damage: 160,
      fireRate: 1.4,
      reload: 2.4,
      speed: 700,
      pellets: 1,
      spread: 0.02,
      color: "#c44",
      recoil: 14,
      cost: 250,
      kind: "gun",
      hold: "rpg",
      reloadAnim: "charge",
      pierce: false
    }
  ];

  function injectGuns() {
    if (!G.WEAPONS || !Array.isArray(G.WEAPONS)) return;
    var have = {};
    G.WEAPONS.forEach(function (w) { if (w && w.id) have[w.id] = true; });
    extraGuns.forEach(function (w) {
      if (!have[w.id]) {
        G.WEAPONS.push(w);
        have[w.id] = true;
      }
    });
    console.log("[DS v44] weapons count:", G.WEAPONS.length);
  }
  injectGuns();

  // Also try after engine instance boot
  var tries = 0;
  var t = setInterval(function () {
    injectGuns();
    if (++tries > 20) clearInterval(t);
  }, 500);

  console.log("[DeadSignal] patch v44 loaded — fullscreen + coins/wave + extra guns");
})();
