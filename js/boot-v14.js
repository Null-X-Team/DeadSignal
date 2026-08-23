// DeadSignal boot v18f - engine parts + guns
(function () {
  function loadText(src, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", src);
    xhr.onload = function () {
      if (xhr.status === 200) cb(null, xhr.responseText);
      else cb(new Error("fail " + src));
    };
    xhr.onerror = function () { cb(new Error("net " + src)); };
    xhr.send();
  }
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
  loadScript("js/guns.js?v=20260822v18f", function () {
    loadText("js/engine.p1.js?v=20260822v18f", function (e1, a) {
      if (e1) return console.error(e1);
      loadText("js/engine.p2.js?v=20260822v18f", function (e2, b) {
        if (e2) return console.error(e2);
        try {
          (0, eval)(a + b);
          console.log("[DeadSignal] engine v18f crouch+guns");
        } catch (err) { console.error(err); return; }
        chain(["js/ui.js?v=20260822v18f", "js/gore.js?v=20260822v18f"], 0, function () {
          console.log("[DeadSignal] ready v18f");
          if (window.__dsBoot) window.__dsBoot();
        });
      });
    });
  });
})();
