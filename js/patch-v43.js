// DeadSignal v43 — force credits on kill + permanent BUILD lock
(function () {
  var G = window.DeadSignalGame;
  if (!G || !G.Engine) return;
  var proto = G.Engine.prototype;
  var LABEL = "BUILD v43 — credits locked";
  var KICKER = "Null X Interactive · BUILD v43";

  function stamp() {
    try {
      var tag = document.getElementById("build-tag");
      if (tag && tag.textContent !== LABEL) tag.textContent = LABEL;
      var k = document.getElementById("menu-kicker");
      if (k) {
        var t = k.textContent || "";
        if ((/BUILD v/i.test(t) || /Null X Interactive/i.test(t)) && !/BUILD v43/i.test(t)) {
          k.textContent = KICKER;
        }
      }
    } catch (e) {}
  }
  stamp();
  setInterval(stamp, 200);

  function awardAndKill(eng, e) {
    if (!e) return;
    if (!e._scored) {
      e._scored = true;
      var sc = Math.max(1, Number(e.score) || 12);
      eng.score = (Number(eng.score) || 0) + sc;
      eng.credits = (Number(eng.credits) || 0) + sc;
      try { if (eng.sfx && typeof eng.sfx.hit === "function") eng.sfx.hit(); } catch (err) {}
      try { if (typeof eng.say === "function") eng.say("+" + sc + " CR", 0.45); } catch (err2) {}
      try { if (typeof eng.pushHud === "function") eng.pushHud(); } catch (err3) {}
      try {
        var ce = document.getElementById("credits");
        if (ce) ce.textContent = String(eng.credits);
        var se = document.getElementById("score");
        if (se) se.textContent = String(eng.score);
        var sc2 = document.getElementById("shop-credits");
        if (sc2) sc2.textContent = String(eng.credits);
      } catch (err4) {}
    }
    if (!e.dead) {
      e.dead = true;
      e.fallT = e.fallT || 0.01;
      e.corpseLife = Math.max(e.corpseLife || 0, 12);
    } else {
      e.corpseLife = Math.max(e.corpseLife || 0, 8);
      e.fallT = Math.max(e.fallT || 0, 0.01);
    }
  }

  proto.kill = function (e) { awardAndKill(this, e); };

  function patchInstance(eng) {
    if (!eng || eng._v43Kill) return;
    eng._v43Kill = true;
    eng.kill = function (e) { awardAndKill(this, e); };
  }
  function scan() {
    patchInstance(window.__deadSignal);
    patchInstance(window.__dsEngine);
  }
  scan();
  var n = 0;
  var id = setInterval(function () {
    scan();
    if (++n > 50) clearInterval(id);
  }, 200);

  var _update = proto.update;
  if (typeof _update === "function") {
    proto.update = function (dt) {
      _update.call(this, dt);
      if (!this.enemies) return;
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e && e.hp <= 0 && !e._scored) awardAndKill(this, e);
      }
    };
  }

  console.log("[DeadSignal] v43 credits + build lock");
})();
