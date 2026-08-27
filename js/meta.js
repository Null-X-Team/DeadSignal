// DeadSignal meta v35 — cloud save, coins, skill tree
(function () {
  var SKILLS = [
    { id: "vit1", branch: "Vitality", name: "Reinforced Vitals", max: 5, costs: [1, 2, 3, 4, 5], blurb: "+12 max HP per rank" },
    { id: "vit2", branch: "Vitality", name: "Field Dressing", max: 3, costs: [2, 3, 5], blurb: "Heal +8 HP between waves per rank" },
    { id: "vit3", branch: "Vitality", name: "Second Wind", max: 1, costs: [12], blurb: "Once per run, survive a lethal hit at 1 HP" },
    { id: "dmg1", branch: "Combat", name: "Hollow Point", max: 5, costs: [1, 2, 3, 4, 6], blurb: "+10% gun damage per rank" },
    { id: "rof1", branch: "Combat", name: "Hair Trigger", max: 4, costs: [2, 3, 4, 6], blurb: "-7% fire delay per rank" },
    { id: "rel1", branch: "Combat", name: "Speedloader", max: 4, costs: [1, 2, 3, 5], blurb: "-8% reload time per rank" },
    { id: "arm1", branch: "Combat", name: "AP Rounds", max: 3, costs: [3, 5, 8], blurb: "Ignore +10 armor per rank" },
    { id: "ml1", branch: "Melee", name: "Heavy Swing", max: 4, costs: [1, 2, 3, 5], blurb: "+15% hatchet damage per rank" },
    { id: "ml2", branch: "Melee", name: "Reaper Reach", max: 2, costs: [3, 6], blurb: "+12 hatchet range per rank" },
    { id: "spd1", branch: "Mobility", name: "Sprint Protocol", max: 4, costs: [1, 2, 3, 4], blurb: "+7% move speed per rank" },
    { id: "eco1", branch: "Economy", name: "Salvage Expert", max: 5, costs: [1, 2, 3, 4, 5], blurb: "+12% credits from kills per rank" },
    { id: "eco2", branch: "Economy", name: "Starting Stash", max: 4, costs: [2, 3, 5, 7], blurb: "+20 starting credits per rank" },
    { id: "eco3", branch: "Economy", name: "War Bonds", max: 3, costs: [3, 5, 8], blurb: "+1 bonus coin every 5 waves per rank" }
  ];
  var state = { coins: 0, lifetimeWaves: 0, skills: {}, cache: {}, ready: false, dirty: false, secondWindUsed: false };
  function rank(id) { return state.skills[id] | 0; }
  function skillById(id) { for (var i = 0; i < SKILLS.length; i++) if (SKILLS[i].id === id) return SKILLS[i]; return null; }
  function nextCost(s) { var r = rank(s.id); return r >= s.max ? null : s.costs[r]; }

  var Meta = {
    skills: SKILLS,
    getState: function () { return state; },
    isReady: function () { return !!state.ready; },
    coins: function () { return state.coins | 0; },
    rank: rank,
    applyLoaded: function (row) {
      state.coins = Math.max(0, (row && row.coins) | 0);
      state.lifetimeWaves = Math.max(0, (row && row.lifetime_waves) | 0);
      state.skills = (row && row.skills && typeof row.skills === "object") ? row.skills : {};
      state.cache = (row && row.cache && typeof row.cache === "object") ? row.cache : {};
      state.ready = true; state.dirty = false; state.secondWindUsed = false;
      Meta.refreshChip();
      console.log("[DeadSignal] save injected", state.coins, "coins");
    },
    markEmptyGuest: function () {
      state.coins = 0; state.lifetimeWaves = 0; state.skills = {}; state.cache = {};
      state.ready = true; state.dirty = false; Meta.refreshChip();
    },
    loadFromCloud: function () {
      state.ready = false;
      var Auth = window.DeadSignalAuth;
      var s = Auth && Auth.getSession && Auth.getSession();
      if (!s || s.guest || !s.uid || !s.cloud) { Meta.markEmptyGuest(); return Promise.resolve(null); }
      return Meta._client().then(function (c) {
        if (!c) { Meta.markEmptyGuest(); return null; }
        return c.from("player_saves").select("*").eq("user_id", s.uid).maybeSingle().then(function (res) {
          if (res.data) { Meta.applyLoaded(res.data); return res.data; }
          var seed = { user_id: s.uid, username: s.username || "operator", coins: 0, lifetime_waves: 0, skills: {}, cache: { version: 1 }, updated_at: new Date().toISOString() };
          return c.from("player_saves").upsert(seed, { onConflict: "user_id" }).then(function () { Meta.applyLoaded(seed); return seed; });
        });
      }).catch(function (e) { console.warn("[DeadSignal] load failed", e); Meta.markEmptyGuest(); return null; });
    },
    payload: function () {
      var s = window.DeadSignalAuth && window.DeadSignalAuth.getSession();
      return { user_id: s && s.uid, username: (s && s.username) || "operator", coins: state.coins | 0, lifetime_waves: state.lifetimeWaves | 0, skills: state.skills || {}, cache: Object.assign({}, state.cache || {}, { version: 1, savedAt: Date.now() }), updated_at: new Date().toISOString() };
    },
    saveToCloud: function (force) {
      if (!state.ready && !force) return Promise.resolve({ skipped: true });
      var s = window.DeadSignalAuth && window.DeadSignalAuth.getSession();
      if (!s || s.guest || !s.uid || !s.cloud) return Promise.resolve({ skipped: true });
      if (!state.dirty && !force) return Promise.resolve({ skipped: true });
      var body = Meta.payload();
      return Meta._client().then(function (c) {
        if (!c) return { ok: false };
        return c.from("player_saves").upsert(body, { onConflict: "user_id" }).then(function (res) {
          if (res.error) { console.warn("[DeadSignal] save", res.error); return { ok: false }; }
          state.dirty = false; return { ok: true };
        });
      });
    },
    _client: function () {
      var CFG = window.DS_SUPABASE;
      if (!CFG || !CFG.url || !CFG.anonKey) return Promise.resolve(null);
      if (window.__dsSb) return Promise.resolve(window.__dsSb);
      return new Promise(function (resolve) {
        function make() { try { window.__dsSb = window.supabase.createClient(CFG.url, CFG.anonKey); resolve(window.__dsSb); } catch (e) { resolve(null); } }
        if (window.supabase && window.supabase.createClient) return make();
        var sc = document.createElement("script");
        sc.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        sc.onload = make; sc.onerror = function () { resolve(null); };
        document.head.appendChild(sc);
      });
    },
    onWaveCleared: function (waveNum) {
      if (!state.ready) return;
      state.lifetimeWaves = Math.max(state.lifetimeWaves, waveNum | 0);
      if (waveNum > 0 && waveNum % 5 === 0) {
        var bonus = 1 + rank("eco3");
        state.coins += bonus; state.dirty = true;
        try { var eng = window.__deadSignal; if (eng && eng.say) eng.say("+" + bonus + " COIN" + (bonus > 1 ? "S" : "") + " (wave " + waveNum + ")", 1.4); } catch (e) {}
        Meta.refreshChip(); Meta.saveToCloud(true);
      } else state.dirty = true;
    },
    buySkill: function (id) {
      if (!state.ready) return { ok: false, error: "Save not ready." };
      var s = skillById(id); if (!s) return { ok: false, error: "Unknown skill." };
      var r = rank(id); if (r >= s.max) return { ok: false, error: "Maxed." };
      var cost = s.costs[r]; if ((state.coins | 0) < cost) return { ok: false, error: "Need " + cost + " coins." };
      state.coins -= cost; state.skills[id] = r + 1; state.dirty = true;
      Meta.refreshChip(); Meta.renderTree(); Meta.saveToCloud(true);
      return { ok: true, rank: r + 1 };
    },
    dmgMul: function () { return 1 + rank("dmg1") * 0.1; },
    rofMul: function () { return Math.max(0.55, 1 - rank("rof1") * 0.07); },
    reloadMul: function () { return Math.max(0.55, 1 - rank("rel1") * 0.08); },
    armorIgnore: function () { return rank("arm1") * 10; },
    moveMul: function () { return 1 + rank("spd1") * 0.07; },
    creditMul: function () { return 1 + rank("eco1") * 0.12; },
    startCredits: function () { return rank("eco2") * 20; },
    maxHpBonus: function () { return rank("vit1") * 12; },
    waveHeal: function () { return rank("vit2") * 8; },
    meleeMul: function () { return 1 + rank("ml1") * 0.15; },
    meleeReach: function () { return rank("ml2") * 12; },
    hasSecondWind: function () { return rank("vit3") > 0; },
    ensureUI: function () {
      if (document.getElementById("skill-overlay")) return;
      var st = document.createElement("style");
      st.textContent = "#skill-overlay{position:fixed;inset:0;z-index:180;display:none;align-items:center;justify-content:center;background:rgba(6,4,12,.88)}#skill-overlay.show{display:flex}.skill-card{background:#12081c;border:1px solid rgba(126,232,212,.35);border-radius:14px;padding:20px;width:min(720px,94vw);max-height:85vh;overflow:auto;color:#e8e0f0}.skill-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.skill-branch{margin:14px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7ee8d4}.skill-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 8px;border-bottom:1px solid rgba(126,232,212,.1)}.skill-row button{padding:8px 12px;border-radius:8px;border:none;background:#7ee8d4;color:#0a0610;font-weight:600;cursor:pointer}.skill-row button:disabled{opacity:.4;cursor:default;background:#3a3048;color:#9a8fb0}.skill-meta{font-size:12px;color:#9a8fb0}";
      document.head.appendChild(st);
      var ov = document.createElement("div");
      ov.id = "skill-overlay";
      ov.innerHTML = '<div class="skill-card"><div class="skill-head"><div><div style="font-size:11px;color:#7ee8d4;letter-spacing:.08em;text-transform:uppercase">Facility doctrine</div><h2 style="margin:4px 0">Skill tree</h2><p class="skill-meta" id="skill-coins">Coins: 0</p></div><button type="button" id="skill-close" style="padding:10px 14px;border-radius:8px;border:1px solid rgba(126,232,212,.3);background:transparent;color:#e8e0f0;cursor:pointer">Close</button></div><div id="skill-list"></div></div>';
      document.body.appendChild(ov);
      document.getElementById("skill-close").onclick = function () { ov.classList.remove("show"); };
      ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("show"); });
    },
    renderTree: function () {
      Meta.ensureUI();
      var list = document.getElementById("skill-list");
      var coinEl = document.getElementById("skill-coins");
      if (coinEl) coinEl.textContent = "Coins: " + (state.coins | 0) + " · lifetime waves " + (state.lifetimeWaves | 0) + " · 1 coin / 5 waves";
      var branches = []; SKILLS.forEach(function (s) { if (branches.indexOf(s.branch) < 0) branches.push(s.branch); });
      var html = "";
      branches.forEach(function (b) {
        html += '<div class="skill-branch">' + b + "</div>";
        SKILLS.filter(function (s) { return s.branch === b; }).forEach(function (s) {
          var r = rank(s.id), cost = nextCost(s), maxed = r >= s.max;
          var can = !maxed && state.ready && (state.coins | 0) >= cost;
          html += '<div class="skill-row"><div><strong>' + s.name + "</strong> <span class=\"skill-meta\">" + r + "/" + s.max + "</span><div class=\"skill-meta\">" + s.blurb + "</div></div><button type=\"button\" data-skill=\"" + s.id + "\" " + (can ? "" : "disabled") + ">" + (maxed ? "MAX" : "Buy (" + cost + ")") + "</button></div>";
        });
      });
      list.innerHTML = html;
      list.querySelectorAll("button[data-skill]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var res = Meta.buySkill(btn.getAttribute("data-skill"));
          if (!res.ok && res.error) alert(res.error);
        });
      });
    },
    openTree: function () { Meta.ensureUI(); Meta.renderTree(); document.getElementById("skill-overlay").classList.add("show"); },
    refreshChip: function () {
      var chip = document.getElementById("session-chip"); if (!chip) return;
      var name = (window.DeadSignalAuth && window.DeadSignalAuth.username && window.DeadSignalAuth.username()) || "—";
      var cloud = window.DeadSignalAuth && window.DeadSignalAuth.backend && window.DeadSignalAuth.backend() === "supabase";
      var guest = window.DeadSignalAuth && window.DeadSignalAuth.isGuest && window.DeadSignalAuth.isGuest();
      chip.innerHTML = "<span>" + name + (cloud && !guest ? " · cloud" : "") + " · ⬡ " + (state.coins | 0) + '</span><button type="button" id="chip-skills">Skills</button><button type="button" id="chip-lb">Leaderboard</button><button type="button" id="chip-out">' + (guest || !(window.DeadSignalAuth && window.DeadSignalAuth.getSession()) ? "Sign in" : "Log out") + "</button>";
      var sk = document.getElementById("chip-skills"); if (sk) sk.onclick = function () { Meta.openTree(); };
      var lb = document.getElementById("chip-lb"); if (lb) lb.onclick = function () { window.DeadSignalAuth.showLeaderboard(); };
      var out = document.getElementById("chip-out");
      if (out) out.onclick = function () {
        if (guest || !window.DeadSignalAuth.getSession()) document.getElementById("auth-overlay").classList.remove("hidden");
        else { Meta.saveToCloud(true); window.DeadSignalAuth.logout(); state.ready = false; document.getElementById("auth-overlay").classList.remove("hidden"); window.DeadSignalAuth.refreshChip && window.DeadSignalAuth.refreshChip(); }
      };
    }
  };
  window.DeadSignalMeta = Meta;
})();
