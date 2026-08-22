// DeadSignal boot v16 - sprites + 8 gzip engine parts + ui + gore
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("script fail", src); };
    document.head.appendChild(s);
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
            var code = new TextDecoder().decode(buf);
            (0, eval)(code);
            console.log("[DeadSignal] engine v16", code.length);
            cb && cb();
          }).catch(function (e) { console.error("inflate", e); });
        } catch (e) { console.error("boot", e); }
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "js/e" + loaded + ".b64?v=" + Date.now());
      xhr.onload = function () {
        if (xhr.status === 200) { parts[loaded] = xhr.responseText.trim(); loaded++; next(); }
        else console.error("part", loaded, xhr.status);
      };
      xhr.onerror = function () { console.error("part net", loaded); };
      xhr.send();
    }
    next();
  }
  loadScript("js/sprites.js", function () {
    loadEngineParts(function () {
      loadScript("js/ui.js", function () {
        loadScript("js/gore.js", function () {
          console.log("[DeadSignal] ready v16");
          if (window.__dsBoot) window.__dsBoot();
        });
      });
    });
  });
})();
