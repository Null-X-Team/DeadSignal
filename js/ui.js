(function () {
  var Engine = window.DeadSignalGame && window.DeadSignalGame.Engine;
  if (!Engine) {
    console.error("Dead Signal engine failed to load");
    var m = document.getElementById("menu");
    if (m) {
      var p = document.createElement("p");
      p.style.color = "#ff6a5a";
      p.textContent = "Engine failed to load. Hard-refresh (Ctrl+Shift+R).";
      m.querySelector(".menu-card") && m.querySelector(".menu-card").appendChild(p);
    }
    return;
  }

  var canvas = document.getElementById("game");
  var menu = document.getElementById("menu");
  var shopEl = document.getElementById("shop");
  var shopList = document.getElementById("shop-list");
  var shopNote = document.getElementById("shop-note");
  var openArmory = document.getElementById("open-armory");
  var restBanner = document.getElementById("rest-banner");
  var messageEl = document.getElementById("message");
  var startBtn = document.getElementById("start-btn");
  var menuTitle = document.getElementById("menu-title");
  var menuKicker = document.getElementById("menu-kicker");
  var menuCopy = document.getElementById("menu-copy");
  var menuControls = document.getElementById("menu-controls");

  var lastHud = null;
  var lastPush = 0;

  var engine;
  try {
    engine = new Engine(
      canvas,
      function (hud) {
        try {
          var now = performance.now();
          if (
            now - lastPush < 80 &&
            lastHud &&
            lastHud.phase === hud.phase &&
            lastHud.shopOpen === hud.shopOpen &&
            lastHud.message === hud.message
          ) {
            paintFast(hud);
            return;
          }
          lastPush = now;
          lastHud = hud;
          paintHud(hud);
        } catch (err) {
          console.error("hud paint", err);
        }
      },
      function () {}
    );
  } catch (err) {
    console.error("Engine init failed", err);
    return;
  }

  function paintFast(hud) {
    setText("health-text", String(Math.ceil(hud.hp)));
    setText("score", String(hud.score));
    setText("credits", String(hud.credits));
    setText("shop-credits", String(hud.credits));
    setText("wave-number", String(hud.wave));
    setText("enemies-left", String(hud.remaining));
    setText("ammo-current", String(hud.ammo));
    setText("ammo-reserve", String(hud.reserve));
    var fill = document.getElementById("health-fill");
    if (fill) fill.style.width = (hud.hp / hud.maxHp) * 100 + "%";
    var reload = document.getElementById("reload-fill");
    if (reload) reload.style.width = hud.reloadT * 100 + "%";
    setText("kick-status", hud.kickT > 0 ? hud.kickT.toFixed(1) + "s" : "READY");
    if (hud.phase === "intermission" && restBanner) {
      restBanner.textContent =
        "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave";
    }
  }

  function paintHud(hud) {
    paintFast(hud);
    setText("weapon-name", hud.weaponName);
    setText("weapon-slot", "[" + hud.slot + "]");

    var playing = hud.phase === "combat" || hud.phase === "intermission" || hud.phase === "dying";
    var hudRoot = document.getElementById("hud");
    if (hudRoot) hudRoot.style.display = playing || hud.phase === "dying" ? "block" : "none";
    if (canvas) canvas.style.cursor = playing ? "crosshair" : "default";

    if (messageEl) {
      if (hud.message) {
        messageEl.textContent = hud.message;
        messageEl.classList.add("show");
      } else {
        messageEl.classList.remove("show");
      }
    }

    if (hud.phase === "intermission") {
      if (restBanner) {
        restBanner.classList.add("show");
        restBanner.textContent =
          "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave";
      }
      if (openArmory) openArmory.classList.toggle("show", !hud.shopOpen);
    } else {
      if (restBanner) restBanner.classList.remove("show");
      if (openArmory) openArmory.classList.remove("show");
    }

    if (shopEl) shopEl.classList.toggle("hidden", !hud.shopOpen);
    if (hud.shopOpen) renderShop(hud);

    if (hud.phase === "menu" || hud.phase === "dead") {
      if (menu) menu.classList.remove("hidden");
      if (hud.phase === "dead") {
        if (menuKicker) menuKicker.textContent = "Containment failed";
        if (menuTitle) menuTitle.innerHTML = "Signal<br><span>lost</span>";
        if (menuCopy) menuCopy.textContent =
          "The signals dragged you under. You held " +
          hud.wave +
          " wave" +
          (hud.wave === 1 ? "" : "s") +
          " for " +
          hud.score +
          " points. Best " +
          hud.highScore +
          ".";
        if (menuControls) menuControls.style.display = "none";
        if (startBtn) startBtn.textContent = "Restart containment";
      } else {
        if (menuKicker) menuKicker.textContent = "Null X Interactive · BUILD v20";
        if (menuTitle) menuTitle.innerHTML = "Dead<br><span>Signal</span>";
        if (menuCopy) menuCopy.textContent =
          "A 2D facility hallway. Signals come through the bay doors. Between waves, spend credits on guns and patch-ups at the armory.";
        if (menuControls) menuControls.style.display = "";
        if (startBtn) startBtn.textContent = "Begin transmission";
      }
    } else {
      if (menu) menu.classList.add("hidden");
    }
  }

  function weaponStats(weaponId) {
    if (!engine || !engine.weapons) return null;
    for (var i = 0; i < engine.weapons.length; i++) {
      if (engine.weapons[i].id === weaponId) return engine.weapons[i];
    }
    return null;
  }

  function showStats(item) {
    var panel = document.getElementById("shop-stats");
    if (!panel) return;
    if (!item) {
      panel.innerHTML = '<div class="label cyan">Inspect</div><p class="subtitle">Hover a weapon for stats.</p>';
      return;
    }
    if (item.kind !== "gun" || !item.weaponId) {
      panel.innerHTML =
        '<div class="label cyan">' + item.name + '</div>' +
        '<p class="subtitle">' + (item.blurb || "") + '</p>' +
        '<div class="stat-row"><span>Type</span><span>' + (item.kind || "utility").toUpperCase() + '</span></div>' +
        '<div class="stat-row"><span>Cost</span><span>' + item.cost + ' cr</span></div>';
      return;
    }
    var w = weaponStats(item.weaponId);
    if (!w) {
      panel.innerHTML = '<div class="label cyan">' + item.name + '</div><p class="subtitle">' + (item.blurb || "") + '</p>';
      return;
    }
    var type = w.melee ? "MELEE" : (w.kind || "gun").toUpperCase();
    var rpm = w.fireRate > 0 ? (60 / w.fireRate).toFixed(0) + " rpm" : "—";
    panel.innerHTML =
      '<div class="label cyan">' + w.name + '</div>' +
      '<p class="subtitle">' + (item.blurb || "") + '</p>' +
      '<div class="stat-row"><span>Type</span><span>' + type + '</span></div>' +
      '<div class="stat-row"><span>Damage</span><span>' + w.damage + (w.pellets > 1 ? " x" + w.pellets : "") + '</span></div>' +
      '<div class="stat-row"><span>Fire rate</span><span>' + rpm + '</span></div>' +
      '<div class="stat-row"><span>Mag</span><span>' + (w.melee ? "—" : w.mag) + '</span></div>' +
      '<div class="stat-row"><span>Reload</span><span>' + (w.melee ? "—" : w.reload.toFixed(2) + "s") + '</span></div>' +
      '<div class="stat-row"><span>Slot</span><span>' + w.slot + '</span></div>' +
      '<div class="stat-row"><span>Cost</span><span>' + item.cost + ' cr</span></div>';
  }

  function renderShop(hud) {
    if (!shopList) return;
    var items = engine.shopItems();
    shopList.innerHTML = "";
    showStats(null);
    items.forEach(function (item) {
      var owned = item.kind === "gun" && item.weaponId ? hud.owned[item.weaponId] : false;
      var li = document.createElement("li");
      li.className = "shop-item";
      var icon =
        item.kind === "gun"
          ? '<svg class="shop-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="10" width="14" height="5" rx="1" fill="currentColor"/><rect x="16" y="11" width="5" height="3" fill="currentColor"/><rect x="6" y="15" width="3" height="5" fill="currentColor"/></svg>'
          : item.kind === "patch"
            ? '<svg class="shop-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="4" fill="currentColor"/><rect x="10" y="4" width="4" height="16" fill="currentColor"/></svg>'
            : '<svg class="shop-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.2-5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
      li.innerHTML =
        '<div class="shop-item-main">' +
        icon +
        "<div><h3>" +
        item.name +
        "</h3><p>" +
        item.blurb +
        "</p></div></div>";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "buy-btn";
      btn.disabled = owned || hud.credits < item.cost;
      btn.textContent = owned ? "Owned" : item.cost + " cr";
      btn.addEventListener("click", function () {
        if (shopNote) shopNote.textContent = engine.buy(item);
        engine.pushHud();
      });
      li.addEventListener("mouseenter", function () { showStats(item); });
      li.addEventListener("mouseleave", function () { showStats(null); });
      li.appendChild(btn);
      shopList.appendChild(li);
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      try { engine.startRun(); } catch (e) { console.error(e); }
    });
  }
  var closeShop = document.getElementById("close-shop");
  if (closeShop) closeShop.addEventListener("click", function () {
    engine.closeShop();
  });
  var nextWave = document.getElementById("next-wave");
  if (nextWave) nextWave.addEventListener("click", function () {
    engine.continueWaves();
  });
  if (openArmory) openArmory.addEventListener("click", function () {
    engine.toggleShop();
  });

  function hold(id, code) {
    var el = document.getElementById(id);
    if (!el) return;
    var on = function (e) {
      e.preventDefault();
      engine.holdKey(code, true);
    };
    var off = function () {
      engine.holdKey(code, false);
    };
    el.addEventListener("pointerdown", on);
    el.addEventListener("pointerup", off);
    el.addEventListener("pointerleave", off);
    el.addEventListener("pointercancel", off);
  }
  hold("left-btn", "KeyA");
  hold("right-btn", "KeyD");
  var kickBtn = document.getElementById("kick-btn");
  if (kickBtn) kickBtn.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    engine.pulseKick();
  });
  var reloadBtn = document.getElementById("reload-btn");
  if (reloadBtn) reloadBtn.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    engine.beginReload();
  });
  var shopBtn = document.getElementById("shop-btn");
  if (shopBtn) shopBtn.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    engine.toggleShop();
  });
})();
