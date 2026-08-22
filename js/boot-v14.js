// DeadSignal boot v17 - shape characters + engine parts + ui + gore
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
            console.log("[DeadSignal] engine v17 shapes");
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
  loadEngineParts(function () {
    chain(["js/ui.js", "js/gore.js"], 0, function () {
      console.log("[DeadSignal] ready v17");
      if (window.__dsBoot) window.__dsBoot();
    });
  });
})();
