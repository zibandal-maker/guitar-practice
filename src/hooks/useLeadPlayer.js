import { useState, useRef, useEffect } from 'react';

function useLeadPlayer(){
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var ix=useState(-1); var stepIdx=ix[0]; var setStepIdx=ix[1]; /* 현재 음 인덱스 */
  var ctxRef=useRef(null), schedRef=useRef(null);
  var nextT=useRef(0), pos=useRef(0); /* pos: 16분 누적 카운터 */
  var cfg=useRef({bpm:80, notes:[], loop:true});

  function ensureCtx(){
    if(!ctxRef.current){
      if(window.__bkCtx){ ctxRef.current=window.__bkCtx; }
      else{ try{ ctxRef.current=new(window.AudioContext||window.webkitAudioContext)(); window.__bkCtx=ctxRef.current; }catch(e){ ctxRef.current=null; } }
    }
    return ctxRef.current;
  }
  /* 음 1개를 시각 t에 합성 발음 (기타 톤). art로 벤딩 피치 표현 */
  function pluck(ctx, n, dur, t){
    if(n.rest) return;
    if(n.f<0){ /* 뮤트/고스트: 짧은 노이즈성 클릭 */
      return;
    }
    var openFreq=[82.41,110.00,146.83,196.00,246.94,329.63]; /* 6→1번줄 */
    var freq=openFreq[n.s]*Math.pow(2, n.f/12);
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type="triangle"; o.frequency.setValueAtTime(freq, t);
    /* 벤딩: 풀=+2반음, 하프=+1반음. 슬라이드: 살짝 글라이드 */
    var art=n.art||"";
    if(art==="b"||art==="br"){ o.frequency.linearRampToValueAtTime(freq*Math.pow(2,2/12), t+Math.min(0.18,dur*0.5)); }
    else if(art==="hb"){ o.frequency.linearRampToValueAtTime(freq*Math.pow(2,1/12), t+Math.min(0.15,dur*0.5)); }
    else if(art==="pb"){ o.frequency.setValueAtTime(freq*Math.pow(2,2/12), t); o.frequency.linearRampToValueAtTime(freq, t+dur*0.6); }
    else if(art==="r"){ o.frequency.setValueAtTime(freq*Math.pow(2,2/12), t); o.frequency.linearRampToValueAtTime(freq, t+Math.min(0.12,dur*0.4)); }
    else if(art==="/"){ o.frequency.setValueAtTime(freq*Math.pow(2,-2/12), t); o.frequency.linearRampToValueAtTime(freq, t+0.06); }
    else if(art==="\\"){ o.frequency.setValueAtTime(freq*Math.pow(2,2/12), t); o.frequency.linearRampToValueAtTime(freq, t+0.06); }
    /* 비브라토 */
    if(art==="~"){
      var lfo=ctx.createOscillator(), lg=ctx.createGain();
      lfo.frequency.value=5.5; lg.gain.value=4;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t+dur+0.05);
    }
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(n.art==="x"?0.12:0.34,t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,t+Math.max(0.18,dur*0.95));
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+dur+0.05);
  }
  /* 음 인덱스 i를 시각 t에 스케줄 + UI 갱신 */
  function scheduleNote(ctx, i, t){
    var c=cfg.current; var notes=c.notes; var n=notes[i]; if(!n) return;
    var sec16=(60/c.bpm)/4;
    var dur=n.d*sec16;
    if(!n.rest){ pluck(ctx, n, dur*0.9, t); }
    var delayMs=(t-ctx.currentTime)*1000; if(delayMs<0) delayMs=0;
    setTimeout(function(){ setStepIdx(i); }, delayMs);
  }
  function scheduler(){
    var ctx=ensureCtx(); if(!ctx) return;
    var c=cfg.current; var notes=c.notes; var sec16=(60/c.bpm)/4;
    while(nextT.current < ctx.currentTime + 0.12){
      var idx=pos.current;
      if(idx>=notes.length){
        if(c.loop){ pos.current=0; idx=0; /* 루프 사이 1박 쉼 */
          nextT.current+=sec16*4; continue; }
        else { stopInternal(true); return; }
      }
      scheduleNote(ctx, idx, nextT.current);
      nextT.current += notes[idx].d*sec16;
      pos.current++;
    }
    schedRef.current=setTimeout(scheduler, 25);
  }
  function start(config){
    var ctx=ensureCtx(); if(!ctx) return;
    if(ctx.state==="suspended"){ try{ctx.resume();}catch(e){} }
    cfg.current=Object.assign({}, cfg.current, config);
    pos.current=0; nextT.current=ctx.currentTime+0.06;
    setPlaying(true); setStepIdx(-1);
    scheduler();
  }
  function stopInternal(fromEnd){
    setPlaying(false); setStepIdx(-1);
    if(schedRef.current){ clearTimeout(schedRef.current); schedRef.current=null; }
  }
  function stop(){ stopInternal(false); }
  useEffect(function(){ return function(){ if(schedRef.current) clearTimeout(schedRef.current); }; },[]);
  return {playing:playing, stepIdx:stepIdx, start:start, stop:stop,
    toggle:function(config){ if(playing) stop(); else start(config); }};
}

/* ========================================================================
   JamSolo — 12마디 블루스 솔로 섹션 (스케일탭 백킹 아래)
   props: rootSemiE(E=0 기준 이조), keyName, keySemiC(C=0 기준 코드라벨용),
          onHighlight({string,fret}|null)
   ======================================================================== */

export { useLeadPlayer };
