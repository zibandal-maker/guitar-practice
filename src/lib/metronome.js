import { useState, useRef, useEffect } from 'react';
import { NOTE_VALS } from './theory.js';

/* 오디오 클럭 look-ahead 스케줄러 기반 메트로놈.
   setTimeout 지터 없이 클릭을 오디오 시각에 정확히 예약 → 박이 흔들리지 않음.
   onTick 리스너 계약 유지: (totalSub, isHead, beatIdx). UI/리스너는 클릭 소리 시각에
   맞춰 지연 호출되어 화면 하이라이트가 소리와 동기화됨. */
function useMetronome(){
  var st = useState(80); var bpm = st[0]; var setBpm = st[1];
  var pl = useState(false); var playing = pl[0]; var setPlaying = pl[1];
  var bt = useState(0); var beat = bt[0]; var setBeat = bt[1];
  var nv = useState("q"); var noteVal = nv[0]; var setNoteVal = nv[1];

  var ctxRef = useRef(null);
  var timerRef = useRef(null);
  var beatRef = useRef(0);           /* 시작부터의 분할(subdivision) 인덱스 */
  var nextTime = useRef(0);          /* 다음 클릭 예약 오디오 시각 */
  var playingRef = useRef(false);

  var bpmRef = useRef(80); bpmRef.current = bpm;
  var noteValRef = useRef("q"); noteValRef.current = noteVal;
  var listenersRef = useRef([]);     /* 여러 onTick 리스너 지원 */

  function ensureCtx(){
    if(!ctxRef.current){
      try{ ctxRef.current = new (window.AudioContext||window.webkitAudioContext)(); }
      catch(e){ ctxRef.current = null; }
    }
    return ctxRef.current;
  }
  function curSub(){
    var v = NOTE_VALS.filter(function(n){return n.id===noteValRef.current;})[0] || NOTE_VALS[0];
    return v.sub;
  }
  /* 클릭을 오디오 시각 t에 예약. type: 2=다운비트, 1=박 머리, 0=분할 */
  function click(type, t){
    var ctx = ctxRef.current; if(!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.frequency.value = type===2 ? 1320 : (type===1 ? 990 : 660);
    var peak = type===2 ? 0.45 : (type===1 ? 0.35 : 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t+0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t+0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t+0.06);
  }
  /* 한 분할 tick 예약: 소리는 오디오 시각 t에, UI/리스너는 t에 맞춰 지연 호출 */
  function scheduleTick(ctx, totalSub, t){
    var sub = curSub();
    var posInBeat = totalSub % sub;
    var beatNum = Math.floor(totalSub / sub) % 4;
    var type = (posInBeat!==0) ? 0 : (beatNum===0 ? 2 : 1);
    click(type, t);
    var isHead = (posInBeat===0);
    var beatIdx = Math.floor(totalSub/sub);
    var delay = (t - ctx.currentTime)*1000; if(delay<0) delay=0;
    setTimeout(function(){
      if(!playingRef.current) return;
      if(posInBeat===0) setBeat(beatNum);
      var ls = listenersRef.current;
      for(var i=0;i<ls.length;i++){ try{ ls[i](totalSub, isHead, beatIdx); }catch(e){} }
    }, delay);
  }
  function scheduler(){
    var ctx = ctxRef.current; if(!ctx) return;
    while(nextTime.current < ctx.currentTime + 0.1){ /* 100ms look-ahead */
      scheduleTick(ctx, beatRef.current, nextTime.current);
      nextTime.current += (60/bpmRef.current) / curSub();
      beatRef.current++;
    }
    timerRef.current = setTimeout(scheduler, 25);
  }

  function start(){
    var ctx = ensureCtx();
    if(ctx && ctx.state==="suspended"){ try{ctx.resume();}catch(e){} }
    if(!ctx) return;
    playingRef.current = true; setPlaying(true);
    beatRef.current = 0;
    nextTime.current = ctx.currentTime + 0.06;
    scheduler();
  }
  function stop(){
    playingRef.current = false; setPlaying(false);
    if(timerRef.current){ clearTimeout(timerRef.current); timerRef.current=null; }
    setBeat(0); beatRef.current=0;
  }
  function toggle(){ if(playingRef.current) stop(); else start(); }

  /* 음표(분할 수) 변경 시, 재생 중이면 다음 박 머리에 맞춰 카운터 정렬 */
  function changeNoteVal(id){
    if(playingRef.current){
      var sub = curSub();
      var curBeat = Math.floor(beatRef.current/sub);
      var v = NOTE_VALS.filter(function(n){return n.id===id;})[0] || NOTE_VALS[0];
      beatRef.current = (curBeat+1)*v.sub;
    }
    setNoteVal(id);
  }

  useEffect(function(){ return function(){ if(timerRef.current) clearTimeout(timerRef.current); }; }, []);

  return {
    bpm:bpm, setBpm:setBpm, playing:playing, beat:beat,
    noteVal:noteVal, setNoteVal:changeNoteVal,
    toggle:toggle, stop:stop,
    onTick:function(fn){
      listenersRef.current.push(fn);
      return function(){ listenersRef.current=listenersRef.current.filter(function(x){return x!==fn;}); };
    }
  };
}

export { useMetronome };
