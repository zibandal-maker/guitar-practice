<<<<<<< HEAD
import { useState, useRef, useEffect } from 'react';
import { synthKick, synthSnare, synthHat, synthTone, bassFreq, chordFreqsType } from '../lib/synth.js';
import { BK_CHORD_IVS, BK_PROGRESSIONS } from '../data/progressions.js';

function useBackingTrack(){
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var bpmS=useState(80); var bpm=bpmS[0]; var setBpm=bpmS[1];
  var barS=useState(0); var curBar=barS[0]; var setCurBar=barS[1];
  var ctxRef=useRef(null), schedRef=useRef(null);
  /* 스케줄러 상태 */
  var nextNoteTime=useRef(0), beat16=useRef(0); /* 16분음표 단위 카운터 */
  var cfg=useRef({bpm:80, keySemi:0, bars:BK_PROGRESSIONS[0].bars, groove:"shuffle",
    drums:true, bass:true, chords:true, voicing:"auto"});

  function ensureCtx(){
    if(!ctxRef.current){
      /* smplr과 동일한 AudioContext 공유 */
      if(window.__bkCtx){ ctxRef.current=window.__bkCtx; }
      else{ try{ ctxRef.current=new(window.AudioContext||window.webkitAudioContext)(); window.__bkCtx=ctxRef.current; }catch(e){ ctxRef.current=null; } }
    }
    return ctxRef.current;
  }

  /* 한 16분 스텝 스케줄 */
  function scheduleStep(ctx, step16, t){
    var c=cfg.current;
    var bars=c.bars; var nBars=bars.length;
    var beatInBar = Math.floor((step16 % 16) / 4); /* 0~3박 */
    var sub = step16 % 4;                            /* 박 내 16분 위치 */
    var barIdx = Math.floor(step16 / 16) % nBars;
    var bar = bars[barIdx];
    var rootSemi = ((c.keySemi + bar.d) % 12 + 12) % 12;
    var beatDur=(60/c.bpm);
    var S = (window.__smplrStatus==="ready") ? window.__smplr : null;
    var groove=c.groove;
    var isSwing = (groove==="shuffle"||groove==="swing"||groove==="slowblues");

    /* --- 드럼 (그루브별) --- */
    if(c.drums){
      var kickHit, snareHit;
      if(groove==="funk"){
        /* 펑크: 킥 1·'a of 1'·3, 스네어 2·4, 16분 하이햇 */
        kickHit = (sub===0&&(beatInBar===0||beatInBar===2)) || (sub===3&&beatInBar===0);
        snareHit= sub===0&&(beatInBar===1||beatInBar===3);
      } else {
        kickHit = sub===0 && (beatInBar===0||beatInBar===2);
        snareHit= sub===0 && (beatInBar===1||beatInBar===3);
      }
      if(S){
        var DM=S.drumMap||{kick:"kick",snare:"snare",hat:"hi-hat"};
        if(kickHit) S.drums.start({note:DM.kick, time:t});
        if(snareHit) S.drums.start({note:DM.snare, time:t});
        if(groove==="swing"){
          if(sub===0){ S.drums.start({note:DM.hat, time:t, velocity:55});
            S.drums.start({note:DM.hat, time:t+beatDur*(2/3), velocity:45}); }
        } else if(isSwing){
          if(sub===0){ S.drums.start({note:DM.hat, time:t, velocity:70});
            S.drums.start({note:DM.hat, time:t+beatDur*(2/3), velocity:55}); }
        } else if(groove==="funk"){
          S.drums.start({note:DM.hat, time:t, velocity: (sub===0?75:45)});
        } else {
          if(sub===0||sub===2) S.drums.start({note:DM.hat, time:t, velocity:62});
        }
      } else {
        if(kickHit) synthKick(ctx,t);
        if(snareHit) synthSnare(ctx,t);
        if(isSwing||groove==="swing"){ if(sub===0){ synthHat(ctx,t,false); synthHat(ctx,t+beatDur*(2/3),false); } }
        else if(groove==="funk"){ synthHat(ctx,t,false); }
        else { if(sub===0||sub===2) synthHat(ctx,t,false); }
      }
    }
    /* --- 베이스 (그루브별) --- */
    if(c.bass && sub===0){
      var walk;
      if(groove==="funk"){ walk=[0,0,7,0]; }          /* 펑크: 루트 중심 */
      else if(groove==="swing"){ walk=[0,4,7,11]; }   /* 워킹 R-3-5-7 */
      else if(groove==="straight"){ walk=[0,7,0,7]; } /* 팝: R-5 */
      else { walk=[0,4,7,9]; }                        /* 블루스 R-3-5-6 */
      /* 마디별 베이스 지정(슬래시코드): bar.b(키로부터 반음)가 있으면 그 음을 베이스 루트로 */
      var bassRoot = (bar.b !== undefined && bar.b !== null)
        ? (((c.keySemi + bar.b) % 12 + 12) % 12) : rootSemi;
      var bassSemi=bassRoot+walk[beatInBar%4];
      if(S){
        S.bass.start({note:36+bassSemi, time:t, duration:beatDur*0.9, velocity:95});
      } else {
        synthTone(ctx,t, bassFreq(rootSemi, walk[beatInBar%4]), 0.42, "triangle", 0.5);
      }
    }
    /* --- 코드 컴핑 (그루브별 타이밍 + 코드타입 보이싱) --- */
    var ivs = BK_CHORD_IVS[bar.t] || BK_CHORD_IVS.dom7;
    var compHit;
    if(groove==="funk"){ compHit = (sub===2); }                 /* 펑크: 16분 오프비트 스탭 */
    else if(groove==="straight"){ compHit = (sub===0); }        /* 팝: 박마다 */
    else { compHit = (sub===0 && (beatInBar===1||beatInBar===3)); } /* 블루스/스윙: 2·4 */
    if(c.chords && compHit){
      if(S){
        ivs.forEach(function(iv){
          var midi=48+rootSemi+iv; /* C3=48 */
          S.piano.start({note:midi, time:t, duration:beatDur*0.8, velocity:58});
        });
      } else {
        var freqs=chordFreqsType(rootSemi, ivs);
        freqs.forEach(function(fr,i){ synthTone(ctx,t+i*0.004, fr, 0.22, "sawtooth", 0.10); });
      }
    }
    /* 현재 마디 UI 갱신: 소리 시각에 맞춰 지연 */
    if(step16 % 16 === 0){
      var b=barIdx;
      var delayMs=(t - ctx.currentTime)*1000;
      if(delayMs<0) delayMs=0;
      setTimeout(function(){ setCurBar(b); }, delayMs);
    }
  }

  function scheduler(){
    var ctx=ensureCtx(); if(!ctx) return;
    var c=cfg.current;
    var secPer16 = (60/c.bpm)/4;
    while(nextNoteTime.current < ctx.currentTime + 0.1){ /* 100ms look-ahead */
      scheduleStep(ctx, beat16.current, nextNoteTime.current);
      nextNoteTime.current += secPer16;
      beat16.current++;
    }
    schedRef.current=setTimeout(scheduler, 25);
  }

  function start(config){
    var ctx=ensureCtx(); if(!ctx) return;
    if(ctx.state==="suspended"){ try{ctx.resume();}catch(e){} }
    cfg.current=Object.assign({}, cfg.current, config, {bpm:bpm});
    beat16.current=0; nextNoteTime.current=ctx.currentTime+0.05;
    setPlaying(true); setCurBar(0);
    scheduler();
  }
  function stop(){ setPlaying(false); if(schedRef.current){clearTimeout(schedRef.current); schedRef.current=null;} setCurBar(0); }
  function updateConfig(patch){ cfg.current=Object.assign({}, cfg.current, patch); }
  useEffect(function(){ return function(){ if(schedRef.current) clearTimeout(schedRef.current); }; },[]);
  /* bpm 실시간 반영 */
  useEffect(function(){ cfg.current.bpm=bpm; },[bpm]);

  return {playing:playing, bpm:bpm, setBpm:setBpm, curBar:curBar,
    start:start, stop:stop, updateConfig:updateConfig,
    toggle:function(config){ if(playing) stop(); else start(config); }};
}

