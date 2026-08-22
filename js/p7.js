window.__DS_SRC += `      btn.className = "buy-btn";
      btn.disabled = owned || hud.credits < item.cost;
      btn.textContent = owned ? "Owned" : item.cost + " cr";
      btn.addEventListener("click", () => { shopNote.textContent = engine.buy(item); engine.pushHud(); });
      li.appendChild(btn); shopList.appendChild(li);
    });
  }

  function showMenu(hud) {
    if (hud.phase === "dead") {
      menuCard.innerHTML =
        '<div class="label red">Containment Failed</div><h1>SIGNAL<br><span>LOST</span></h1>' +
        '<p class="subtitle">You held <b>' + hud.wave + "</b> wave" + (hud.wave === 1 ? "" : "s") +
        " for <b>" + hud.score + "</b> points.<br>Highest local score: <b>" + hud.highScore + "</b></p>" +
        '<button class="primary-btn" id="start-btn">RESTART CONTAINMENT</button>';
    } else {
      menuCard.innerHTML =
        '<div class="label cyan">Null X Interactive // Corridor Survival</div><h1>DEAD<br><span>SIGNAL</span></h1>' +
        '<p class="subtitle">A 2D facility hallway. Hostiles come through the bay doors. Between waves, spend credits on guns and patch-ups at the armory.</p>' +
        '<div class="controls">' +
        '<div class="control"><kbd>A</kbd> <kbd>D</kbd> walk · faces left/right upright</div>' +
        '<div class="control"><kbd>Mouse</kbd> aim and fire</div>' +
        '<div class="control"><kbd>E</kbd> armory after a wave</div>' +
        '<div class="control"><kbd>Space</kbd> pulse kick</div>' +
        '<div class="control"><kbd>R</kbd> reload</div>' +
        '<div class="control"><kbd>1</kbd>-<kbd>4</kbd> switch guns</div></div>' +
        '<button class="primary-btn" id="start-btn">START CONTAINMENT</button>';
    }
    menu.classList.remove("hidden");
  }

  const engine = new Engine(canvas, (hud) => {
    ui.health.textContent = Math.ceil(hud.hp);
    ui.healthFill.style.width = (hud.hp / hud.maxHp) * 100 + "%";
    ui.score.textContent = hud.score; ui.credits.textContent = hud.credits;
    ui.wave.textContent = hud.wave; ui.enemies.textContent = hud.remaining;
    ui.weapon.textContent = hud.weaponName; ui.slot.textContent = "[" + hud.slot + "]";
    ui.ammo.textContent = hud.ammo; ui.reserve.textContent = hud.reserve;
    ui.reloadFill.style.width = hud.reloadT * 100 + "%";
    if (hud.kickT > 0) { ui.kick.textContent = hud.kickT.toFixed(1) + "s"; ui.kick.className = "red"; }
    else { ui.kick.textContent = "READY"; ui.kick.className = "good"; }
    if (hud.message) { ui.message.textContent = hud.message; ui.message.classList.add("show"); }
    else ui.message.classList.remove("show");
    if (hud.phase === "menu" || hud.phase === "dead") {
      if (menu.classList.contains("hidden")) showMenu(hud);
    } else menu.classList.add("hidden");
    if (hud.shopOpen) { shop.classList.remove("hidden"); renderShop(hud); }
    else shop.classList.add("hidden");
    if (hud.phase === "intermission" && !hud.shopOpen) {
      openArmory.classList.add("show"); restBanner.classList.add("show");
      restBanner.textContent = "Armory open · " + Math.max(0, Math.ceil(hud.rest)) + "s until next wave";
    } else { openArmory.classList.remove("show"); restBanner.classList.remove("show"); }
    canvas.style.cursor = (hud.phase === "combat" || hud.phase === "intermission") && !hud.shopOpen ? "crosshair" : "default";
  }, () => {});

  document.addEventListener("click", (event) => {
    if (event.target.closest("#start-btn")) engine.startRun();
  });
  document.getElementById("close-shop").addEventListener("click", () => engine.closeShop());
  document.getElementById("next-wave").addEventListener("click", () => engine.continueWaves());
  openArmory.addEventListener("click", () => engine.toggleShop());
  function hold(id, code) {
    const btn = document.getElementById(id);
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); engine.holdKey(code, true); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((name) => {
      btn.addEventListener(name, () => engine.holdKey(code, false));
    });
  }
  hold("left-btn", "KeyA"); hold("right-btn", "KeyD");
  document.getElementById("kick-btn").addEventListener("pointerdown", (e) => { e.preventDefault(); engine.pulseKick(); });
  document.getElementById("reload-btn").addEventListener("pointerdown", (e) => { e.preventDefault(); engine.beginReload(); });
  document.getElementById("shop-btn").addEventListener("pointerdown", (e) => { e.preventDefault(); engine.toggleShop(); });
})();
`;
