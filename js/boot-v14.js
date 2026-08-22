// DeadSignal boot v16
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + "?v=" + Date.now();
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("fail", src); };
    document.head.appendChild(s);
  }
  function chain(list, i, done) {
    if (i >= list.length) return done && done();
    loadScript(list[i], function () { chain(list, i + 1, done); });
  }
  function loadEngineParts(cb) {
    var n = 8, parts = [], loaded = 0;
    function next() {
      if (loaded >= n) {
        try {
          var b64 = parts.join("");
          var bin = atob(b64);
          var bytes = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          var stream = new Response(bytes).body.pipeThrough(new DecompressionStream("gzip"));
          new Response(stream).arrayBuffer().then(function (buf) {
            (0, eval)(new TextDecoder().decode(buf));
            console.log("[DeadSignal] engine v16");
            cb && cb();
          });
        } catch (e) { console.error(e); }
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "js/e" + loaded + ".b64?v=" + Date.now());
      xhr.onload = function () {
        if (xhr.status === 200) { parts[loaded] = xhr.responseText.trim(); loaded++; next(); }
      };
      xhr.send();
    }
    next();
  }
  var sprites = ["js/sp_gun_auto.js", "js/sp_gun_pistol.js", "js/sp_gun_rail.js", "js/sp_gun_rifle.js", "js/sp_gun_scatter.js", "js/sp_gun_smg.js", "js/sp_player.js", "js/sp_player_crouch.js", "js/sp_player_kick.js", "js/sp_zombie.js", "js/sp_zombie_brute.js", "js/sp_zombie_headless.js", "js/sp_zombie_runner.js"];
  chain(sprites, 0, function () {
    loadEngineParts(function () {
      chain(["js/ui.js", "js/gore.js"], 0, function () {
        console.log("[DeadSignal] ready v16");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  });
})();