/* ========================================================================
   잼 프레이즈 라이브러리 v2 — 12마디 블루스 솔로 + 상세 타브(ASCII 리듬라인 / SVG)
   ------------------------------------------------------------------------
   음 표기: {s:줄(6번줄=0~1번줄=5), f:프렛, d:길이(16분 단위), art:주법, dot:점음표}
     d: 1=16분, 2=8분, 3=점8분, 4=4분, 6=점4분, 8=2분, 12=점2분, 16=온음표
     art: ""일반, "h"해머온, "p"풀오프, "b"풀벤딩(1음), "hb"하프벤딩(½음),
          "br"벤드릴리스, "pb"프리벤드, "r"릴리스, "/"슬라이드업, "\\"슬라이드다운,
          "~"비브라토, "x"뮤트/고스트, "t"태핑
     rest: 음 대신 쉼표 → {rest:true, d:길이}
   12마디: bars[0..11], 각 마디 음 길이 합 = 16 (4/4)
   기준 키: A 블루스 (5프렛 박스 중심). transposePhrase로 이조.
   ======================================================================== */

export { useBackingTrack };
=======
import { useState, useRef, useEffect } from 'react';
import { synthKick, synthSnare, synthHat, synthTone, bassFreq, chordFreqsType } from '../lib/synth.js';
import { BK_CHORD_IVS, BK_PROGRESSIONS } from '../data/progressions.js';

