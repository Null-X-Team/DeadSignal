// DeadSignal boot v18e - crouch + gun images + 2-part engine
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
  loadScript("js/guns.js?v=20260822v18e", function () {
    loadScript("js/engine.p1.js?v=20260822v18e", function () {
      loadScript("js/engine.p2.js?v=20260822v18e", function () {
        console.log("[DeadSignal] engine v18e crouch+guns");
        chain(["js/ui.js?v=20260822v18e", "js/gore.js?v=20260822v18e"], 0, function () {
          console.log("[DeadSignal] ready v18e");
          if (window.__dsBoot) window.__dsBoot();
        });
      });
    });
  });
})();
