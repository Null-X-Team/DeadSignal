// DeadSignal boot v18f - b64 engine parts + guns
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
  function loadEngine(cb) {
    var n = 6, parts = [], loaded = 0;
    function next() {
      if (loaded >= n) {
        try {
          var js = atob(parts.join(""));
          (0, eval)(js);
          console.log("[DeadSignal] engine v18f crouch+guns");
          cb && cb();
        } catch (e) { console.error(e); }
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "js/ep" + loaded + ".b64?v=20260822v18f");
      xhr.onload = function () {
        if (xhr.status === 200) { parts[loaded] = xhr.responseText.trim(); loaded++; next(); }
        else console.error("chunk", loaded, xhr.status);
      };
      xhr.onerror = function () { console.error("net ep", loaded); };
      xhr.send();
    }
    next();
  }
  loadScript("js/guns.js?v=20260822v18f", function () {
    loadEngine(function () {
      chain(["js/ui.js?v=20260822v18f", "js/gore.js?v=20260822v18f"], 0, function () {
        console.log("[DeadSignal] ready v18f");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  });
})();