function useBackingTrack(){
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var bpmS=useState(80); var bpm=bpmS[0]; var setBpm=bpmS[1];
  var barS=useState(0); var curBar=barS[0]; var setCurBar=barS[1];
  var ctxRef=useRef(null), schedRef=useRef(null);
  /* 스케줄러 상태 */
  var nextNoteTime=useRef(0), beat16=useRef(0); /* 16분음표 단위 카운터 */
  var cfg=useRef({bpm:80, keySemi:0, bars:BK_PROGRESSIONS[0].bars, groove:"shuffle",
    drums:true, bass:true, chords:true, voicing:"auto"});

  function ensureCtx(){
    if(!ctxRef.current){
      /* smplr과 동일한 AudioContext 공유 */
      if(window.__bkCtx){ ctxRef.current=window.__bkCtx; }
      else{ try{ ctxRef.current=new(window.AudioContext||window.webkitAudioContext)(); window.__bkCtx=ctxRef.current; }catch(e){ ctxRef.current=null; } }
    }
    return ctxRef.current;
  }

  /* 한 16분 스텝 스케줄 */
  function scheduleStep(ctx, step16, t){
    var c=cfg.current;
    var bars=c.bars; var nBars=bars.length;
    var beatInBar = Math.floor((step16 % 16) / 4); /* 0~3박 */
    var sub = step16 % 4;                            /* 박 내 16분 위치 */
    var barIdx = Math.floor(step16 / 16) % nBars;
    var bar = bars[barIdx];
    var rootSemi = ((c.keySemi + bar.d) % 12 + 12) % 12;
    var beatDur=(60/c.bpm);
    var S = (window.__smplrStatus==="ready") ? window.__smplr : null;
    var groove=c.groove;
    var isSwing = (groove==="shuffle"||groove==="swing"||groove==="slowblues");

    /* --- 드럼 (그루브별) --- */
    if(c.drums){
      var kickHit, snareHit;
      if(groove==="funk"){
        /* 펑크: 킥 1·'a of 1'·3, 스네어 2·4, 16분 하이햇 */
        kickHit = (sub===0&&(beatInBar===0||beatInBar===2)) || (sub===3&&beatInBar===0);
        snareHit= sub===0&&(beatInBar===1||beatInBar===3);
      } else {
        kickHit = sub===0 && (beatInBar===0||beatInBar===2);
        snareHit= sub===0 && (beatInBar===1||beatInBar===3);
      }
      if(S){
        var DM=S.drumMap||{kick:"kick",snare:"snare",hat:"hi-hat"};
        if(kickHit) S.drums.start({note:DM.kick, time:t});
        if(snareHit) S.drums.start({note:DM.snare, time:t});
        if(groove==="swing"){
          if(sub===0){ S.drums.start({note:DM.hat, time:t, velocity:55});
            S.drums.start({note:DM.hat, time:t+beatDur*(2/3), velocity:45}); }
        } else if(isSwing){
          if(sub===0){ S.drums.start({note:DM.hat, time:t, velocity:70});
            S.drums.start({note:DM.hat, time:t+beatDur*(2/3), velocity:55}); }
        } else if(groove==="funk"){
          S.drums.start({note:DM.hat, time:t, velocity: (sub===0?75:45)});
        } else {
          if(sub===0||sub===2) S.drums.start({note:DM.hat, time:t, velocity:62});
        }
      } else {
        if(kickHit) synthKick(ctx,t);
        if(snareHit) synthSnare(ctx,t);
        if(isSwing||groove==="swing"){ if(sub===0){ synthHat(ctx,t,false); synthHat(ctx,t+beatDur*(2/3),false); } }
        else if(groove==="funk"){ synthHat(ctx,t,false); }
        else { if(sub===0||sub===2) synthHat(ctx,t,false); }
      }
    }
    /* --- 베이스 (그루브별) --- */
    if(c.bass && sub===0){
      var walk;
      if(groove==="funk"){ walk=[0,0,7,0]; }          /* 펑크: 루트 중심 */
      else if(groove==="swing"){ walk=[0,4,7,11]; }   /* 워킹 R-3-5-7 */
      else if(groove==="straight"){ walk=[0,7,0,7]; } /* 팝: R-5 */
      else { walk=[0,4,7,9]; }                        /* 블루스 R-3-5-6 */
      /* 마디별 베이스 지정(슬래시코드): bar.b(키로부터 반음)가 있으면 그 음을 베이스 루트로 */
      var bassRoot = (bar.b !== undefined && bar.b !== null)
        ? (((c.keySemi + bar.b) % 12 + 12) % 12) : rootSemi;
      var bassSemi=bassRoot+walk[beatInBar%4];
      if(S){
        S.bass.start({note:36+bassSemi, time:t, duration:beatDur*0.9, velocity:95});
      } else {
        synthTone(ctx,t, bassFreq(rootSemi, walk[beatInBar%4]), 0.42, "triangle", 0.5);
      }
    }
    /* --- 코드 컴핑 (그루브별 타이밍 + 코드타입 보이싱) --- */
    var ivs = BK_CHORD_IVS[bar.t] || BK_CHORD_IVS.dom7;
    var compHit;
    if(groove==="funk"){ compHit = (sub===2); }                 /* 펑크: 16분 오프비트 스탭 */
    else if(groove==="straight"){ compHit = (sub===0); }        /* 팝: 박마다 */
    else { compHit = (sub===0 && (beatInBar===1||beatInBar===3)); } /* 블루스/스윙: 2·4 */
    if(c.chords && compHit){
      if(S){
        ivs.forEach(function(iv){
          var midi=48+rootSemi+iv; /* C3=48 */
          S.piano.start({note:midi, time:t, duration:beatDur*0.8, velocity:58});
        });
      } else {
        var freqs=chordFreqsType(rootSemi, ivs);
        freqs.forEach(function(fr,i){ synthTone(ctx,t+i*0.004, fr, 0.22, "sawtooth", 0.10); });
      }
    }
    /* 현재 마디 UI 갱신: 소리 시각에 맞춰 지연 */
    if(step16 % 16 === 0){
      var b=barIdx;
      var delayMs=(t - ctx.currentTime)*1000;
      if(delayMs<0) delayMs=0;
      setTimeout(function(){ setCurBar(b); }, delayMs);
    }
  }

  function scheduler(){
    var ctx=ensureCtx(); if(!ctx) return;
    var c=cfg.current;
    var secPer16 = (60/c.bpm)/4;
    while(nextNoteTime.current < ctx.currentTime + 0.1){ /* 100ms look-ahead */
      scheduleStep(ctx, beat16.current, nextNoteTime.current);
      nextNoteTime.current += secPer16;
      beat16.current++;
    }
    schedRef.current=setTimeout(scheduler, 25);
  }

  function start(config){
    var ctx=ensureCtx(); if(!ctx) return;
    if(ctx.state==="suspended"){ try{ctx.resume();}catch(e){} }
    cfg.current=Object.assign({}, cfg.current, config, {bpm:bpm});
    beat16.current=0; nextNoteTime.current=ctx.currentTime+0.05;
    setPlaying(true); setCurBar(0);
    scheduler();
  }
  function stop(){ setPlaying(false); if(schedRef.current){clearTimeout(schedRef.current); schedRef.current=null;} setCurBar(0); }
  function updateConfig(patch){ cfg.current=Object.assign({}, cfg.current, patch); }
  useEffect(function(){ return function(){ if(schedRef.current) clearTimeout(schedRef.current); }; },[]);
  /* bpm 실시간 반영 */
  useEffect(function(){ cfg.current.bpm=bpm; },[bpm]);

  return {playing:playing, bpm:bpm, setBpm:setBpm, curBar:curBar,
    start:start, stop:stop, updateConfig:updateConfig,
    toggle:function(config){ if(playing) stop(); else start(config); }};
}

/* ========================================================================
   잼 프레이즈 라이브러리 v2 — 12마디 블루스 솔로 + 상세 타브(ASCII 리듬라인 / SVG)
   ------------------------------------------------------------------------
   음 표기: {s:줄(6번줄=0~1번줄=5), f:프렛, d:길이(16분 단위), art:주법, dot:점음표}
     d: 1=16분, 2=8분, 3=점8분, 4=4분, 6=점4분, 8=2분, 12=점2분, 16=온음표
     art: ""일반, "h"해머온, "p"풀오프, "b"풀벤딩(1음), "hb"하프벤딩(½음),
          "br"벤드릴리스, "pb"프리벤드, "r"릴리스, "/"슬라이드업, "\\"슬라이드다운,
          "~"비브라토, "x"뮤트/고스트, "t"태핑
     rest: 음 대신 쉼표 → {rest:true, d:길이}
   12마디: bars[0..11], 각 마디 음 길이 합 = 16 (4/4)
   기준 키: A 블루스 (5프렛 박스 중심). transposePhrase로 이조.
   ======================================================================== */

export { useBackingTrack };
>>>>>>> 2f92f95a7b5d5397a1a4ef0d21b28402df7da544
