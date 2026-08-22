window.__DS_SRC += `            e.hp -= b.damage; e.hit = 0.12; e.vx += Math.sign(b.vx) * 110; e.knock = 0.1; b.life = 0;
            this.burst(b.x, b.y, b.color, 5, 90);
            if (e.hp <= 0) this.kill(e);
            break;
          }
        }
      }
      this.enemies.forEach((e) => {
        if (e.dead) return;
        const dx = this.player.x - e.x, dist = Math.abs(dx) || 1;
        e.attack = Math.max(0, e.attack - dt); e.hit = Math.max(0, e.hit - dt); e.knock = Math.max(0, e.knock - dt);
        const speed = e.speed * (e.knock > 0 ? 0.28 : 1);
        e.x += (Math.sign(dx) * speed + e.vx) * dt;
        e.y = FLOOR_Y - (e.type === "brute" ? 52 : 42);
        e.facing = dx >= 0 ? 1 : -1;
        e.step += dt * (e.type === "runner" ? 14 : e.type === "brute" ? 6 : 9);
        e.vx *= Math.pow(0.001, dt);
        if (dist < e.r + this.player.r * 0.72 && e.attack <= 0) {
          this.hurt(e.damage); e.attack = 0.85; e.vx -= Math.sign(dx) * 220;
        }
      });
      this.enemies = this.enemies.filter((e) => !e.dead);
      this.particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.life -= dt; });
      this.particles = this.particles.filter((p) => p.life > 0);
      this.pushHud();
    }
    pushHud() {
      const w = this.weapon();
      this.onHud({
        hp: this.player.hp, maxHp: this.player.max, score: this.score, credits: this.credits,
        wave: this.wave, remaining: this.enemies.length + this.toSpawn,
        weaponName: w.name, slot: w.slot, ammo: w.ammo, reserve: w.reserve,
        reloadT: this.player.reload > 0 ? 1 - this.player.reload / w.reload : 0,
        kickT: this.player.kick, message: this.msg, phase: this.phase,
        nearShop: this.nearShop(), shopOpen: this.shopOpen, rest: this.rest, highScore: this.high,
        owned: { pistol: this.weapons[0].owned, scatter: this.weapons[1].owned, smg: this.weapons[2].owned, rail: this.weapons[3].owned },
        weaponIndex: this.weaponIndex,
      });
    }
  }

  // UI wiring
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
    gun: '<svg class="shop-icon" viewBox="0 0 24 24"><rect x="3" y="10" width="14" height="5" rx="1" fill="currentColor"/><rect x="16" y="11" width="5" height="3" fill="currentColor"/><rect x="6" y="15" width="3" height="5" fill="currentColor"/></svg>',
    patch: '<svg class="shop-icon" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="4" fill="currentColor"/><rect x="10" y="4" width="4" height="16" fill="currentColor"/></svg>',
    ammo: '<svg class="shop-icon" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.2-5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  };

  function renderShop(hud) {
    shopCredits.textContent = hud.credits;
    shopList.innerHTML = "";
    SHOP_ITEMS.forEach((item) => {
      const owned = item.kind === "gun" && item.weaponId ? hud.owned[item.weaponId] : false;
      const li = document.createElement("li");
      li.className = "shop-item";
      const kind = item.kind === "gun" ? "gun" : item.kind === "patch" ? "patch" : "ammo";
      li.innerHTML = '<div class="shop-item-main">' + icon[kind] + "<div><h3>" + item.name + "</h3><p>" + item.blurb + "</p></div></div>";
      const btn = document.createElement("button");
`;
