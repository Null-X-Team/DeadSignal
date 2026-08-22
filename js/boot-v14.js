// DeadSignal boot v15 - 2-part gzip base64 engine + ui + gore
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("script fail", src); };
    document.head.appendChild(s);
  }
  function get(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url + "?v=" + Date.now());
    xhr.onload = function () {
      if (xhr.status === 200) cb(xhr.responseText.trim());
      else console.error("fail", url, xhr.status);
    };
    xhr.onerror = function () { console.error("net", url); };
    xhr.send();
  }
  get("js/engine_a.b64", function (a) {
    get("js/engine_b.b64", function (b) {
      try {
        var bin = atob(a + b);
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
    });
  });
})();
