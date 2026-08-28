// DeadSignal guns v37 — load imgs + strip solid backgrounds (block fix)
(function () {
  function loadFirst(paths, onReady) {
    var img = new Image();
    img.decoding = "async";
    var i = 0;
    function tryNext() {
      if (i >= paths.length) {
        console.warn("[DeadSignal] image missing", paths[0]);
        return;
      }
      img.src = paths[i++];
    }
    img.onerror = tryNext;
    img.onload = function () { if (onReady) onReady(img); };
    tryNext();
    return img;
  }
  function stripBg(srcImg) {
    try {
      var c = document.createElement("canvas");
      var w = srcImg.naturalWidth || srcImg.width;
      var h = srcImg.naturalHeight || srcImg.height;
      if (!w || !h) return srcImg;
      c.width = w; c.height = h;
      var ctx = c.getContext("2d");
      ctx.drawImage(srcImg, 0, 0);
      var data = ctx.getImageData(0, 0, w, h);
      var d = data.data;
      function px(x, y) {
        var i = (y * w + x) * 4;
        return [d[i], d[i+1], d[i+2], d[i+3]];
      }
      var samples = [px(0,0), px(w-1,0), px(0,h-1), px(w-1,h-1)];
      var br = 0, bg = 0, bb = 0;
      for (var s = 0; s < samples.length; s++) {
        br += samples[s][0]; bg += samples[s][1]; bb += samples[s][2];
      }
      br /= 4; bg /= 4; bb /= 4;
      var visited = new Uint8Array(w * h);
      var stack = [];
      function push(x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        var i = y * w + x;
        if (visited[i]) return;
        var o = i * 4;
        var r = d[o], g = d[o+1], b = d[o+2], a = d[o+3];
        if (a < 8) { visited[i] = 1; d[o+3] = 0; stack.push(x, y); return; }
        var dist = Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
        var mean = (r + g + b) / 3;
        var gray = Math.abs(r - g) + Math.abs(g - b);
        var isBg = dist < 55 || (mean > 200 && gray < 30) || (mean > 185 && gray < 18 && dist < 90);
        if (!isBg) return;
        visited[i] = 1;
        d[o+3] = 0;
        stack.push(x, y);
      }
      for (var x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
      for (var y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
      while (stack.length) {
        var cy = stack.pop(), cx = stack.pop();
        push(cx - 1, cy); push(cx + 1, cy); push(cx, cy - 1); push(cx, cy + 1);
      }
      ctx.putImageData(data, 0, 0);
      var minX = w, minY = h, maxX = 0, maxY = 0;
      for (var yy = 0; yy < h; yy++) {
        for (var xx = 0; xx < w; xx++) {
          if (d[(yy * w + xx) * 4 + 3] > 10) {
            if (xx < minX) minX = xx;
            if (yy < minY) minY = yy;
            if (xx > maxX) maxX = xx;
            if (yy > maxY) maxY = yy;
          }
        }
      }
      if (maxX > minX && maxY > minY) {
        var cw = maxX - minX + 1, ch = maxY - minY + 1;
        var c2 = document.createElement("canvas");
        c2.width = cw; c2.height = ch;
        c2.getContext("2d").drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);
        c = c2;
      }
      var out = new Image();
      out.src = c.toDataURL("image/png");
      return out;
    } catch (e) {
      return srcImg;
    }
  }
  function bakeFlipRight(srcImg) {
    try {
      var c = document.createElement("canvas");
      c.width = srcImg.naturalWidth || srcImg.width;
      c.height = srcImg.naturalHeight || srcImg.height;
      if (!c.width || !c.height) return srcImg;
      var ctx = c.getContext("2d");
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(srcImg, 0, 0);
      var out = new Image();
      out.src = c.toDataURL("image/png");
      return out;
    } catch (e) { return srcImg; }
  }
  window.DS_GUNS = {};
  window.DS_GUN_FLIP = {};

  function setGun(keys, img, flip) {
    var g = stripBg(img);
    function apply() {
      var final = flip ? bakeFlipRight(g) : g;
      keys.forEach(function (k) { window.DS_GUNS[k] = final; });
    }
    if (g.complete && g.naturalWidth) apply();
    else g.onload = apply;
  }

  loadFirst(["imgs/Glock.png"], function (img) { setGun(["pistol"], img, true); });
  loadFirst(["imgs/mossberg590.jpg", "imgs/pump.png"], function (img) {
    setGun(["scatter", "slug", "cluster", "shotgun"], img, false);
  });
  loadFirst(["imgs/Hatchet.png"], function (img) { setGun(["hatchet", "melee"], img, false); });
  loadFirst(["imgs/MP5.png"], function (img) { setGun(["smg"], img, false); });
  loadFirst(["imgs/M4A1.png", "imgs/M16A4.png"], function (img) {
    setGun(["carbine", "rifle", "m16"], img, false);
  });
  loadFirst(["imgs/BarrettM82.png"], function (img) { setGun(["rail"], img, false); });
  loadFirst(["imgs/M249SAW.jpg", "imgs/LMG.png"], function (img) {
    setGun(["auto", "lmg", "m249"], img, false);
  });
  loadFirst(["imgs/leveraction.png"], function (img) {
    setGun(["marksman", "leveraction"], img, false);
  });
  loadFirst(["imgs/M24sniper.jpeg", "imgs/sniper.png"], function (img) {
    setGun(["sniper"], img, false);
  });
  (function () {
    var c = document.createElement("canvas");
    c.width = 128; c.height = 40;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#3a3a30";
    ctx.fillRect(8, 14, 90, 12);
    ctx.fillStyle = "#6a5a30";
    ctx.fillRect(4, 10, 28, 20);
    ctx.fillStyle = "#c44";
    ctx.beginPath();
    ctx.moveTo(98, 12); ctx.lineTo(124, 20); ctx.lineTo(98, 28); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.fillRect(40, 16, 8, 8);
    var img = new Image();
    img.src = c.toDataURL("image/png");
    img.onload = function () { window.DS_GUNS.rpg = img; window.DS_GUNS.launcher = img; };
  })();
  console.log("[DeadSignal] guns v37 + bg strip + RPG");
})();
