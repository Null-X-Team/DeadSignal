// DeadSignal boot v30h — inflate engine from eg8_*.b64
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = function () { cb && cb(); };
    s.onerror = function () {
      console.error("[DeadSignal] fail", src);
      showErr("Failed to load " + src + ". Hard-refresh (Ctrl+Shift+R).");
      cb && cb();
    };
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
  function showErr(msg) {
    try {
      var m = document.getElementById("menu");
      if (!m) return;
      var p = document.createElement("p");
      p.style.color = "#ff6a5a";
      p.style.marginTop = "12px";
      p.textContent = msg;
      (m.querySelector(".menu-card") || m).appendChild(p);
    } catch (e) {}
  }
  var v = "20260823v30h";
  var parts = 11;
  var buf = "";
  var idx = 0;
  function afterEngine() {
    if (!(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
      showErr("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
      return;
    }
    loadScript("js/ui.js?v=" + v, function () {
      loadScript("js/gore.js?v=" + v, function () {
        loadScript("js/patch-v22.js?v=" + v, function () {
          console.log("[DeadSignal] ready v30h");
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
          showErr("Engine eval failed. Hard-refresh (Ctrl+Shift+R).");
        }
      }).catch(function (e) {
        console.error("[DeadSignal] inflate failed", e);
        showErr("Engine inflate failed. Hard-refresh (Ctrl+Shift+R).");
      });
      return;
    }
    loadText("js/eg8_" + idx + ".b64?v=" + v, function (err, t) {
      if (err) {
        console.error(err);
        showErr("Missing engine chunk " + idx + ". Hard-refresh.");
        return;
      }
      buf += t.trim();
      idx++;
      next();
    });
  }
  loadScript("js/guns.js?v=" + v, next);
})();
