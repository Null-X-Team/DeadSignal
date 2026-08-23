// DeadSignal boot v18e - crouch + guns via gzip engine parts
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
    var n = 4, parts = [], loaded = 0;
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
            console.log("[DeadSignal] engine v18e crouch+guns");
            cb && cb();
          });
        } catch (e) { console.error(e); }
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "js/ec" + loaded + ".b64?v=20260822v18e");
      xhr.onload = function () {
        if (xhr.status === 200) { parts[loaded] = xhr.responseText.trim(); loaded++; next(); }
        else console.error("chunk", loaded, xhr.status);
      };
      xhr.send();
    }
    next();
  }
  loadScript("js/guns.js?v=20260822v18e", function () {
    loadEngine(function () {
      chain(["js/ui.js?v=20260822v18e", "js/gore.js?v=20260822v18e"], 0, function () {
        console.log("[DeadSignal] ready v18e");
        if (window.__dsBoot) window.__dsBoot();
      });
    });
  });
})();
