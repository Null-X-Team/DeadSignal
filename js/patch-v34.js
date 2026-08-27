// DeadSignal v34 — allow typing in auth fields
(function () {
  // Game key handler preventDefaults E/Q/B/C/Space which blocked username letters.
  window.addEventListener(
    "keydown",
    function (e) {
      var t = e.target;
      if (!t) return;
      var tag = (t.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) {
        e.stopImmediatePropagation();
      }
    },
    true
  );
  window.addEventListener(
    "keyup",
    function (e) {
      var t = e.target;
      if (!t) return;
      var tag = (t.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) {
        e.stopImmediatePropagation();
      }
    },
    true
  );
  console.log("[DeadSignal] v34 input keys unblocked");
})();
