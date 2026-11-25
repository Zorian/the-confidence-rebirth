/* Dani's videos stream from Bunny (adaptive 240p to 1080p). Falls back to the local MP4 if streaming fails. */
(function(){
  var CDN="https://vz-1610ba8a-5a5.b-cdn.net/";
  window.BUNNY={vsl:"b5fa2127-f87c-4876-81c9-fa7c1929ea1f",P:"d8f5b435-533a-4238-a288-8d00db369004",F:"0f273710-9925-4e40-a30f-22e67e1c2f05",O:"78c7be23-aabb-4548-8dec-8fe913487f1c",H:"b3021abe-b1c9-49ef-8ffc-20185145bb5e",I:"ab636e2c-cbc9-48a8-ae13-053b39a584a2",C:"b104096a-60e5-47ee-bd0b-9dc28d040063"};
  var hlsP=null;
  function loadHls(){ if(!hlsP) hlsP=new Promise(function(ok,no){ var s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js"; s.onload=function(){ok(window.Hls)}; s.onerror=no; document.head.appendChild(s); }); return hlsP; }
  // Point a <video> at a Bunny video. Returns a promise that resolves when the source is attached.
  window.rbStream=function(v,guid,fallback){
    var url=CDN+guid+"/playlist.m3u8", fb=function(){ if(fallback&&v.getAttribute("src")!==fallback){ v.src=fallback; } };
    if(!guid){ fb(); return Promise.resolve(); }
    if(v.canPlayType("application/vnd.apple.mpegurl")){ v.src=url; v.addEventListener("error",fb,{once:true}); return Promise.resolve(); }
    return loadHls().then(function(Hls){
      if(!Hls||!Hls.isSupported()){ fb(); return; }
      var h=new Hls({capLevelToPlayerSize:true,startLevel:-1}); h.loadSource(url); h.attachMedia(v);
      h.on(Hls.Events.ERROR,function(e,d){ if(d.fatal){ h.destroy(); fb(); v.play().catch(function(){}); } });
    }).catch(fb);
  };
})();
