// DeadSignal auth + leaderboard (local accounts; device leaderboard)
(function () {
  var ACCOUNTS_KEY = "deadSignalAccounts";
  var SESSION_KEY = "deadSignalSession";

  function hashPw(pw) {
    var h = 5381;
    for (var i = 0; i < String(pw).length; i++) {
      h = ((h << 5) + h) + String(pw).charCodeAt(i);
      h = h | 0;
    }
    return "h" + (h >>> 0).toString(36);
  }

  function loadAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function saveAccounts(map) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function setSession(s) {
    if (!s) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  var Auth = {
    getSession: getSession,
    isGuest: function () {
      var s = getSession();
      return !s || !!s.guest;
    },
    username: function () {
      var s = getSession();
      if (!s) return null;
      if (s.guest) return "Guest";
      return s.username || null;
    },
    register: function (user, pass) {
      user = String(user || "").trim().slice(0, 16);
      pass = String(pass || "");
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(user)) {
        return { ok: false, error: "Username: 3–16 letters, numbers, or _" };
      }
      if (pass.length < 4) return { ok: false, error: "Password at least 4 characters." };
      var map = loadAccounts();
      if (map[user.toLowerCase()]) return { ok: false, error: "Username already taken on this device." };
      map[user.toLowerCase()] = {
        name: user,
        hash: hashPw(pass),
        bestWave: 0,
        bestScore: 0,
        updated: Date.now()
      };
      saveAccounts(map);
      setSession({ username: user, guest: false });
      return { ok: true };
    },
    login: function (user, pass) {
      user = String(user || "").trim();
      pass = String(pass || "");
      var map = loadAccounts();
      var acc = map[user.toLowerCase()];
      if (!acc || acc.hash !== hashPw(pass)) {
        return { ok: false, error: "Wrong username or password." };
      }
      setSession({ username: acc.name, guest: false });
      return { ok: true };
    },
    guest: function () {
      setSession({ guest: true, username: "Guest" });
      return { ok: true };
    },
    logout: function () {
      setSession(null);
    },
    recordRun: function (wave, score) {
      var s = getSession();
      if (!s || s.guest || !s.username) return;
      var map = loadAccounts();
      var key = s.username.toLowerCase();
      var acc = map[key];
      if (!acc) return;
      var w = Math.max(0, wave | 0);
      var sc = Math.max(0, score | 0);
      var better = w > (acc.bestWave || 0) || (w === (acc.bestWave || 0) && sc > (acc.bestScore || 0));
      if (better) {
        acc.bestWave = w;
        acc.bestScore = sc;
        acc.updated = Date.now();
        map[key] = acc;
        saveAccounts(map);
      }
    },
    leaderboard: function () {
      var map = loadAccounts();
      var rows = Object.keys(map).map(function (k) {
        var a = map[k];
        return {
          name: a.name || k,
          bestWave: a.bestWave || 0,
          bestScore: a.bestScore || 0,
          updated: a.updated || 0
        };
      });
      rows.sort(function (a, b) {
        if (b.bestWave !== a.bestWave) return b.bestWave - a.bestWave;
        return b.bestScore - a.bestScore;
      });
      return rows;
    }
  };

  window.DeadSignalAuth = Auth;

  function ensureAuthUI() {
    if (document.getElementById("auth-overlay")) return;
    var css = document.createElement("style");
    css.textContent =
      "#auth-overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(6,4,12,0.92);backdrop-filter:blur(6px);}" +
      "#auth-overlay.hidden{display:none;}" +
      ".auth-card{background:#12081c;border:1px solid rgba(126,232,212,0.35);border-radius:14px;" +
      "padding:28px 30px;width:min(360px,92vw);color:#e8e0f0;box-shadow:0 20px 60px rgba(0,0,0,0.5);}" +
      ".auth-card h2{margin:6px 0 4px;font-size:22px;letter-spacing:0.04em;}" +
      ".auth-card .subtitle{color:#9a8fb0;font-size:13px;margin:0 0 16px;}" +
      ".auth-card label{display:block;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;" +
      "color:#7ee8d4;margin:10px 0 4px;}" +
      ".auth-card input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;" +
      "border:1px solid rgba(126,232,212,0.25);background:#0a0610;color:#e8e0f0;font-size:15px;}" +
      ".auth-card input:focus{outline:1px solid #7ee8d4;}" +
      ".auth-actions{display:flex;flex-direction:column;gap:8px;margin-top:16px;}" +
      ".auth-actions button{width:100%;}" +
      "#auth-error{color:#ff6a5a;font-size:13px;min-height:18px;margin-top:8px;}" +
      "#auth-tabs{display:flex;gap:8px;margin-bottom:8px;}" +
      "#auth-tabs button{flex:1;padding:8px;border-radius:8px;border:1px solid rgba(126,232,212,0.25);" +
      "background:transparent;color:#9a8fb0;cursor:pointer;}" +
      "#auth-tabs button.active{background:rgba(126,232,212,0.12);color:#7ee8d4;border-color:#7ee8d4;}" +
      "#lb-overlay{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;" +
      "background:rgba(6,4,12,0.85);}" +
      "#lb-overlay.show{display:flex;}" +
      ".lb-card{background:#12081c;border:1px solid rgba(126,232,212,0.35);border-radius:14px;" +
      "padding:24px;width:min(420px,92vw);color:#e8e0f0;max-height:80vh;overflow:auto;}" +
      ".lb-row{display:flex;justify-content:space-between;align-items:center;padding:8px 4px;" +
      "border-bottom:1px solid rgba(126,232,212,0.12);font-size:14px;}" +
      ".lb-row .rank{color:#7ee8d4;width:28px;}" +
      ".lb-row.me{background:rgba(126,232,212,0.08);border-radius:6px;}" +
      "#session-chip{position:absolute;top:8px;right:10px;z-index:55;font:12px ui-monospace,monospace;" +
      "color:#7ee8d4;background:rgba(0,0,0,0.55);padding:4px 10px;border-radius:6px;" +
      "display:flex;gap:8px;align-items:center;}" +
      "#session-chip button{background:transparent;border:none;color:#9a8fb0;cursor:pointer;font-size:11px;text-decoration:underline;}";
    document.head.appendChild(css);

    var ov = document.createElement("div");
    ov.id = "auth-overlay";
    ov.innerHTML =
      '<div class="auth-card">' +
      '<div class="label cyan" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#7ee8d4;">Dead Signal · Facility access</div>' +
      "<h2>Operator login</h2>" +
      '<p class="subtitle">Create an account to track your best wave on the leaderboard, or continue as guest.</p>' +
      '<div id="auth-tabs">' +
      '<button type="button" data-tab="login" class="active">Login</button>' +
      '<button type="button" data-tab="register">Register</button>' +
      "</div>" +
      '<label for="auth-user">Username</label>' +
      '<input id="auth-user" autocomplete="username" maxlength="16" placeholder="operator_name">' +
      '<label for="auth-pass">Password</label>' +
      '<input id="auth-pass" type="password" autocomplete="current-password" placeholder="••••">' +
      '<div id="auth-error"></div>' +
      '<div class="auth-actions">' +
      '<button type="button" class="primary-btn" id="auth-submit">Login</button>' +
      '<button type="button" class="ghost-btn" id="auth-guest">Continue without account</button>' +
      "</div>" +
      '<p class="subtitle" style="margin-top:14px;font-size:11px;">Accounts & leaderboard are stored on this device (no server).</p>' +
      "</div>";
    document.body.appendChild(ov);

    var lb = document.createElement("div");
    lb.id = "lb-overlay";
    lb.innerHTML =
      '<div class="lb-card">' +
      '<div class="label cyan" style="font-size:11px;color:#7ee8d4;letter-spacing:0.08em;text-transform:uppercase;">Facility records</div>' +
      '<h2 style="margin:6px 0 4px;">Leaderboard</h2>' +
      '<p class="subtitle" style="color:#9a8fb0;font-size:13px;margin:0 0 12px;">Ranked by highest wave, then score (this device).</p>' +
      '<div id="lb-list"></div>' +
      '<button type="button" class="primary-btn" id="lb-close" style="margin-top:16px;width:100%;">Close</button>' +
      "</div>";
    document.body.appendChild(lb);

    var mode = "login";
    var tabs = ov.querySelectorAll("#auth-tabs button");
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.getAttribute("data-tab");
        tabs.forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        ov.querySelector("#auth-submit").textContent = mode === "login" ? "Login" : "Create account";
        ov.querySelector("#auth-error").textContent = "";
      });
    });

    function finishAuth() {
      ov.classList.add("hidden");
      Auth.refreshChip();
    }

    ov.querySelector("#auth-submit").addEventListener("click", function () {
      var u = document.getElementById("auth-user").value;
      var p = document.getElementById("auth-pass").value;
      var res = mode === "register" ? Auth.register(u, p) : Auth.login(u, p);
      var err = document.getElementById("auth-error");
      if (!res.ok) {
        err.textContent = res.error || "Failed";
        return;
      }
      err.textContent = "";
      finishAuth();
    });

    ov.querySelector("#auth-guest").addEventListener("click", function () {
      Auth.guest();
      finishAuth();
    });

    document.getElementById("auth-pass").addEventListener("keydown", function (e) {
      if (e.key === "Enter") ov.querySelector("#auth-submit").click();
    });

    lb.querySelector("#lb-close").addEventListener("click", function () {
      lb.classList.remove("show");
    });
    lb.addEventListener("click", function (e) {
      if (e.target === lb) lb.classList.remove("show");
    });
  }

  Auth.refreshChip = function () {
    var shell = document.getElementById("game-shell") || document.body;
    var chip = document.getElementById("session-chip");
    if (!chip) {
      chip = document.createElement("div");
      chip.id = "session-chip";
      shell.appendChild(chip);
    }
    var name = Auth.username() || "—";
    chip.innerHTML =
      "<span>" +
      name +
      '</span><button type="button" id="chip-lb">Leaderboard</button>' +
      '<button type="button" id="chip-out">' +
      (Auth.isGuest() || !getSession() ? "Sign in" : "Log out") +
      "</button>";
    chip.querySelector("#chip-lb").addEventListener("click", function () {
      Auth.showLeaderboard();
    });
    chip.querySelector("#chip-out").addEventListener("click", function () {
      if (Auth.isGuest() || !getSession()) {
        document.getElementById("auth-overlay").classList.remove("hidden");
      } else {
        Auth.logout();
        document.getElementById("auth-overlay").classList.remove("hidden");
        Auth.refreshChip();
      }
    });
  };

  Auth.showLeaderboard = function () {
    ensureAuthUI();
    var list = document.getElementById("lb-list");
    var rows = Auth.leaderboard();
    var me = Auth.username();
    if (!rows.length) {
      list.innerHTML = '<p class="subtitle" style="color:#9a8fb0;">No ranked operators yet. Create an account and clear a wave.</p>';
    } else {
      list.innerHTML = rows
        .slice(0, 20)
        .map(function (r, i) {
          var isMe = me && r.name === me;
          return (
            '<div class="lb-row' +
            (isMe ? " me" : "") +
            '"><span class="rank">#' +
            (i + 1) +
            "</span><span>" +
            r.name +
            (isMe ? " · you" : "") +
            '</span><span style="color:#c9d2dc;">Wave ' +
            r.bestWave +
            " · " +
            r.bestScore +
            " pts</span></div>"
          );
        })
        .join("");
    }
    document.getElementById("lb-overlay").classList.add("show");
  };

  Auth.gate = function () {
    ensureAuthUI();
    var s = getSession();
    if (s) {
      document.getElementById("auth-overlay").classList.add("hidden");
    } else {
      document.getElementById("auth-overlay").classList.remove("hidden");
    }
    Auth.refreshChip();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      Auth.gate();
    });
  } else {
    Auth.gate();
  }
})();
