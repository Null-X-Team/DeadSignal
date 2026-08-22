// DeadSignal boot v15 - load 6 gzip/base64 engine chunks, then ui + gore
(function () {
  var n = 6;
  var parts = [];
  var loaded = 0;
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("script fail", src); };
    document.head.appendChild(s);
  }
  function finish() {
    try {
      var b64 = parts.join("");
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var stream = new Response(bytes).body.pipeThrough(new DecompressionStream("gzip"));
      new Response(stream).arrayBuffer().then(function (buf) {
        var code = new TextDecoder().decode(buf);
        (0, eval)(code);
        console.log("[DeadSignal] engine v15 loaded", code.length);
        loadScript("js/ui.js", function () {
          loadScript("js/gore.js", function () {
            console.log("[DeadSignal] ui+gore ready");
            if (window.__dsBoot) window.__dsBoot();
          });
        });
      }).catch(function (e) { console.error("inflate fail", e); });
    } catch (e) { console.error("boot fail", e); }
  }
  function next() {
    if (loaded >= n) { finish(); return; }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "js/v14_" + loaded + ".txt?v=" + Date.now());
    xhr.onload = function () {
      if (xhr.status === 200) { parts[loaded] = xhr.responseText.trim(); loaded++; next(); }
      else console.error("chunk fail", loaded, xhr.status);
    };
    xhr.onerror = function () { console.error("chunk net fail", loaded); };
    xhr.send();
  }
  next();
})();
