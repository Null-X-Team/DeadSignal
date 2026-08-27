// DeadSignal auth v33 fixed
(function () {
  var AK = "deadSignalAccounts", SK = "deadSignalSession";
  var CFG = window.DS_SUPABASE || null;
  function hashPw(pw) {
    var h = 5381, s = String(pw);
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h |= 0; }
    return "h" + (h >>> 0).toString(36);
  }
  function loadA() { try { return JSON.parse(localStorage.getItem(AK) || "{}") || {}; } catch (e) { return {}; } }
  function saveA(m) { try { localStorage.setItem(AK, JSON.stringify(m)); return true; } catch (e) { return false; } }
  function getS() { try { return JSON.parse(localStorage.getItem(SK) || "null"); } catch (e) { return null; } }
  function setS(s) { try { if (!s) localStorage.removeItem(SK); else localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {} }
  function emailFrom(u) { return String(u).toLowerCase().replace(/[^a-z0-9_]/g, "") + "@deadsignal.players"; }
  function useCloud() { return !!(CFG && CFG.url && CFG.anonKey); }
  var sb = null, sbP = null;
  function getSb() {
    if (!useCloud()) return Promise.resolve(null);
    if (sb) return Promise.resolve(sb);
    if (sbP) return sbP;
    sbP = new Promise(function (resolve) {
      function make() {
        try { sb = window.supabase.createClient(CFG.url, CFG.anonKey); resolve(sb); }
        catch (e) { resolve(null); }
      }
      if (window.supabase && window.supabase.createClient) return make();
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = make; s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return sbP;
  }

  var Auth = {
    getSession: getS,
    isGuest: function () { var s = getS(); return !s || !!s.guest; },
    username: function () { var s = getS(); if (!s) return null; return s.guest ? "Guest" : (s.username || null); },
    backend: function () { return useCloud() ? "supabase" : "local"; },
    register: function (user, pass) {
      user = String(user || "").trim().slice(0, 16);
      pass = String(pass || "");
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(user)) return Promise.resolve({ ok: false, error: "Username: 3-16 letters, numbers, or _" });
      if (pass.length < 4) return Promise.resolve({ ok: false, error: "Password at least 4 characters." });
      if (useCloud()) {
        return getSb().then(function (c) {
          if (!c) return { ok: false, error: "Cloud backend unavailable." };
          return c.auth.signUp({ email: emailFrom(user), password: pass, options: { data: { username: user } } }).then(function (res) {
            if (res.error) {
              var m = res.error.message || "Sign up failed";
              if (/already/i.test(m)) m = "Username already taken.";
              return { ok: false, error: m };
            }
            var uid = res.data && res.data.user && res.data.user.id;
            setS({ username: user, guest: false, uid: uid || null, cloud: true });
            if (uid) c.from("leaderboard").upsert({ user_id: uid, username: user, best_wave: 0, best_score: 0, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
            return { ok: true };
          }).catch(function (e) { return { ok: false, error: (e && e.message) || "Sign up failed" }; });
        });
      }
      var map = loadA();
      if (map[user.toLowerCase()]) return Promise.resolve({ ok: false, error: "Username already taken on this device." });
      map[user.toLowerCase()] = { name: user, hash: hashPw(pass), bestWave: 0, bestScore: 0, updated: Date.now() };
      if (!saveA(map)) return Promise.resolve({ ok: false, error: "Could not save (storage blocked? try non-private window)." });
      setS({ username: user, guest: false, cloud: false });
      return Promise.resolve({ ok: true });
    },
    login: function (user, pass) {
      user = String(user || "").trim(); pass = String(pass || "");
      if (!user || !pass) return Promise.resolve({ ok: false, error: "Enter username and password." });
      if (useCloud()) {
        return getSb().then(function (c) {
          if (!c) return { ok: false, error: "Cloud backend unavailable." };
          return c.auth.signInWithPassword({ email: emailFrom(user), password: pass }).then(function (res) {
            if (res.error) return { ok: false, error: "Wrong username or password." };
            var uid = res.data && res.data.user && res.data.user.id;
            var meta = (res.data.user && res.data.user.user_metadata) || {};
            setS({ username: meta.username || user, guest: false, uid: uid || null, cloud: true });
            return { ok: true };
          }).catch(function (e) { return { ok: false, error: (e && e.message) || "Login failed" }; });
        });
      }
      var acc = loadA()[user.toLowerCase()];
      if (!acc || acc.hash !== hashPw(pass)) return Promise.resolve({ ok: false, error: "Wrong username or password." });
      setS({ username: acc.name, guest: false, cloud: false });
      return Promise.resolve({ ok: true });
    },
    guest: function () { setS({ guest: true, username: "Guest" }); return Promise.resolve({ ok: true }); },
    logout: function () { var s = getS(); setS(null); if (s && s.cloud && sb) try { sb.auth.signOut(); } catch (e) {} },
    recordRun: function (wave, score) {
      var s = getS(); if (!s || s.guest || !s.username) return;
      var w = Math.max(0, wave | 0), sc = Math.max(0, score | 0);
      if (s.cloud && useCloud()) {
        getSb().then(function (c) {
          if (!c || !s.uid) return;
          c.from("leaderboard").select("best_wave,best_score").eq("user_id", s.uid).maybeSingle().then(function (res) {
            var cur = res.data || { best_wave: 0, best_score: 0 };
            var better = w > (cur.best_wave || 0) || (w === (cur.best_wave || 0) && sc > (cur.best_score || 0));
            if (!better && res.data) return;
            return c.from("leaderboard").upsert({
              user_id: s.uid, username: s.username,
              best_wave: Math.max(w, cur.best_wave || 0),
              best_score: better ? sc : Math.max(sc, cur.best_score || 0),
              updated_at: new Date().toISOString()
            }, { onConflict: "user_id" });
          });
        });
        return;
      }
      var map = loadA(), key = s.username.toLowerCase(), acc = map[key]; if (!acc) return;
      if (w > (acc.bestWave || 0) || (w === (acc.bestWave || 0) && sc > (acc.bestScore || 0))) {
        acc.bestWave = w; acc.bestScore = sc; acc.updated = Date.now(); map[key] = acc; saveA(map);
      }
    },
    leaderboardLocal: function () {
      var map = loadA(), rows = Object.keys(map).map(function (k) {
        var a = map[k]; return { name: a.name || k, bestWave: a.bestWave || 0, bestScore: a.bestScore || 0 };
      });
      rows.sort(function (a, b) { return b.bestWave - a.bestWave || b.bestScore - a.bestScore; });
      return rows;
    },
    leaderboard: function () {
      if (!useCloud()) return Promise.resolve(Auth.leaderboardLocal());
      return getSb().then(function (c) {
        if (!c) return Auth.leaderboardLocal();
        return c.from("leaderboard").select("username,best_wave,best_score").order("best_wave", { ascending: false }).order("best_score", { ascending: false }).limit(25)
          .then(function (res) {
            if (res.error || !res.data) return Auth.leaderboardLocal();
            return res.data.map(function (r) { return { name: r.username, bestWave: r.best_wave || 0, bestScore: r.best_score || 0 }; });
          }).catch(function () { return Auth.leaderboardLocal(); });
      });
    }
  };
  window.DeadSignalAuth = Auth;

  function ensure() {
    if (document.getElementById("auth-overlay")) return;
    var st = document.createElement("style");
    st.textContent = "#auth-overlay{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(6,4,12,.94)}" +
      "#auth-overlay.hidden{display:none!important}.auth-card{background:#12081c;border:1px solid rgba(126,232,212,.35);border-radius:14px;padding:28px 30px;width:min(360px,92vw);color:#e8e0f0}" +
      ".auth-card h2{margin:6px 0 4px;font-size:22px}.auth-card .sub{color:#9a8fb0;font-size:13px;margin:0 0 14px}" +
      ".auth-card label{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7ee8d4;margin:10px 0 4px}" +
      ".auth-card input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid rgba(126,232,212,.25);background:#0a0610;color:#e8e0f0;font-size:15px}" +
      ".auth-actions{display:flex;flex-direction:column;gap:10px;margin-top:16px}" +
      ".auth-btn{width:100%;padding:12px 16px;border-radius:8px;border:none;cursor:pointer;font-size:15px;font-weight:600}" +
      ".auth-btn-p{background:#7ee8d4;color:#0a0610}.auth-btn-p:disabled{opacity:.5;cursor:wait}" +
      ".auth-btn-g{background:transparent;color:#9a8fb0;border:1px solid rgba(126,232,212,.25)}" +
      "#auth-error{color:#ff6a5a;font-size:13px;min-height:18px;margin-top:8px}" +
      "#auth-tabs{display:flex;gap:8px;margin-bottom:8px}#auth-tabs button{flex:1;padding:8px;border-radius:8px;border:1px solid rgba(126,232,212,.25);background:transparent;color:#9a8fb0;cursor:pointer}" +
      "#auth-tabs button.active{background:rgba(126,232,212,.12);color:#7ee8d4;border-color:#7ee8d4}" +
      "#lb-overlay{position:fixed;inset:0;z-index:190;display:none;align-items:center;justify-content:center;background:rgba(6,4,12,.85)}#lb-overlay.show{display:flex}" +
      ".lb-card{background:#12081c;border:1px solid rgba(126,232,212,.35);border-radius:14px;padding:24px;width:min(420px,92vw);color:#e8e0f0;max-height:80vh;overflow:auto}" +
      ".lb-row{display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid rgba(126,232,212,.12);font-size:14px}.lb-row .rank{color:#7ee8d4;width:28px}.lb-row.me{background:rgba(126,232,212,.08);border-radius:6px}" +
      "#session-chip{position:absolute;top:8px;right:10px;z-index:55;font:12px ui-monospace,monospace;color:#7ee8d4;background:rgba(0,0,0,.55);padding:4px 10px;border-radius:6px;display:flex;gap:8px;align-items:center}" +
      "#session-chip button{background:transparent;border:none;color:#9a8fb0;cursor:pointer;font-size:11px;text-decoration:underline}";
    document.head.appendChild(st);
    var ov = document.createElement("div");
    ov.id = "auth-overlay";
    ov.innerHTML = '<div class="auth-card"><div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#7ee8d4">Dead Signal · Facility access</div><h2>Operator login</h2>' +
      '<p class="sub" id="auth-backend-note">Create an account or continue as guest.</p>' +
      '<div id="auth-tabs"><button type="button" data-tab="login" class="active">Login</button><button type="button" data-tab="register">Register</button></div>' +
      '<label for="auth-user">Username</label><input id="auth-user" maxlength="16" placeholder="operator_name" autocomplete="username">' +
      '<label for="auth-pass">Password</label><input id="auth-pass" type="password" placeholder="min 4 characters" autocomplete="current-password">' +
      '<div id="auth-error"></div><div class="auth-actions">' +
      '<button type="button" class="auth-btn auth-btn-p" id="auth-submit">Login</button>' +
      '<button type="button" class="auth-btn auth-btn-g" id="auth-guest">Continue without account</button></div></div>';
    document.body.appendChild(ov);
    var lb = document.createElement("div");
    lb.id = "lb-overlay";
    lb.innerHTML = '<div class="lb-card"><div style="font-size:11px;color:#7ee8d4;letter-spacing:.08em;text-transform:uppercase">Facility records</div><h2 style="margin:6px 0 4px">Leaderboard</h2>' +
      '<p class="sub" id="lb-note" style="color:#9a8fb0;font-size:13px;margin:0 0 12px">Highest wave, then score.</p><div id="lb-list"></div>' +
      '<button type="button" class="auth-btn auth-btn-p" id="lb-close" style="margin-top:16px">Close</button></div>';
    document.body.appendChild(lb);

    var mode = "login";
    ov.querySelectorAll("#auth-tabs button").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        mode = btn.getAttribute("data-tab") || "login";
        ov.querySelectorAll("#auth-tabs button").forEach(function (b) { b.classList.toggle("active", b === btn); });
        document.getElementById("auth-submit").textContent = mode === "register" ? "Create account" : "Login";
        document.getElementById("auth-error").textContent = "";
      });
    });
    function done() { ov.classList.add("hidden"); Auth.refreshChip(); }
    function busy(on) {
      var s = document.getElementById("auth-submit"), g = document.getElementById("auth-guest");
      if (s) { s.disabled = !!on; s.textContent = on ? "Working..." : (mode === "register" ? "Create account" : "Login"); }
      if (g) g.disabled = !!on;
    }
    function submit() {
      var u = document.getElementById("auth-user").value, p = document.getElementById("auth-pass").value;
      var err = document.getElementById("auth-error"); err.textContent = "";
      busy(true);
      (mode === "register" ? Auth.register(u, p) : Auth.login(u, p)).then(function (res) {
        busy(false);
        if (!res || !res.ok) { err.textContent = (res && res.error) || "Failed"; return; }
        done();
      }).catch(function (e) { busy(false); err.textContent = (e && e.message) || "Failed"; });
    }
    document.getElementById("auth-submit").addEventListener("click", function (e) { e.preventDefault(); submit(); });
    document.getElementById("auth-guest").addEventListener("click", function (e) { e.preventDefault(); Auth.guest().then(done); });
    document.getElementById("auth-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    document.getElementById("lb-close").addEventListener("click", function () { lb.classList.remove("show"); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.classList.remove("show"); });
    var note = document.getElementById("auth-backend-note");
    if (note) note.textContent = useCloud() ? "Cloud accounts via Supabase (global leaderboard)." : "Local accounts on this device. Configure Supabase for global.";
  }

  Auth.refreshChip = function () {
    var shell = document.getElementById("game-shell") || document.body;
    var chip = document.getElementById("session-chip");
    if (!chip) { chip = document.createElement("div"); chip.id = "session-chip"; shell.appendChild(chip); }
    var name = Auth.username() || "—";
    chip.innerHTML = "<span>" + name + (useCloud() && !Auth.isGuest() ? " · cloud" : "") +
      '</span><button type="button" id="chip-lb">Leaderboard</button><button type="button" id="chip-out">' +
      (Auth.isGuest() || !getS() ? "Sign in" : "Log out") + "</button>";
    document.getElementById("chip-lb").onclick = function () { Auth.showLeaderboard(); };
    document.getElementById("chip-out").onclick = function () {
      if (Auth.isGuest() || !getS()) { ensure(); document.getElementById("auth-overlay").classList.remove("hidden"); }
      else { Auth.logout(); ensure(); document.getElementById("auth-overlay").classList.remove("hidden"); Auth.refreshChip(); }
    };
  };
  Auth.showLeaderboard = function () {
    ensure();
    var list = document.getElementById("lb-list"), note = document.getElementById("lb-note");
    if (note) note.textContent = useCloud() ? "Global (Supabase). Highest wave, then score." : "This device. Highest wave, then score.";
    list.innerHTML = '<p style="color:#9a8fb0">Loading...</p>';
    document.getElementById("lb-overlay").classList.add("show");
    var me = Auth.username();
    Promise.resolve(Auth.leaderboard()).then(function (rows) {
      if (!rows || !rows.length) { list.innerHTML = '<p style="color:#9a8fb0">No ranked operators yet.</p>'; return; }
      list.innerHTML = rows.slice(0, 25).map(function (r, i) {
        var meRow = me && r.name === me;
        return '<div class="lb-row' + (meRow ? " me" : "") + '"><span class="rank">#' + (i + 1) + "</span><span>" + r.name +
          (meRow ? " · you" : "") + '</span><span style="color:#c9d2dc">Wave ' + r.bestWave + " · " + r.bestScore + " pts</span></div>";
      }).join("");
    });
  };
  Auth.gate = function () {
    ensure();
    if (getS()) document.getElementById("auth-overlay").classList.add("hidden");
    else document.getElementById("auth-overlay").classList.remove("hidden");
    Auth.refreshChip();
    if (useCloud()) getSb();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { Auth.gate(); });
  else setTimeout(function () { Auth.gate(); }, 0);
})();
