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
  var hoveredShopItem = null;
  var selectedLoadoutSlot = null;

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
    if (hud.phase === "intermission") {
      restBanner.textContent =
        "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave";
    }
  }

  function paintHud(hud) {
    paintFast(hud);
    setText("weapon-name", hud.weaponName);
    setText("weapon-slot", "[" + ((hud.loadoutIndex | 0) + 1) + "/3]");

    var playing = hud.phase === "combat" || hud.phase === "intermission" || hud.phase === "dying";
    document.getElementById("hud").style.display = playing || hud.phase === "dying" ? "block" : "none";
    canvas.style.cursor = playing ? "crosshair" : "default";

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
    if (hud.shopOpen) {
      var key =
        hud.credits +
        "|" +
        JSON.stringify(hud.loadout || []) +
        "|" +
        JSON.stringify(hud.owned || {}) +
        "|" +
        (selectedLoadoutSlot === null ? "x" : selectedLoadoutSlot);
      if (key !== lastShopKey) {
        lastShopKey = key;
        renderShop(hud);
      }
    } else {
      lastShopKey = "";
      hoveredShopItem = null;
      selectedLoadoutSlot = null;
    }

    if (hud.phase === "menu" || hud.phase === "dead") {
      if (menu) menu.classList.remove("hidden");
      if (hud.phase === "dead") {
        if (menuKicker) menuKicker.textContent = "Containment failed";
        if (menuTitle) menuTitle.innerHTML = "Signal<br><span>lost</span>";
        if (menuCopy)
          menuCopy.textContent =
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
        if (menuKicker) menuKicker.textContent = "Null X Interactive · BUILD v24";
        if (menuTitle) menuTitle.innerHTML = "Dead<br><span>Signal</span>";
        if (menuCopy)
          menuCopy.textContent =
            "A 2D facility hallway. Carry 3 guns. Q cycles. E hatchet. Space kick.";
        if (menuControls) menuControls.style.display = "";
        if (startBtn) startBtn.textContent = "Begin transmission";
      }
    } else {
      if (menu) menu.classList.add("hidden");
    }
  }

  function weaponById(id) {
    if (!engine || !engine.weapons) return null;
    for (var i = 0; i < engine.weapons.length; i++) {
      if (engine.weapons[i].id === id) return engine.weapons[i];
    }
    return null;
  }

  function showStats(itemOrWeapon, cost) {
    var panel = document.getElementById("shop-stats");
    if (!panel) return;
    if (!itemOrWeapon) {
      panel.innerHTML =
        '<div class="label cyan">Inspect</div><p class="subtitle">Click a loadout slot, then pick a gun. Hover for stats.</p>';
      return;
    }
    var w =
      itemOrWeapon.damage !== undefined
        ? itemOrWeapon
        : weaponById(itemOrWeapon.weaponId || itemOrWeapon.id);
    if (!w) {
      panel.innerHTML =
        '<div class="label cyan">' +
        (itemOrWeapon.name || "") +
        '</div><p class="subtitle">' +
        (itemOrWeapon.blurb || "") +
        "</p>";
      return;
    }
    var type = w.melee ? "MELEE" : (w.kind || "gun").toUpperCase();
    var rpm = w.fireRate > 0 ? (60 / w.fireRate).toFixed(0) + " rpm" : "—";
    var c = cost != null ? cost : w.cost;
    panel.innerHTML =
      '<div class="label cyan">' +
      w.name +
      "</div>" +
      '<p class="subtitle">' +
      (w.melee ? "Bound to E" : "Loadout gun") +
      "</p>" +
      '<div class="stat-row"><span>Type</span><span>' +
      type +
      "</span></div>" +
      '<div class="stat-row"><span>Damage</span><span>' +
      w.damage +
      (w.pellets > 1 ? " x" + w.pellets : "") +
      "</span></div>" +
      '<div class="stat-row"><span>Fire rate</span><span>' +
      rpm +
      "</span></div>" +
      '<div class="stat-row"><span>Mag</span><span>' +
      (w.melee ? "—" : w.mag) +
      "</span></div>" +
      '<div class="stat-row"><span>Reload</span><span>' +
      (w.melee ? "—" : w.reload.toFixed(2) + "s") +
      "</span></div>" +
      '<div class="stat-row"><span>Cost</span><span>' +
      (c === 0 ? "Free" : c + " cr") +
      "</span></div>";
  }

  function gunThumb(weaponId) {
    var g = window.DS_GUNS && window.DS_GUNS[weaponId];
    if (g && g.complete && g.naturalWidth > 0) {
      return '<img class="loadout-thumb" src="' + g.src + '" alt="" />';
    }
    return '<div class="loadout-thumb placeholder"></div>';
  }

  function renderShop(hud) {
    if (!shopList) return;
    var loadout = hud.loadout || ["pistol", null, null];
    shopList.innerHTML = "";

    var slotsHeader = document.createElement("li");
    slotsHeader.className = "shop-section";
    slotsHeader.innerHTML = "<h3>Loadout (3 slots) · Q to cycle in-game</h3>";
    shopList.appendChild(slotsHeader);

    for (var s = 0; s < 3; s++) {
      (function (slotIdx) {
        var id = loadout[slotIdx];
        var w = id ? weaponById(id) : null;
        var li = document.createElement("li");
        li.className =
          "shop-item loadout-slot" +
          (selectedLoadoutSlot === slotIdx ? " selected" : "") +
          (hud.loadoutIndex === slotIdx ? " active" : "");
        var label = w ? w.name : "Empty";
        var thumb = w ? gunThumb(w.id) : '<div class="loadout-thumb empty">+</div>';
        li.innerHTML =
          '<div class="shop-item-main">' +
          thumb +
          "<div><h3>Slot " +
          (slotIdx + 1) +
          " · " +
          label +
          "</h3><p>" +
          (w ? "Click to change" : "Click to equip a gun") +
          "</p></div></div>";
        li.addEventListener("click", function () {
          selectedLoadoutSlot = slotIdx;
          lastShopKey = "";
          engine.pushHud();
        });
        if (w) {
          li.addEventListener("mouseenter", function () {
            showStats(w, w.owned ? 0 : w.cost);
          });
        }
        shopList.appendChild(li);
      })(s);
    }

    var utilHeader = document.createElement("li");
    utilHeader.className = "shop-section";
    utilHeader.innerHTML = "<h3>Supplies</h3>";
    shopList.appendChild(utilHeader);

    var utilities = [
      { id: "patch", name: "Field Patch", blurb: "Seal 40 vital points.", cost: 22, kind: "patch" },
      { id: "kit", name: "Trauma Kit", blurb: "Full vital restore.", cost: 48, kind: "patch" },
      { id: "ammo", name: "Mag Crate", blurb: "Reserve ammo for held gun.", cost: 16, kind: "ammo" }
    ];
    utilities.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "shop-item";
      li.innerHTML =
        '<div class="shop-item-main"><div><h3>' +
        item.name +
        "</h3><p>" +
        item.blurb +
        "</p></div></div>";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "buy-btn";
      btn.textContent = item.cost + " cr";
      btn.disabled = hud.credits < item.cost;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (shopNote) shopNote.textContent = engine.buy(item);
        engine.pushHud();
      });
      li.appendChild(btn);
      shopList.appendChild(li);
    });

    if (selectedLoadoutSlot !== null) {
      var pickHeader = document.createElement("li");
      pickHeader.className = "shop-section";
      pickHeader.innerHTML =
        "<h3>Choose gun for slot " + (selectedLoadoutSlot + 1) + "</h3>";
      shopList.appendChild(pickHeader);

      engine.weapons.forEach(function (w) {
        if (w.melee) return;
        var owned = !!(hud.owned && hud.owned[w.id]);
        var inLoadout = (hud.loadout || []).indexOf(w.id) >= 0;
        var li = document.createElement("li");
        li.className = "shop-item gun-pick";
        var costLabel = owned ? (inLoadout ? "Equipped" : "Free") : w.cost + " cr";
        li.innerHTML =
          '<div class="shop-item-main">' +
          gunThumb(w.id) +
          "<div><h3>" +
          w.name +
          "</h3><p>" +
          w.damage +
          " dmg · " +
          (w.fireRate > 0 ? (60 / w.fireRate).toFixed(0) + " rpm" : "—") +
          " · mag " +
          w.mag +
          "</p></div></div>";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "buy-btn";
        btn.textContent = costLabel;
        btn.disabled = !owned && hud.credits < w.cost;
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var note = engine.equipToSlot(selectedLoadoutSlot, w.id);
          if (shopNote) shopNote.textContent = note;
          selectedLoadoutSlot = null;
          engine.pushHud();
        });
        li.addEventListener("mouseenter", function () {
          showStats(w, owned ? 0 : w.cost);
        });
        li.appendChild(btn);
        shopList.appendChild(li);
      });
    } else {
      showStats(null);
    }
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      try {
        engine.startRun();
      } catch (e) {
        console.error(e);
      }
    });
  }
  document.getElementById("close-shop").addEventListener("click", function () {
    engine.closeShop();
  });
  document.getElementById("next-wave").addEventListener("click", function () {
    engine.continueWaves();
  });
  openArmory.addEventListener("click", function () {
    engine.toggleShop();
  });

  function hold(id, code) {
    var el = document.getElementById(id);
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
  document.getElementById("kick-btn").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    engine.swingHatchet();
  });
  document.getElementById("reload-btn").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    engine.beginReload();
  });
  document.getElementById("shop-btn").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    engine.toggleShop();
  });
})();
