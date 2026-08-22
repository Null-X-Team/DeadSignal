window.__DS_SRC += `      this.loop = (t) => {
        const dt = Math.min(0.05, (t - this.last || 16) / 1000);
        this.last = t;
        try {
          this.update(dt);
          const targetCam = clamp(this.player.x - VIEW_W * 0.42, 0, WORLD_W - VIEW_W);
          this.camX += (targetCam - this.camX) * (1 - Math.exp(-6 * dt));
          drawWorld(this);
        } catch (err) { console.error(err); }
        this.raf = requestAnimationFrame(this.loop);
      };
      this.raf = requestAnimationFrame(this.loop);
      this.pushHud();
      window.__deadSignal = this;
    }
    buildDoors() {
      this.doors = [{ id: 0, x: 280, kind: "shop", open: 0, target: 0, label: "ARMORY" }];
      let id = 1;
      for (let x = 560; x <= 2520; x += 280) {
        this.doors.push({ id: id++, x, kind: "spawn", open: 0, target: 0, label: "BAY " + (id - 1) });
      }
    }
    resetLoadout() {
      this.weapons = WEAPONS.map((w) => Object.assign({}, w, { ammo: w.mag, reserve: w.reserveStart, owned: w.id === "pistol" }));
      this.weaponIndex = 0;
    }
    bind() {
      const down = (e) => {
        this.keys.add(e.code);
        if (["Space", "ArrowLeft", "ArrowRight", "KeyB"].includes(e.code)) e.preventDefault();
        if (this.phase === "menu" && (e.code === "Enter" || e.code === "Space")) { this.startRun(); return; }
        if (this.phase === "dead" && e.code === "Enter") { this.startRun(); return; }
        if (e.code === "KeyR") this.beginReload();
        if (e.code === "Space") this.pulseKick();
        if (e.code === "Digit1") this.switchWeapon(0);
        if (e.code === "Digit2") this.switchWeapon(1);
        if (e.code === "Digit3") this.switchWeapon(2);
        if (e.code === "Digit4") this.switchWeapon(3);
        if (e.code === "KeyE" || e.code === "KeyB") this.toggleShop();
      };
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", (e) => this.keys.delete(e.code));
      window.addEventListener("blur", () => this.keys.clear());
      document.addEventListener("visibilitychange", () => { if (document.hidden) this.keys.clear(); });
      const point = (clientX, clientY) => {
        const r = this.canvas.getBoundingClientRect();
        return { x: ((clientX - r.left) * VIEW_W) / r.width, y: ((clientY - r.top) * VIEW_H) / r.height };
      };
      this.canvas.addEventListener("pointermove", (e) => { const p = point(e.clientX, e.clientY); this.mouse.x = p.x; this.mouse.y = p.y; });
      this.canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        this.mouse.down = true;
        const p = point(e.clientX, e.clientY); this.mouse.x = p.x; this.mouse.y = p.y;
        this.canvas.setPointerCapture(e.pointerId);
      });
      const release = () => { this.mouse.down = false; };
      this.canvas.addEventListener("pointerup", release);
      this.canvas.addEventListener("pointercancel", release);
    }
    holdKey(code, on) { if (on) this.keys.add(code); else this.keys.delete(code); }
    startRun() {
      this.sfx.unlock(); this.phase = "combat"; this.score = 0; this.credits = 0; this.wave = 0;
      this.toSpawn = 0; this.rest = 0; this.flash = 0; this.trauma = 0; this.shopOpen = false; this.onShop(false);
      this.bullets = []; this.enemies = []; this.particles = [];
      this.player.x = 520; this.player.y = FLOOR_Y - 42; this.player.hp = 100;
      this.player.fire = 0; this.player.reload = 0; this.player.kick = 0; this.player.hurt = 0;
      this.player.step = 0; this.player.facing = 1; this.player.aimLift = 0;
      this.resetLoadout();
      this.doors.forEach((d) => { d.open = 0; d.target = 0; });
      this.say("CONTAINMENT STARTED", 1.4); this.beginWave();
    }
    beginWave() {
      this.wave += 1; this.toSpawn = 6 + this.wave * 3; this.spawnTimer = 0.35;
      this.phase = "combat"; this.shopOpen = false; this.onShop(false);
      this.sfx.wave(); this.say("WAVE " + this.wave, 1.15);
    }
    beginIntermission() {
      this.phase = "intermission"; this.rest = 10;
      this.doors.forEach((d) => { d.target = d.kind === "shop" ? 1 : 0; });
      this.say("WAVE CLEAR — ARMORY OPEN", 2.2);
    }
    spawnFromDoor() {
      const bays = this.doors.filter((d) => d.kind === "spawn");
      const door = bays[Math.floor(Math.random() * bays.length)];
      door.target = 1;
      const roll = Math.random();
      let type = "signal";
      if (this.wave > 4 && roll > 0.82) type = "brute";
`;
