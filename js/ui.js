(function () {
  var Engine = window.DeadSignalGame && window.DeadSignalGame.Engine;
  if (!Engine) {
    console.error("Dead Signal engine failed to load");
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

  var engine = new Engine(
    canvas,
    function (hud) {
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
    },
    function () {}
  );

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
    setText("weapon-slot", "[" + hud.slot + "]");

    var playing = hud.phase === "combat" || hud.phase === "intermission" || hud.phase === "dying";
    document.getElementById("hud").style.display = playing || hud.phase === "dying" ? "block" : "none";
    canvas.style.cursor = playing ? "crosshair" : "default";

    if (hud.message) {
      messageEl.textContent = hud.message;
      messageEl.classList.add("show");
    } else {
      messageEl.classList.remove("show");
    }

    if (hud.phase === "intermission") {
      restBanner.classList.add("show");
      restBanner.textContent =
        "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave";
      openArmory.classList.toggle("show", !hud.shopOpen);
    } else {
      restBanner.classList.remove("show");
      openArmory.classList.remove("show");
    }

    shopEl.classList.toggle("hidden", !hud.shopOpen);
    if (hud.shopOpen) renderShop(hud);

    if (hud.phase === "menu" || hud.phase === "dead") {
      menu.classList.remove("hidden");
      if (hud.phase === "dead") {
        menuKicker.textContent = "Containment failed";
        menuTitle.innerHTML = "Signal<br><span>lost</span>";
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
        menuControls.style.display = "none";
        startBtn.textContent = "Restart containment";
      } else {
        menuKicker.textContent = "Null X Interactive";
        menuTitle.innerHTML = "Dead<br><span>Signal</span>";
        menuCopy.textContent =
          "A 2D facility hallway. Signals come through the bay doors. Between waves, spend credits on guns and patch-ups at the armory.";
        menuControls.style.display = "";
        startBtn.textContent = "Start containment";
      }
    } else {
      menu.classList.add("hidden");
    }
  }

  function renderShop(hud) {
    var items = engine.shopItems();
    shopList.innerHTML = "";
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
        shopNote.textContent = engine.buy(item);
        engine.pushHud();
      });
      li.appendChild(btn);
      shopList.appendChild(li);
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  startBtn.addEventListener("click", function () {
    engine.startRun();
  });
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
    engine.pulseKick();
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
