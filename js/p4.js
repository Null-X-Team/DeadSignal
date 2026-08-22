window.__DS_SRC += `      else if (this.wave > 2 && roll > 0.64) type = "runner";
      const stats = type === "brute"
        ? { hp: 150, speed: 52, r: 40, damage: 18, color: "#ff7d78", score: 36 }
        : type === "runner"
          ? { hp: 40, speed: 138, r: 22, damage: 10, color: "#f2b7ff", score: 18 }
          : { hp: 70, speed: 78, r: 28, damage: 13, color: "#9bffcf", score: 12 };
      this.enemies.push({
        id: this.id++, type, x: door.x, y: FLOOR_Y - (type === "brute" ? 52 : 42),
        vx: 0, vy: 0, r: stats.r, hp: stats.hp + this.wave * 4, maxHp: stats.hp + this.wave * 4,
        speed: stats.speed + this.wave * 2, damage: stats.damage, score: stats.score, color: stats.color,
        hit: 0, attack: 0, knock: 0, dead: false, doorId: door.id,
        facing: this.player.x >= door.x ? 1 : -1, step: Math.random() * 8,
      });
    }
    weapon() { return this.weapons[this.weaponIndex]; }
    switchWeapon(i) {
      if (this.player.reload > 0) return;
      const w = this.weapons[i];
      if (!w || !w.owned || i === this.weaponIndex) return;
      this.weaponIndex = i; this.say(w.name.toUpperCase(), 0.65);
    }
    beginReload() {
      const w = this.weapon();
      if (this.player.reload > 0) return;
      if (w.ammo >= w.mag || w.reserve <= 0) return;
      this.player.reload = w.reload; this.say("RELOADING", 0.5);
    }
    fire() {
      if (this.phase !== "combat" && this.phase !== "intermission") return;
      if (this.shopOpen) return;
      if (this.player.reload > 0 || this.player.fire > 0) return;
      const w = this.weapon();
      if (w.ammo <= 0) { this.beginReload(); return; }
      w.ammo -= 1; this.player.fire = w.fireRate; this.flash = 0.05;
      this.trauma = Math.min(1, this.trauma + w.recoil * 0.04);
      this.sfx.shoot(w.id === "pistol" || w.id === "smg");
      const originX = this.player.x - this.camX, originY = this.player.y - 16;
      const dx = this.mouse.x - originX, dy = this.mouse.y - originY;
      if (Math.abs(dx) > 6) this.player.facing = dx < 0 ? -1 : 1;
      const localDx = Math.max(16, dx * this.player.facing);
      this.player.aimLift = Math.atan2(dy, localDx);
      const aim = Math.atan2(dy, dx === 0 ? this.player.facing : dx);
      this.player.aim = aim;
      const muzzleX = this.player.x + this.player.facing * 56;
      const muzzleY = this.player.y - 16 + this.player.aimLift * 26;
      for (let i = 0; i < w.pellets; i++) {
        const a = aim + rand(-w.spread, w.spread);
        this.bullets.push({ x: muzzleX, y: muzzleY, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, life: 0.7, damage: w.damage, color: w.color, r: w.pellets > 1 ? 3.5 : 5 });
      }
      this.burst(muzzleX, muzzleY, w.color, 7, 110);
    }
    pulseKick() {
      if (this.phase !== "combat" || this.player.kick > 0 || this.shopOpen) return;
      this.player.kick = 2.2; this.trauma = Math.min(1, this.trauma + 0.45);
      this.burst(this.player.x, this.player.y, "#ffbf70", 26, 240); this.say("PULSE KICK", 0.4);
      this.enemies.forEach((e) => {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < 175) {
          const f = (175 - d) / 175;
          e.vx += ((e.x - this.player.x) / (d || 1)) * 780 * f;
          e.knock = 0.3; e.hp -= 20; e.hit = 0.18;
          if (e.hp <= 0) this.kill(e);
        }
      });
    }
    hurt(n) {
      if (this.player.hurt > 0) return;
      this.player.hp = Math.max(0, this.player.hp - n); this.player.hurt = 0.32;
      this.trauma = Math.min(1, this.trauma + 0.5); this.sfx.hurt();
      this.burst(this.player.x, this.player.y, "#ff416c", 14, 150);
      if (this.player.hp <= 0) this.die();
    }
    die() {
      this.phase = "dead"; this.shopOpen = false; this.onShop(false);
      this.high = Math.max(this.high, this.score);
      localStorage.setItem("deadSignalHigh", String(this.high));
      this.say("SIGNAL LOST", 3);
    }
    kill(e) {
      if (e.dead) return;
      e.dead = true; this.score += e.score; this.credits += e.score; this.sfx.hit();
      this.burst(e.x, e.y, e.color, 16, 190);
      if (Math.random() < 0.16) {
        const w = this.weapon(); w.reserve += w.id === "pistol" ? 6 : 3; this.say("+ AMMO", 0.35);
      }
    }
    burst(x, y, color, n, p) {
      for (let i = 0; i < n; i++) {
        this.particles.push({ x, y, vx: rand(-p, p), vy: rand(-p, p), life: rand(0.18, 0.52), max: 0.52, size: rand(2, 5), color });
      }
    }
    say(t, s) { this.msg = t; this.msgT = s; }
    nearShop() {
`;
