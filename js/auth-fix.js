// DeadSignal v36 — local account if Supabase email signups disabled
(function () {
  var Auth = window.DeadSignalAuth;
  if (!Auth || Auth.__emailFix) return;
  Auth.__emailFix = true;
  var AK = "deadSignalAccounts", SK = "deadSignalSession";
  function hashPw(pw) {
    var h = 5381, s = String(pw);
    for (var i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h |= 0; }
    return "h" + (h >>> 0).toString(36);
  }
  function loadA() { try { return JSON.parse(localStorage.getItem(AK) || "{}") || {}; } catch (e) { return {}; } }
  function saveA(m) { try { localStorage.setItem(AK, JSON.stringify(m)); return true; } catch (e) { return false; } }
  function setS(s) { try { if (!s) localStorage.removeItem(SK); else localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {} }
  var _reg = Auth.register.bind(Auth);
  Auth.register = function (user, pass) {
    return Promise.resolve(_reg(user, pass)).then(function (res) {
      if (res && res.ok) return res;
      var m = (res && res.error) || "";
      if (!/disabled|signups? not allowed|email.*disabled/i.test(m)) return res;
      user = String(user || "").trim().slice(0, 16);
      pass = String(pass || "");
      var map = loadA();
      if (map[user.toLowerCase()]) return { ok: false, error: "Username taken. Enable Email in Supabase Auth → Providers." };
      map[user.toLowerCase()] = { name: user, hash: hashPw(pass), bestWave: 0, bestScore: 0, updated: Date.now() };
      if (!saveA(map)) return { ok: false, error: "Could not save locally." };
      setS({ username: user, guest: false, cloud: false });
      return { ok: true, localFallback: true };
    });
  };
  console.log("[DeadSignal] auth-fix: local fallback if email disabled");
})();
