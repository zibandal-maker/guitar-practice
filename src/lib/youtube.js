/* 유튜브 IFrame Player API 로더 + URL 파서.
   API 키 불필요. 스크립트를 1회 로드하고 window.YT 준비를 Promise로 반환. */
var ytPromise = null;
function loadYT(){
  if(ytPromise) return ytPromise;
  ytPromise = new Promise(function(resolve){
    if(window.YT && window.YT.Player){ resolve(window.YT); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){
      if(typeof prev === "function"){ try{ prev(); }catch(e){} }
      resolve(window.YT);
    };
    if(!document.getElementById("yt-iframe-api")){
      var s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
  return ytPromise;
}

/* 유튜브 URL/ID → 11자 영상 ID (실패 시 null) */
function parseVideoId(input){
  if(!input) return null;
  input = String(input).trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try{
    var u = new URL(input);
    if(u.hostname.indexOf("youtu.be") >= 0){
      var p = u.pathname.replace(/^\//, "");
      if(/^[A-Za-z0-9_-]{11}$/.test(p)) return p;
    }
    var v = u.searchParams.get("v");
    if(v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    var m = u.pathname.match(/\/(embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/);
    if(m) return m[2];
  }catch(e){
    var m2 = input.match(/[A-Za-z0-9_-]{11}/);
    if(m2) return m2[0];
  }
  return null;
}

export { loadYT, parseVideoId };
