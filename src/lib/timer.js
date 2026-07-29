import { useState, useRef, useEffect } from 'react';

function usePracticeTimer(){
  var st=useState(5); var minutes=st[0]; var setMinutes=st[1];
  var rn=useState(false); var running=rn[0]; var setRunning=rn[1];
  var rm=useState(0); var remain=rm[0]; var setRemain=rm[1];
  var ref=useRef(null); var remRef=useRef(0);
  function start(){
    setRunning(true); remRef.current=minutes*60; setRemain(remRef.current);
    ref.current=setInterval(function(){
      remRef.current--;
      setRemain(remRef.current);
      if(remRef.current<=0){ stop(); }
    },1000);
  }
  function stop(){ setRunning(false); if(ref.current){clearInterval(ref.current); ref.current=null;} }
  useEffect(function(){ return function(){ if(ref.current) clearInterval(ref.current); }; },[]);
  return {minutes:minutes, setMinutes:setMinutes, running:running, remain:remain,
    toggle:function(){ if(running) stop(); else start(); }};
}
function fmtTime(s){
  if(s<0) s=0;
  var m=Math.floor(s/60); var ss=s%60;
  return (m<10?"0":"")+m+":"+(ss<10?"0":"")+ss;
}

/* ========================================================================
   백킹 트랙 — 진행 라이브러리 (스타일별), 코드 타입(보이싱), 드럼 그루브
   각 진행: bars = [{d:키로부터 반음, t:코드타입}], groove, bpm
   ======================================================================== */

export { usePracticeTimer, fmtTime };
