// DeadSignal boot v15 - 4-part gzip base64 engine + ui + gore
(function () {
  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
    s.onload = function () { cb && cb(); };
    s.onerror = function () { console.error("script fail", src); };
    document.head.appendChild(s);
  }
  function get(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url + "?v=" + Date.now());
      xhr.onload = function () {
        if (xhr.status === 200) resolve(xhr.responseText.trim());
        else reject(new Error("fail " + url));
      };
      xhr.onerror = function () { reject(new Error("net " + url)); };
      xhr.send();
    });
  }
  Promise.all([0,1,2,3].map(function (i) { return get("js/e" + i + ".b64"); }))
    .then(function (parts) {
      var bin = atob(parts.join(""));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Response(bytes).body.pipeThrough(new DecompressionStream("gzip"));
    })
    .then(function (stream) { return new Response(stream).arrayBuffer(); })
    .then(function (buf) {
      var code = new TextDecoder().decode(buf);
      (0, eval)(code);
      console.log("[DeadSignal] engine v15 loaded", code.length);
      loadScript("js/ui.js", function () {
        loadScript("js/gore.js", function () {
          console.log("[DeadSignal] ui+gore ready");
          if (window.__dsBoot) window.__dsBoot();
        });
      });
    })
    .catch(function (e) { console.error("boot fail", e); });
})();
