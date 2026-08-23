s.weapon();
          const need = w.mag - w.ammo;
          const take = Math.min(need, w.reserve);
          w.ammo += take;
          w.reserve -= take;
          this.player.reload = 0;
          this.sfx.reload();
        }
      }
      this.player.kick = Math.max(0, this.player.kick - dt);
      this.player.hurt = Math.max(0, this.player.hurt - dt);
      this.player.fire = Math.max(0, this.player.fire - dt);
      this.flash = Math.max(0, this.flash - dt * 4);
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
      this.msgT = Math.max(0, this.msgT - dt);
      if (this.msgT <= 0) this.msg = "";
      for (const e of this.enemies) {
        if (!e.dead) continue;
        e.fallT = Math.min(1, (e.fallT || 0) + dt * 3.2);
        e.corpseLife = (e.corpseLife || 0) - dt;
      }
      this.enemies = this.enemies.filter((e) => !e.dead || (e.corpseLife || 0) > 0);
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      this.pushHud();
    }
    pushHud() {
      const w = this.weapon();
      this.onHud({
        hp: this.player.hp,
        maxHp: this.player.max,
        score: this.score,
        credits: this.credits,
        wave: this.wave,
        remaining: this.enemies.filter((e) => !e.dead).length + this.toSpawn,
        weaponName: w.name,
        slot: w.slot,
        ammo: w.ammo,
        reserve: w.reserve,
        reloadT: w.reload > 0 ? this.player.reload / w.reload : 0,
        kickT: this.player.kick,
        phase: this.phase,
        shopOpen: this.shopOpen,
        message: this.msg,
        rest: this.rest,
        owned: Object.fromEntries(this.weapons.map((w) => [w.id, w.owned]))
      });
    }
  };
  return __toCommonJS(engine_exports);
})();
