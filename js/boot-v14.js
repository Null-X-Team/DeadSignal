// DeadSignal boot v29 — inflate engine from eg8_*.b64
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("[DeadSignal] fail", src); cb && cb(); };
    document.head.appendChild(s);
  }
  function loadText(src, cb) {
    var x = new XMLHttpRequest();
    x.open("GET", src);
    x.onload = function () {
      if (x.status === 200) cb(null, x.responseText);
      else cb(new Error("HTTP " + x.status + " " + src));
    };
    x.onerror = function () { cb(new Error("net " + src)); };
    x.send();
  }
  function gunzipB64(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  }
  var v = "20260823v29";
  var parts = 11;
  var buf = "";
  var idx = 0;
  function afterEngine() {
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        loadScript("js/patch-v22.js?v=" + v, function () {
          console.log("[DeadSignal] ready v29");
        });
      });
    });
  }
  function next() {
    if (idx >= parts) {
      gunzipB64(buf.trim()).then(function (code) {
        try {
          (0, eval)(code);
          console.log("[DeadSignal] engine inflated", !!(window.DeadSignalGame && window.DeadSignalGame.Engine));
          afterEngine();
        } catch (err) {
          console.error("[DeadSignal] eval failed", err);
        }
      }).catch(function (e) {
        console.error("[DeadSignal] inflate failed", e);
      });
      return;
    }
    loadText("js/eg8_" + idx + ".b64?v=" + v, function (err, t) {
      if (err) {
        console.error(err);
        return;
      }
      buf += t.trim();
      idx++;
      next();
    });
  }
  loadScript("js/guns.js?v=" + v, next);
})();
