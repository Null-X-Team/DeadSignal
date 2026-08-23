// DeadSignal boot v18 - classic characters + engine parts + ui + gore + optional guns
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + (src.indexOf("?") >= 0 ? "" : ("?v=" + Date.now()));
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("fail", src); cb && cb(); };
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
            console.log("[DeadSignal] engine v18 classic");
            cb && cb();
          });
        } catch (e) { console.error(e); }
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "js/e" + loaded + ".b64?v=20260822v18a");
      xhr.onload = function () {
        if (xhr.status === 200) { parts[loaded] = xhr.responseText.trim(); loaded++; next(); }
        else { console.error("chunk fail", loaded); }
      };
      xhr.onerror = function () { console.error("chunk net", loaded); };
      xhr.send();
    }
    next();
  }
  // Load optional guns.js first (sets window.DS_GUNS), then engine, then ui/gore
  loadScript("js/guns.js?v=20260822v18a", function () {
    loadEngineParts(function () {
      chain(["js/ui.js?v=20260822v18a", "js/gore.js?v=20260822v18a"], 0, function () {
        console.log("[DeadSignal] ready v18");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  });
})();
