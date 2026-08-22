(() => {
  const canvas = document.getElementById("game");
  const menu = document.getElementById("menu");
  const shop = document.getElementById("shop");
  const shopList = document.getElementById("shop-list");
  const shopNote = document.getElementById("shop-note");
  const shopCredits = document.getElementById("shop-credits");
  const openArmory = document.getElementById("open-armory");
  const restBanner = document.getElementById("rest-banner");
  const menuCard = document.querySelector(".menu-card");

  const ui = {
    health: document.getElementById("health-text"),
    healthFill: document.getElementById("health-fill"),
    score: document.getElementById("score"),
    credits: document.getElementById("credits"),
    wave: document.getElementById("wave-number"),
    enemies: document.getElementById("enemies-left"),
    weapon: document.getElementById("weapon-name"),
    slot: document.getElementById("weapon-slot"),
    ammo: document.getElementById("ammo-current"),
    reserve: document.getElementById("ammo-reserve"),
    reloadFill: document.getElementById("reload-fill"),
    kick: document.getElementById("kick-status"),
    message: document.getElementById("message"),
  };

  const icon = {
    gun: '<svg class="shop-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="10" width="14" height="5" rx="1" fill="currentColor"/><rect x="16" y="11" width="5" height="3" fill="currentColor"/><rect x="6" y="15" width="3" height="5" fill="currentColor"/></svg>',
    patch:
      '<svg class="shop-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="4" fill="currentColor"/><rect x="10" y="4" width="4" height="16" fill="currentColor"/></svg>',
    ammo: '<svg class="shop-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.2-5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  };

  let lastHud = null;

  function renderShop(hud) {
    shopCredits.textContent = hud.credits;
    shopList.innerHTML = "";
    DS.SHOP_ITEMS.forEach((item) => {
      const owned = item.kind === "gun" && item.weaponId ? hud.owned[item.weaponId] : false;
      const li = document.createElement("li");
      li.className = "shop-item";
      const kind = item.kind === "gun" ? "gun" : item.kind === "patch" ? "patch" : "ammo";
      li.innerHTML =
        '<div class="shop-item-main">' +
        icon[kind] +
        "<div><h3>" +
        item.name +
        "</h3><p>" +
        item.blurb +
        "</p></div></div>";
      const btn = document.createElement("button");
      btn.className = "buy-btn";
      btn.disabled = owned || hud.credits < item.cost;
      btn.textContent = owned ? "Owned" : item.cost + " cr";
      btn.addEventListener("click", () => {
        shopNote.textContent = engine.buy(item);
        engine.pushHud();
      });
      li.appendChild(btn);
      shopList.appendChild(li);
    });
  }

  function showMenu(hud) {
    if (hud.phase === "dead") {
      menuCard.innerHTML =
        '<div class="label red">Containment Failed</div>' +
        "<h1>SIGNAL<br><span>LOST</span></h1>" +
        '<p class="subtitle">You held <b>' +
        hud.wave +
        "</b> wave" +
        (hud.wave === 1 ? "" : "s") +
        " for <b>" +
        hud.score +
        "</b> points.<br>Highest local score: <b>" +
        hud.highScore +
        "</b></p>" +
        '<button class="primary-btn" id="start-btn">RESTART CONTAINMENT</button>';
    } else {
      menuCard.innerHTML =
        '<div class="label cyan">Null X Interactive // Corridor Survival</div>' +
        "<h1>DEAD<br><span>SIGNAL</span></h1>" +
        '<p class="subtitle">A 2D facility hallway. Hostiles come through the bay doors. Between waves, spend credits on guns and patch-ups at the armory.</p>' +
        '<div class="controls">' +
        '<div class="control"><kbd>A</kbd> <kbd>D</kbd> or <kbd>&larr;</kbd> <kbd>&rarr;</kbd><br>Walk the hall. Facing flips left/right, never upside down.</div>' +
        '<div class="control"><kbd>Mouse</kbd> / tap<br>Aim and fire</div>' +
        '<div class="control"><kbd>E</kbd> / <kbd>B</kbd><br>Open the armory after a wave</div>' +
        '<div class="control"><kbd>Space</kbd><br>Pulse kick nearby hostiles</div>' +
        '<div class="control"><kbd>R</kbd><br>Reload</div>' +
        '<div class="control"><kbd>1</kbd>-<kbd>4</kbd><br>Switch owned guns</div>' +
        "</div>" +
        '<button class="primary-btn" id="start-btn">START CONTAINMENT</button>';
    }
    menu.classList.remove("hidden");
  }

  const engine = new DS.Engine(
    canvas,
    (hud) => {
      lastHud = hud;
      ui.health.textContent = Math.ceil(hud.hp);
      ui.healthFill.style.width = (hud.hp / hud.maxHp) * 100 + "%";
      ui.score.textContent = hud.score;
      ui.credits.textContent = hud.credits;
      ui.wave.textContent = hud.wave;
      ui.enemies.textContent = hud.remaining;
      ui.weapon.textContent = hud.weaponName;
      ui.slot.textContent = "[" + hud.slot + "]";
      ui.ammo.textContent = hud.ammo;
      ui.reserve.textContent = hud.reserve;
      ui.reloadFill.style.width = hud.reloadT * 100 + "%";
      if (hud.kickT > 0) {
        ui.kick.textContent = hud.kickT.toFixed(1) + "s";
        ui.kick.className = "red";
      } else {
        ui.kick.textContent = "READY";
        ui.kick.className = "good";
      }
      if (hud.message) {
        ui.message.textContent = hud.message;
        ui.message.classList.add("show");
      } else {
        ui.message.classList.remove("show");
      }

      const playing = hud.phase === "combat" || hud.phase === "intermission";
      if (hud.phase === "menu" || hud.phase === "dead") {
        if (menu.classList.contains("hidden")) showMenu(hud);
      } else {
        menu.classList.add("hidden");
      }

      if (hud.shopOpen) {
        shop.classList.remove("hidden");
        renderShop(hud);
      } else {
        shop.classList.add("hidden");
      }

      if (hud.phase === "intermission" && !hud.shopOpen) {
        openArmory.classList.add("show");
        restBanner.classList.add("show");
        restBanner.textContent =
          "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave";
      } else {
        openArmory.classList.remove("show");
        restBanner.classList.remove("show");
      }

      canvas.style.cursor = playing && !hud.shopOpen ? "crosshair" : "default";
    },
    () => {},
  );

  document.addEventListener("click", (event) => {
    if (event.target.closest("#start-btn")) engine.startRun();
  });

  document.getElementById("close-shop").addEventListener("click", () => engine.closeShop());
  document.getElementById("next-wave").addEventListener("click", () => engine.continueWaves());
  openArmory.addEventListener("click", () => engine.toggleShop());

  function hold(id, code) {
    const btn = document.getElementById(id);
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      engine.holdKey(code, true);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((name) => {
      btn.addEventListener(name, () => engine.holdKey(code, false));
    });
  }

  hold("left-btn", "KeyA");
  hold("right-btn", "KeyD");
  document.getElementById("kick-btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    engine.pulseKick();
  });
  document.getElementById("reload-btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    engine.beginReload();
  });
  document.getElementById("shop-btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    engine.toggleShop();
  });
})();
