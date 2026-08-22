window.__DS_SRC += `      const shop = this.doors[0];
      return Math.abs(this.player.x - shop.x) < 70 && this.phase === "intermission";
    }
    toggleShop() {
      if (this.phase === "intermission") {
        this.shopOpen = !this.shopOpen; this.onShop(this.shopOpen);
        if (this.shopOpen) this.say("ARMORY", 0.4);
      }
    }
    closeShop() { this.shopOpen = false; this.onShop(false); }
    continueWaves() { this.closeShop(); this.beginWave(); }
    buy(item) {
      if (this.credits < item.cost) return "Not enough credits.";
      if (item.kind === "patch") {
        if (this.player.hp >= this.player.max) return "Vitals already sealed.";
        this.credits -= item.cost;
        this.player.hp = clamp(this.player.hp + (item.id === "kit" ? this.player.max : 40), 0, this.player.max);
        this.sfx.buy(); return "Patch applied.";
      }
      if (item.kind === "ammo") {
        const w = this.weapon(); this.credits -= item.cost; w.reserve += w.mag * 2; this.sfx.buy();
        return "Reserve +" + w.mag * 2;
      }
      if (item.kind === "gun" && item.weaponId) {
        const w = this.weapons.find((x) => x.id === item.weaponId);
        if (!w) return "Unknown weapon.";
        if (w.owned) return "Already in the rack.";
        this.credits -= item.cost; w.owned = true; w.ammo = w.mag; w.reserve = w.reserveStart;
        this.weaponIndex = this.weapons.findIndex((x) => x.id === w.id);
        this.sfx.buy(); return w.name + " issued.";
      }
      return "";
    }
    update(dt) {
      if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) this.msg = ""; }
      this.trauma = Math.max(0, this.trauma - dt * 1.6);
      this.flash = Math.max(0, this.flash - dt);
      this.player.fire = Math.max(0, this.player.fire - dt);
      this.player.hurt = Math.max(0, this.player.hurt - dt);
      this.player.kick = Math.max(0, this.player.kick - dt);
      this.doors.forEach((d) => {
        d.open += (d.target - d.open) * (1 - Math.exp(-8 * dt));
        if (d.kind === "spawn" && d.open > 0.95 && this.phase === "combat") {
          const still = this.enemies.some((e) => !e.dead && e.doorId === d.id && Math.abs(e.x - d.x) < 40);
          if (!still) d.target = 0;
        }
      });
      if (this.phase === "menu" || this.phase === "dead" || this.shopOpen) { this.pushHud(); return; }
      if (this.player.reload > 0) {
        this.player.reload -= dt;
        if (this.player.reload <= 0) {
          const w = this.weapon();
          const need = w.mag - w.ammo;
          const load = Math.min(need, w.reserve);
          w.ammo += load; w.reserve -= load; this.say("RELOADED", 0.4);
        }
      }
      let mx = 0;
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
      this.player.vx = mx * this.player.speed;
      this.player.x = clamp(this.player.x + mx * this.player.speed * dt, 80, WORLD_W - 80);
      this.player.y = FLOOR_Y - 42;
      this.player.step += Math.abs(mx) * dt * 12;
      if (mx < 0) this.player.facing = -1;
      else if (mx > 0) this.player.facing = 1;
      const ox = this.player.x - this.camX;
      const adx = this.mouse.x - ox, ady = this.mouse.y - (this.player.y - 16);
      if (mx === 0 && Math.abs(adx) > 8) this.player.facing = adx < 0 ? -1 : 1;
      const localDx = Math.max(16, adx * this.player.facing);
      this.player.aimLift = Math.atan2(ady, localDx);
      this.player.aim = Math.atan2(ady, adx === 0 ? this.player.facing : adx);
      if (this.mouse.down) this.fire();
      if (this.phase === "combat") {
        if (this.toSpawn > 0) {
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
            this.spawnFromDoor(); this.toSpawn -= 1;
            this.spawnTimer = Math.max(0.22, 0.72 - this.wave * 0.035);
          }
        } else if (this.enemies.length === 0) this.beginIntermission();
      } else if (this.phase === "intermission") {
        this.rest -= dt;
        if (this.rest <= 0) this.beginWave();
      }
      this.bullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
      this.bullets = this.bullets.filter((b) => b.life > 0 && b.x > -40 && b.x < WORLD_W + 40 && b.y > -40 && b.y < VIEW_H + 40);
      for (const b of this.bullets) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dx = b.x - e.x, dy = b.y - e.y, hit = e.r + b.r;
          if (dx * dx + dy * dy < hit * hit) {
`;
