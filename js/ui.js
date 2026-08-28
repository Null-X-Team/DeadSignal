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
  var lastShopKey = "";
  var selectedLoadoutSlot = null;
  var engine;
  try {
    engine = window.__deadSignal = window.__dsEngine = new Engine(canvas, function (hud) {
      try {
        var now = performance.now();
        if (now - lastPush < 80 && lastHud && lastHud.phase === hud.phase && lastHud.shopOpen === hud.shopOpen && lastHud.message === hud.message) {
          paintFast(hud);
          return;
        }
        lastPush = now;
        lastHud = hud;
        paintHud(hud);
      } catch (err) { console.error("hud paint", err); }
    }, function () {});
  } catch (err) {
    console.error("Engine init failed", err);
    return;
  }
  function gunSprite(w) {
    if (!w || !window.DS_GUNS) return null;
    return window.DS_GUNS[w.id] || window.DS_GUNS[w.hold] || null;
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
      restBanner.textContent = "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave";
    }
  }
  function paintHud(hud) {
    paintFast(hud);
    setText("weapon-name", hud.weaponName);
    setText("weapon-slot", "[" + ((hud.loadoutIndex | 0) + 1) + "/3]");
    var playing = hud.phase === "combat" || hud.phase === "intermission" || hud.phase === "dying";
    var hudEl = document.getElementById("hud");
    if (hudEl) hudEl.style.display = playing || hud.phase === "dying" ? "block" : "none";
    if (canvas) canvas.style.cursor = playing ? "crosshair" : "default";
    if (messageEl) {
      if (hud.message) { messageEl.textContent = hud.message; messageEl.classList.add("show"); }
      else messageEl.classList.remove("show");
    }
    if (hud.phase === "intermission") {
      if (restBanner) { restBanner.classList.add("show"); restBanner.textContent = "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave"; }
      if (openArmory) openArmory.classList.toggle("show", !hud.shopOpen);
    } else {
      if (restBanner) restBanner.classList.remove("show");
      if (openArmory) openArmory.classList.remove("show");
    }
    if (shopEl) shopEl.classList.toggle("hidden", !hud.shopOpen);
    if (hud.shopOpen) {
      var key = hud.credits + "|" + JSON.stringify(hud.loadout || []) + "|" + JSON.stringify(hud.owned || {}) + "|" + (selectedLoadoutSlot === null ? "x" : selectedLoadoutSlot);
      if (key !== lastShopKey) { lastShopKey = key; renderShop(hud); }
    } else {
      lastShopKey = "";
      selectedLoadoutSlot = null;
    }
    if (hud.phase === "menu" || hud.phase === "dead") {
      if (menu) menu.classList.remove("hidden");
      if (hud.phase === "dead") {
        if (menuKicker) menuKicker.textContent = "Containment failed";
        if (menuTitle) menuTitle.innerHTML = "Signal<br><span>lost</span>";
        if (menuCopy) menuCopy.textContent = "The signals dragged you under. You held " + hud.wave + " wave" + (hud.wave === 1 ? "" : "s") + " for " + hud.score + " points. Best " + hud.highScore + ".";
        if (menuControls) menuControls.style.display = "none";
        if (startBtn) startBtn.textContent = "Restart containment";
      } else {
        if (menuKicker) menuKicker.textContent = "Null X Interactive · BUILD v39";
        if (menuTitle) menuTitle.innerHTML = "Dead<br><span>Signal</span>";
        if (menuCopy) menuCopy.textContent = "Space = KICK · E = hatchet. Shotgun falloff. Limbs fly off.";
        if (menuControls) menuControls.style.display = "";
        if (startBtn) startBtn.textContent = "Begin transmission";
      }
    } else {
      if (menu) menu.classList.add("hidden");
    }
  }
  function showStats(item, cost) {
    var panel = document.getElementById("shop-stats");
    if (!panel) return;
    if (!item) {
      panel.innerHTML = '<div class="label cyan">Inspect</div><p class="subtitle">Click a loadout slot, then pick a gun — or buy supplies.</p>';
      return;
    }
    var pierce = item.pierce ? "Yes" : "No";
    var rows = "<div class=\"label cyan\">" + (item.name || "Item") + "</div><p class=\"subtitle\">" + (item.blurb || "") + "</p><div class=\"stat-grid\"><div><span class=\"label\">Damage</span> " + (item.damage != null ? item.damage : "—") + "</div><div><span class=\"label\">Fire rate</span> " + (item.fireRate != null ? item.fireRate + "s" : "—") + "</div><div><span class=\"label\">Mag</span> " + (item.mag != null ? item.mag : "—") + "</div><div><span class=\"label\">Pierce armor</span> " + pierce + "</div></div>";
    if (cost != null && cost > 0) rows += "<p class=\"subtitle\">Cost " + cost + " credits</p>";
    panel.innerHTML = rows;
  }
  function renderShop(hud) {
    if (!shopList) return;
    shopList.innerHTML = "";
    var loadout = hud.loadout || ["pistol", null, null];
    var section = document.createElement("li");
    section.className = "shop-section";
    section.innerHTML = "<h3>Loadout slots</h3>";
    shopList.appendChild(section);
    for (var i = 0; i < 3; i++) {
      (function (slot) {
        var id = loadout[slot];
        var w = id && engine.weapons.find(function (x) { return x.id === id; });
        var li = document.createElement("li");
        li.className = "shop-item loadout-slot" + (selectedLoadoutSlot === slot ? " selected" : "") + (hud.loadoutIndex === slot ? " active" : "");
        var gspr = gunSprite(w);
        var thumb = gspr && gspr.src
          ? '<img class="loadout-thumb" src="' + gspr.src + '" alt="">'
          : (!w ? '<div class="loadout-thumb empty">+</div>' : '<div class="loadout-thumb placeholder">·</div>');
        li.innerHTML = '<div class="shop-item-main">' + thumb + "<div><h3>Slot " + (slot + 1) + (w ? " — " + w.name : " — Empty") + "</h3><p class=\"subtitle\">" + (w ? "Click to reassign" : "Click then choose a gun") + "</p></div></div>";
        li.addEventListener("click", function () {
          selectedLoadoutSlot = slot;
          lastShopKey = "";
          engine.pushHud();
        });
        if (w) li.addEventListener("mouseenter", function () { showStats(w, 0); });
        shopList.appendChild(li);
      })(i);
    }
    if (selectedLoadoutSlot !== null) {
      var sec2 = document.createElement("li");
      sec2.className = "shop-section";
      sec2.innerHTML = "<h3>Choose weapon for slot " + (selectedLoadoutSlot + 1) + "</h3>";
      shopList.appendChild(sec2);
      var items = engine.shopItems ? engine.shopItems() : [];
      items.forEach(function (it) {
        if (it.kind !== "gun") return;
        var w = engine.weapons.find(function (x) { return x.id === it.weaponId; });
        if (!w) return;
        var owned = hud.owned && hud.owned[w.id];
        var li = document.createElement("li");
        li.className = "shop-item";
        var gspr = gunSprite(w);
        var thumbHtml = gspr && gspr.src
          ? '<img class="loadout-thumb" src="' + gspr.src + '" alt="">'
          : '<div class="loadout-thumb placeholder">·</div>';
        var row = document.createElement("div");
        row.className = "shop-item-main";
        row.innerHTML = thumbHtml + "<div></div>";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "buy-btn";
        btn.textContent = owned ? "Equip " + w.name : "Buy " + w.name + " (" + it.cost + ")";
        btn.disabled = !owned && hud.credits < it.cost;
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (!owned) {
            var note = engine.buy(it);
            if (shopNote) shopNote.textContent = note || "";
          }
          var note2 = engine.equipToSlot(selectedLoadoutSlot, w.id);
          if (shopNote) shopNote.textContent = note2 || "";
          selectedLoadoutSlot = null;
          engine.pushHud();
        });
        row.lastChild.appendChild(btn);
        li.addEventListener("mouseenter", function () {
          showStats(Object.assign({}, w, { blurb: it.blurb, pierce: w.pierce }), owned ? 0 : it.cost);
        });
        li.appendChild(row);
        shopList.appendChild(li);
      });
    }
    var secSup = document.createElement("li");
    secSup.className = "shop-section";
    secSup.innerHTML = "<h3>Supplies</h3>";
    shopList.appendChild(secSup);
    var supplyItems = engine.shopItems ? engine.shopItems() : [];
    supplyItems.forEach(function (it) {
      if (it.kind !== "patch" && it.kind !== "ammo") return;
      var li = document.createElement("li");
      li.className = "shop-item";
      var row = document.createElement("div");
      row.className = "shop-item-main";
      var icon = it.kind === "ammo" ? "▣" : "+";
      row.innerHTML =
        '<div class="loadout-thumb placeholder">' + icon + "</div>" +
        "<div><h3>" + it.name + "</h3><p class=\"subtitle\">" + (it.blurb || "") + "</p></div>";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "buy-btn";
      btn.textContent = "Buy (" + it.cost + ")";
      btn.disabled = hud.credits < it.cost;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var note = engine.buy(it);
        if (shopNote) shopNote.textContent = note || "";
        engine.pushHud();
      });
      row.appendChild(btn);
      li.appendChild(row);
      li.addEventListener("mouseenter", function () {
        showStats({ name: it.name, damage: "—", fireRate: "—", mag: "—", blurb: it.blurb }, it.cost);
      });
      shopList.appendChild(li);
    });
    if (selectedLoadoutSlot === null) showStats(null);
  }
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  if (startBtn) {
    startBtn.addEventListener("click", function (ev) {
      try {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        if (!engine) { alert("Engine not ready. Hard-refresh (Ctrl+Shift+R)."); return; }
        engine.startRun();
      } catch (e) {
        console.error("startRun failed", e);
        alert("Start failed: " + (e && e.message ? e.message : e));
      }
    });
  }
  var closeShopBtn = document.getElementById("close-shop");
  if (closeShopBtn) closeShopBtn.addEventListener("click", function () { try { engine.closeShop(); } catch (e) { console.error(e); } });
  var nextWaveBtn = document.getElementById("next-wave");
  if (nextWaveBtn) nextWaveBtn.addEventListener("click", function () { try { engine.continueWaves(); } catch (e) { console.error(e); } });
  if (openArmory) openArmory.addEventListener("click", function () { try { engine.toggleShop(); } catch (e) { console.error(e); } });
  function hold(id, code) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); engine.holdKey(code, true); });
    el.addEventListener("pointerup", function () { engine.holdKey(code, false); });
    el.addEventListener("pointerleave", function () { engine.holdKey(code, false); });
    el.addEventListener("pointercancel", function () { engine.holdKey(code, false); });
  }
  hold("left-btn", "KeyA");
  hold("right-btn", "KeyD");
  var kickBtn = document.getElementById("kick-btn");
  if (kickBtn) kickBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); engine.legKick(); });
  var reloadBtn = document.getElementById("reload-btn");
  if (reloadBtn) reloadBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); engine.beginReload(); });
  var shopBtn = document.getElementById("shop-btn");
  if (shopBtn) shopBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); engine.toggleShop(); });
})();
