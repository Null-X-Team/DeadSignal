// DeadSignal boot v39
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
  var v = "20260827v39";
  var parts = 32;
  var idx = 0;
  function afterEngine() {
    if (!(window.DeadSignalGame && window.DeadSignalGame.Engine)) {
      showErr("Engine failed to load. Hard-refresh (Ctrl+Shift+R).");
      return;
    }
    loadScript("js/patch-v34.js?v=" + v, function () {
      loadScript("js/patch-v31.js?v=" + v, function () {
        loadScript("js/patch-v32.js?v=" + v, function () {
          loadScript("js/patch-v35.js?v=" + v, function () {
            loadScript("js/patch-v36.js?v=" + v, function () {
              loadScript("js/patch-v37.js?v=" + v, function () {
                loadScript("js/patch-v38.js?v=" + v, function () {
                  loadScript("js/patch-v39.js?v=" + v, function () {
                    loadScript("js/ui.js?v=" + v, function () {
                      loadScript("js/gore.js?v=" + v, function () {
                        loadScript("js/patch-v22.js?v=" + v, function () {
                          console.log("[DeadSignal] ready v39");
                          if (window.DeadSignalAuth) window.DeadSignalAuth.gate();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
  function next() {
    if (idx >= parts) {
      try {
        var arr = window.__DS_EP || [];
        var code = "";
        for (var i = 0; i < arr.length; i++) code += (arr[i] || "");
        (0, eval)(code);
        afterEngine();
      } catch (err) {
        console.error("[DeadSignal] eval failed", err);
        showErr("Engine eval failed. Hard-refresh (Ctrl+Shift+R).");
      }
      return;
    }
    loadScript("js/epart_" + idx + ".js?v=" + v, function () {
      idx++;
      next();
    });
  }
  loadScript("js/patch-v34.js?v=" + v, function () {
    loadScript("js/supabase-config.js?v=" + v, function () {
      loadScript("js/auth.js?v=" + v, function () {
        loadScript("js/meta.js?v=" + v, function () {
          loadScript("js/auth-bridge.js?v=" + v, function () {
            loadScript("js/auth-fix.js?v=" + v, function () {
              loadScript("js/guns.js?v=" + v, next);
            });
          });
        });
      });
    });
  });
})();
