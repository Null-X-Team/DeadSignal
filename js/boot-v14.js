(function(){
  var n=4, parts=[], loaded=0;
  function go(){
    if(loaded<n) return;
    var b64=parts.join('');
    var bin=atob(b64);
    var bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text().then(function(code){
      var s=document.createElement('script');
      s.text=code;
      document.head.appendChild(s);
      var u=document.createElement('script');
      u.src='js/ui.js?v=20260822v14';
      document.body.appendChild(u);
      var g=document.createElement('script');
      g.src='js/gore.js?v=20260822v14';
      document.body.appendChild(g);
    }).catch(function(e){
      console.error('engine inflate failed', e);
      document.body.innerHTML='<div style="color:#f66;font:16px monospace;padding:40px">Engine failed to load. Hard refresh.</div>';
    });
  }
  for(var i=0;i<n;i++){
    (function(i){
      fetch('js/v14_'+i+'.txt?v=20260822v14').then(function(r){return r.text();}).then(function(t){
        parts[i]=t; loaded++; go();
      });
    })(i);
  }
})();
