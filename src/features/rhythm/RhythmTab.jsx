<<<<<<< HEAD
import React from 'react';
import { useState, useRef, useEffect } from 'react';
const e = React.createElement;

var RHYTHM_PATTERNS = [
  {name:"기본 4/4", diff:1, grid:[1,0,0,0, 2,0,0,0, 2,0,0,0, 2,0,0,0]},
  {name:"8분 스트레이트", diff:1, grid:[1,0,2,0, 2,0,2,0, 2,0,2,0, 2,0,2,0]},
  {name:"싱커페이션 기본", diff:2, grid:[1,0,0,2, 0,0,2,0, 2,0,0,2, 0,0,2,0]},
  {name:"반박 강조", diff:2, grid:[1,0,2,2, 2,0,2,2, 2,0,2,2, 2,0,2,2]},
  {name:"싱커페이션 심화", diff:3, grid:[1,0,2,0, 0,2,0,2, 2,0,0,2, 0,2,0,0]},
  {name:"타이 반박자", diff:3, grid:[1,0,0,2, 2,0,0,2, 2,0,0,2, 2,0,0,0]},
  {name:"오프비트 셋잇단", diff:3, grid:[1,0,2,0, 2,0,2,0, 0,2,0,2, 0,2,0,2]},
  {name:"16분 싱커페이션", diff:4, grid:[1,2,0,2, 2,0,2,2, 0,2,2,0, 2,0,2,2]},
  {name:"헤미올라", diff:4, grid:[1,0,0,2, 0,0,2,0, 0,2,0,0, 2,0,0,2]},
  {name:"펑크 그루브", diff:4, grid:[1,0,2,0, 0,2,2,0, 2,0,0,2, 0,2,0,2]}
];

/* 단순 16분 시퀀서 (리듬용 독립 엔진) */
function useRhythmEngine(){
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var bp=useState(80); var bpm=bp[0]; var setBpm=bp[1];
  var st=useState(-1); var step=st[0]; var setStep=st[1];
  var timerRef=useRef(null); var stepRef=useRef(0);
  var bpmRef=useRef(80); bpmRef.current=bpm;
  var gridRef=useRef([]);
  var ctxRef=useRef(null);
  function ensureCtx(){ if(!ctxRef.current){ try{ctxRef.current=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ctxRef.current=null;} } return ctxRef.current; }
  function click(type){
    var ctx=ensureCtx(); if(!ctx) return;
    var osc=ctx.createOscillator(); var g=ctx.createGain();
    osc.frequency.value = type===1?1320:(type===2?880:660);
    g.gain.setValueAtTime(0.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(type===1?0.5:0.3,ctx.currentTime+0.001);
    g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.05);
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.06);
  }
  function start(grid){
    var ctx=ensureCtx(); if(ctx&&ctx.state==="suspended"){try{ctx.resume();}catch(e){}}
    gridRef.current=grid; setPlaying(true); stepRef.current=0;
    function tick(){
      var s=stepRef.current%16;
      var v=gridRef.current[s]||0;
      if(v>0) click(v);
      setStep(s);
      stepRef.current++;
      timerRef.current=setTimeout(tick, (60000/bpmRef.current)/4); /* 16분 간격 */
    }
    tick();
  }
  function stop(){ setPlaying(false); if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;} setStep(-1); stepRef.current=0; }
  useEffect(function(){ return function(){ if(timerRef.current) clearTimeout(timerRef.current); }; },[]);
  return {playing:playing,bpm:bpm,setBpm:setBpm,step:step,
    toggle:function(grid){ if(playing) stop(); else start(grid); }, stop:stop, setGrid:function(g){gridRef.current=g;}};
}

/* 16분 그리드 시각화 */
function RhythmViz(props){
  var grid=props.grid; var playStep=props.playStep;
  var groups=[0,1,2,3];
  return e("div",{className:"rhythm-viz"},
    groups.map(function(gi){
      return e("div",{key:gi,className:"beat-group"},
        e("span",{className:"beat-label"},(gi+1)+"박"),
        [0,1,2,3].map(function(ci){
          var idx=gi*4+ci; var v=grid[idx]||0;
          var cls="cell16"+(v===1?" hit":v===2?" weak":"")+(playStep===idx?" play":"");
          return e("div",{key:ci,className:cls}, v>0?(v===1?"강":"약"):"");
        })
      );
    })
  );
}

/* Tap Tempo */
function TapTempo(props){
  var taps=useRef([]); 
  var bpmState=useState(0); var tapBpm=bpmState[0]; var setTapBpm=bpmState[1];
  var dotState=useState(0); var dotCount=dotState[0]; var setDotCount=dotState[1];
  var resetRef=useRef(null);
  function tap(){
    var now=Date.now();
    if(resetRef.current) clearTimeout(resetRef.current);
    taps.current.push(now);
    if(taps.current.length>8) taps.current.shift();
    if(taps.current.length>=2){
      var intervals=[];
      for(var i=1;i<taps.current.length;i++) intervals.push(taps.current[i]-taps.current[i-1]);
      var avg=intervals.reduce(function(a,b){return a+b;},0)/intervals.length;
      setTapBpm(Math.round(60000/avg));
    }
    setDotCount(taps.current.length);
    resetRef.current=setTimeout(function(){ taps.current=[]; setDotCount(0); },2500);
  }
  return e("div",{className:"card"},
    e("div",{className:"sec-label"},"\uD83D\uDC46 TAP TEMPO"),
    e("div",{style:{display:"flex",alignItems:"center",gap:"24px",flexWrap:"wrap"}},
      e("button",{className:"tap-circle",onClick:tap}, tapBpm>0?tapBpm:"TAP"),
      e("div",null,
        e("div",{style:{fontSize:"13px",color:"#8a92b0"}}, tapBpm>0?(tapBpm+" BPM"):"버튼을 박자에 맞춰 탭하세요"),
        e("div",{className:"tap-dots"}, Array.apply(null,{length:dotCount}).map(function(_,i){
          return e("div",{key:i,className:"tap-dot"});
        })),
        tapBpm>0 ? e("button",{className:"mini-btn",style:{marginTop:"10px"},
          onClick:function(){ props.onApply(tapBpm); }},"\u2192 리듬 BPM에 적용") : null
      )
    )
  );
}

/* 커스텀 패턴 빌더 */
function loadCustomPatterns(){ try{var r=localStorage.getItem("gtr_custpat"); return r?JSON.parse(r):[];}catch(e){return [];} }
function saveCustomPatterns(arr){ try{localStorage.setItem("gtr_custpat",JSON.stringify(arr.slice(0,8)));}catch(e){} }

function CustomPatternBuilder(props){
  var gs=useState(function(){ var a=[]; for(var i=0;i<16;i++) a.push(0); return a; });
  var grid=gs[0]; var setGrid=gs[1];
  var nm=useState("My Pattern"); var name=nm[0]; var setName=nm[1];
  var sv=useState(loadCustomPatterns()); var saved=sv[0]; var setSaved=sv[1];
  function cycle(i){
    var ng=grid.slice(); ng[i]=(ng[i]+1)%3; setGrid(ng);
  }
  function save(){
    if(grid.every(function(x){return x===0;})) { alert("패턴이 비어있습니다"); return; }
    var arr=saved.slice(); arr.unshift({name:name,grid:grid.slice(),ts:Date.now()});
    arr=arr.slice(0,8); saveCustomPatterns(arr); setSaved(arr);
    alert("저장됨: "+name);
  }
  function del(ts){ var arr=saved.filter(function(p){return p.ts!==ts;}); saveCustomPatterns(arr); setSaved(arr); }
  function reset(){ var a=[]; for(var i=0;i<16;i++)a.push(0); setGrid(a); }
  return e("div",{className:"card"},
    e("div",{className:"sec-label"},"\uD83C\uDF9B 커스텀 패턴"),
    e("div",{style:{fontSize:"13px",color:"#8a92b0",marginBottom:"4px"}},"클릭 → 무음 → 강박(파랑) → 약박(주황)"),
    e("div",{className:"cust-grid"},
      grid.map(function(v,i){
        var cls="cust-cell"+(v===1?" strong":v===2?" weak":"");
        return e("div",{key:i,className:cls,onClick:function(){cycle(i);}},
          (i%4===0)?((i/4+1)+"박"):"");
      })
    ),
    e("div",{style:{display:"flex",gap:"8px",marginTop:"8px",flexWrap:"wrap"}},
      e("input",{className:"memo-in",value:name,onChange:function(ev){setName(ev.target.value);}}),
      e("button",{className:"save-btn",onClick:save},"저장"),
      e("button",{className:"mini-btn",onClick:reset},"초기화"),
      e("button",{className:"mini-btn",onClick:function(){props.onPlay(grid);}},"\u25B6 듣기")
    ),
    saved.length>0 ? e("div",{style:{marginTop:"12px"}},
      saved.map(function(p){
        return e("div",{key:p.ts,style:{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"8px 0",borderTop:"1px solid #eef0ff"}},
          e("span",{style:{fontWeight:"700"}},p.name),
          e("span",null,
            e("button",{className:"mini-btn",onClick:function(){props.onPlay(p.grid);}},"\u25B6"),
            e("button",{className:"mini-btn",style:{marginLeft:"6px"},onClick:function(){del(p.ts);}},"\u00D7")
          )
        );
      })
    ) : null
  );
}

/* 리듬 챌린지 */
var STRUM=["\u2193","\u2191","\u2715","\u2014"]; /* 다운/업/뮤트/쉼 */

/* =========================================================================
   스트로크/커팅 예제 — 16분음표 16칸. 값: 0=쉼, 1=다운(D), 2=업(U), 3=뮤트(X)
   ========================================================================= */
/* 스트로크 예제 (어쿠스틱/통기타 정석 패턴) */
var STROKE_EXAMPLES = [
  {name:"8비트 기본", diff:1, desc:"D - D U - U D U", g:[1,0,0,0, 1,0,2,0, 0,0,2,0, 1,0,2,0]},
  {name:"올다운 8비트", diff:1, desc:"강한 8비트 다운", g:[1,0,2,0, 1,0,2,0, 1,0,2,0, 1,0,2,0]},
  {name:"발라드 기본", diff:1, desc:"D - - U - U D U", g:[1,0,0,0, 0,0,2,0, 0,0,2,0, 1,0,2,0]},
  {name:"컨트리/포크", diff:2, desc:"베이스+스트럼 느낌", g:[1,0,2,0, 0,0,2,0, 1,0,2,0, 0,0,2,0]},
  {name:"보사노바 느낌", diff:2, desc:"당김음 스트럼", g:[1,0,0,2, 0,0,2,0, 0,2,0,0, 2,0,0,2]},
  {name:"레게 오프비트", diff:2, desc:"업비트만 강조", g:[0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]},
  {name:"16비트 스트럼", diff:3, desc:"D U D U 16분", g:[1,2,1,2, 1,2,1,2, 1,2,1,2, 1,2,1,2]},
  {name:"싱커페이션 팝", diff:3, desc:"당김 들어간 팝", g:[1,0,2,0, 0,2,0,2, 1,0,0,2, 0,2,0,2]}
];
/* 펑크 커팅 예제 (16분 유지 + 뮤트, 커팅 그루브) */
var FUNK_CUTTING = [
  {name:"기본 16분 커팅", diff:2, desc:"D U 유지, 1·3박만 발음 나머지 뮤트", g:[1,2,3,2, 3,2,1,2, 3,2,1,2, 3,2,3,2]},
  {name:"나일 로저스 풍", diff:3, desc:"고스트 스트로크 그루브", g:[3,2,1,2, 3,3,1,2, 3,2,3,2, 1,3,3,2]},
  {name:"원노트 펑크", diff:3, desc:"16분 손은 유지, 발음 최소", g:[1,3,3,3, 3,3,1,3, 3,3,1,3, 3,3,3,3]},
  {name:"오프비트 펑크", diff:4, desc:"업비트 발음 강조", g:[3,1,3,2, 3,1,3,2, 3,1,3,2, 3,1,3,2]},
  {name:"제임스 브라운 풍", diff:4, desc:"강한 1박 + 커팅", g:[1,3,3,2, 3,2,3,3, 1,3,1,2, 3,3,3,2]},
  {name:"디스코 펑크", diff:4, desc:"16분 풀 커팅 그루브", g:[1,2,3,2, 1,2,3,2, 3,2,1,2, 3,2,1,2]}
];

/* 스트럼 음색 재생 (다운=낮고 풍성 / 업=높고 가벼움 / 뮤트=짧은 노이즈성) */
function useStrumEngine(){
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var bp=useState(80); var bpm=bp[0]; var setBpm=bp[1];
  var st=useState(-1); var step=st[0]; var setStep=st[1];
  var timerRef=useRef(null); var stepRef=useRef(0); var gridRef=useRef([]);
  var bpmRef=useRef(80); bpmRef.current=bpm;
  var ctxRef=useRef(null);
  function ensureCtx(){ if(!ctxRef.current){try{ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();}catch(e){ctxRef.current=null;}} return ctxRef.current; }
  function voice(type){
    var ctx=ensureCtx(); if(!ctx)return;
    var t=ctx.currentTime;
    if(type===3){ /* 뮤트: 짧은 노이즈 버스트 */
      var bufSize=ctx.sampleRate*0.05;
      var buf=ctx.createBuffer(1,bufSize,ctx.sampleRate);
      var data=buf.getChannelData(0);
      for(var i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/bufSize,2);
      var src=ctx.createBufferSource(); src.buffer=buf;
      var bp2=ctx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=2500; bp2.Q.value=1.2;
      var g=ctx.createGain(); g.gain.setValueAtTime(0.35,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05);
      src.connect(bp2); bp2.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t+0.06);
      return;
    }
    /* 다운/업: 화음성 톤 (여러 오실레이터). 다운은 낮은 기음 + 길게, 업은 높고 짧게 */
    var freqs = type===1 ? [196,294,392] : [392,494,587]; /* G3코드성 / 높은쪽 */
    var dur = type===1 ? 0.18 : 0.10;
    var peak = type===1 ? 0.22 : 0.15;
    freqs.forEach(function(f,idx){
      var o=ctx.createOscillator(); o.type="triangle"; o.frequency.value=f;
      var g=ctx.createGain();
      var startT=t+idx*0.006; /* 스트럼 느낌: 현마다 미세 시차 */
      g.gain.setValueAtTime(0.0001,startT);
      g.gain.exponentialRampToValueAtTime(peak,startT+0.004);
      g.gain.exponentialRampToValueAtTime(0.0001,startT+dur);
      o.connect(g); g.connect(ctx.destination); o.start(startT); o.stop(startT+dur+0.02);
    });
  }
  function start(grid){
    var ctx=ensureCtx(); if(ctx&&ctx.state==="suspended"){try{ctx.resume();}catch(e){}}
    gridRef.current=grid; setPlaying(true); stepRef.current=0;
    function tick(){
      var s=stepRef.current%16; var v=gridRef.current[s]||0;
      if(v>0) voice(v);
      setStep(s); stepRef.current++;
      timerRef.current=setTimeout(tick,(60000/bpmRef.current)/4);
    }
    tick();
  }
  function stop(){ setPlaying(false); if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;} setStep(-1); stepRef.current=0; }
  useEffect(function(){ return function(){ if(timerRef.current) clearTimeout(timerRef.current); }; },[]);
  return {playing:playing,bpm:bpm,setBpm:setBpm,step:step,
    toggle:function(g){ if(playing)stop(); else start(g); }, stop:stop, setGrid:function(g){gridRef.current=g;}};
}

/* 스트럼 그리드 시각화 (D/U/X 화살표, 16분 4박 그룹) */
function StrumViz(props){
  var grid=props.grid; var playStep=props.playStep;
  var sym=["","\u2193","\u2191","\u2715"]; /* 0쉼 1다운 2업 3뮤트 */
  return e("div",{className:"rhythm-viz"},
    [0,1,2,3].map(function(gi){
      return e("div",{key:gi,className:"beat-group"},
        e("span",{className:"beat-label"},(gi+1)+"박"),
        [0,1,2,3].map(function(ci){
          var idx=gi*4+ci; var v=grid[idx]||0;
          var cls="cell16"+(v===1?" hit":v===2?" weak":v===3?" mute":"")+(playStep===idx?" play":"");
          return e("div",{key:ci,className:cls,style:{fontSize:"15px",alignItems:"center",paddingBottom:"0"}}, sym[v]);
        })
      );
    })
  );
}

/* 스트로크/커팅 공용 섹션 컴포넌트 */
function StrumSection(props){
  var engine=useStrumEngine();
  var examples=props.examples;
  var sel=useState(0); var idx=sel[0]; var setIdx=sel[1];
  var ex=examples[idx];
  return e("div",{className:"card"},
    e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}},
      e("div",{className:"sec-label",style:{color:props.color}}, props.icon+" "+props.title),
      e("span",{style:{fontSize:"12px",color:"#8a92b0"}},"\u2193 다운 · \u2191 업 · \u2715 뮤트 커팅")
    ),
    /* 예제 선택 */
    e("div",{className:"pat-grid",style:{marginTop:"8px"}},
      examples.map(function(p,i){
        return e("div",{key:i,className:"pat-card"+(idx===i?" on":""),
          onClick:function(){ setIdx(i); if(engine.playing) engine.setGrid(p.g); }},
          e("span",{className:"pname"},p.name),
          e("span",{className:"diff-dots"}, Array.apply(null,{length:p.diff}).map(function(_,k){
            return e("div",{key:k,className:"diff-dot"});
          }))
        );
      })
    ),
    /* 현재 예제 시각화 */
    e("div",{style:{fontWeight:"800",color:props.color,fontSize:"15px",marginTop:"12px"}}, ex.name),
    e("div",{style:{fontSize:"12px",color:"#8a92b0",marginBottom:"2px"}}, ex.desc),
    e(StrumViz,{grid:ex.g, playStep:engine.step}),
    e("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}},
      e("button",{className:"step-btn",onClick:function(){ engine.setBpm(Math.max(30,engine.bpm-5)); }},"-5"),
      e("div",{className:"bpm-val",style:{color:props.color}},engine.bpm),
      e("button",{className:"step-btn",onClick:function(){ engine.setBpm(Math.min(240,engine.bpm+5)); }},"+5"),
      e("input",{type:"range",className:"slider",min:30,max:240,value:engine.bpm,
        onChange:function(ev){ engine.setBpm(parseInt(ev.target.value,10)); }}),
      e("button",{className:"play-btn"+(engine.playing?" playing":""),
        onClick:function(){ engine.toggle(ex.g); }}, engine.playing?"\u25A0 정지":"\u25B6 재생")
    )
  );
}

function RhythmChallenge(props){
  var diffState=useState("Medium"); var diff=diffState[0]; var setDiff=diffState[1];
  var intState=useState(2); var interval=intState[0]; var setInterval2=intState[1];
  var runState=useState(false); var running=runState[0]; var setRunning=runState[1];
  var patState=useState([]); var pattern=patState[0]; var setPattern=patState[1];
  var nextState=useState([]); var nextPat=nextState[0]; var setNextPat=nextState[1];
  var posState=useState(-1); var pos=posState[0]; var setPos=posState[1];
  var metroRef=useRef(null); var beatRef=useRef(0);
  var intRef=useRef(2); intRef.current=interval;
  var diffRef=useRef("Medium"); diffRef.current=diff;
  var ctxRef=useRef(null);

  function genPattern(){
    var len=8; /* 8분음표 8개 */
    var pool=diffRef.current==="Easy"?[0,0,3]:diffRef.current==="Medium"?[0,1,3]:[0,1,2,3];
    var arr=[];
    for(var i=0;i<len;i++){
      if(i===0){ arr.push(0); } /* 첫박은 다운 */
      else arr.push(pool[Math.floor(Math.random()*pool.length)]);
    }
    return arr;
  }
  function ensureCtx(){ if(!ctxRef.current){try{ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();}catch(e){ctxRef.current=null;}} return ctxRef.current; }
  function click(accent){
    var ctx=ensureCtx(); if(!ctx)return;
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.frequency.value=accent?1320:880;
    g.gain.setValueAtTime(0.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4,ctx.currentTime+0.001);
    g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.05);
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.06);
  }
  function start(){
    var ctx=ensureCtx(); if(ctx&&ctx.state==="suspended"){try{ctx.resume();}catch(e){}}
    setRunning(true);
    var p=genPattern(); setPattern(p); setNextPat(genPattern());
    beatRef.current=0;
    var bpm=props.bpm;
    function tick(){
      var halfBeat=beatRef.current%8; /* 8분음표 단위 */
      click(halfBeat===0);
      setPos(halfBeat);
      beatRef.current++;
      /* interval 마디 = interval*8 8분음표마다 패턴 교체 */
      if(beatRef.current % (intRef.current*8) === 0){
        setPattern(function(prev){ return window.__nextPat||genPattern(); });
        setNextPat(genPattern());
      }
      metroRef.current=setTimeout(tick, (60000/bpm)/2); /* 8분음표 간격 */
    }
    tick();
  }
  function stop(){ setRunning(false); if(metroRef.current){clearTimeout(metroRef.current);metroRef.current=null;} setPos(-1); }
  useEffect(function(){ return function(){ if(metroRef.current) clearTimeout(metroRef.current); }; },[]);
  /* nextPat을 전역에 보관해 클로저 문제 회피 */
  useEffect(function(){ window.__nextPat=nextPat; },[nextPat]);

  return e("div",{className:"card"},
    e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}},
      e("div",{className:"sec-label",style:{color:"var(--orange)"}},"\u26A1 리듬 챌린지"),
      e("span",{style:{fontSize:"12px",color:"#8a92b0"}},"랜덤 스트럼 패턴 즉흥 연주")
    ),
    e("div",{style:{display:"flex",gap:"8px",alignItems:"center",margin:"10px 0",flexWrap:"wrap"}},
      ["Easy","Medium","Hard"].map(function(d){
        return e("button",{key:d,className:"mini-btn"+(diff===d?" on":""),
          onClick:function(){ if(!running) setDiff(d); }},d);
      }),
      e("span",{style:{color:"#8a92b0",fontWeight:"700",marginLeft:"8px"}},"전환:"),
      [1,2,4].map(function(b){
        return e("button",{key:b,className:"mini-btn"+(interval===b?" on":""),
          onClick:function(){ if(!running) setInterval2(b); }},b+"마디");
      })
    ),
    running ? e("div",null,
      e("div",{className:"chal-strum"},
        pattern.map(function(v,i){
          return e("div",{key:i,className:"strum-box"+(pos===i?" play":"")}, STRUM[v]);
        })
      ),
      e("div",{className:"next-chord",style:{textAlign:"center"}},"다음 패턴 예고: "+
        nextPat.map(function(v){return STRUM[v];}).join(" "))
    ) : e("div",{style:{textAlign:"center",color:"#8a92b0",padding:"16px"}},
      "↓ 다운 · ↑ 업 · ✕ 뮤트 · — 쉼  — 시작을 누르면 랜덤 패턴이 나옵니다"),
    e("button",{className:"big-btn rhythm",onClick:function(){ if(running)stop(); else start(); }},
      running?"\u25A0 정지":"\u26A1 리듬 챌린지 시작")
  );
}

function RhythmTab(){
  var engine=useRhythmEngine();
  var sel=useState(0); var patIdx=sel[0]; var setPatIdx=sel[1];
  var pattern=RHYTHM_PATTERNS[patIdx];

  function patternCards(){
    return e("div",{className:"pat-grid"},
      RHYTHM_PATTERNS.map(function(p,i){
        return e("div",{key:i,className:"pat-card"+(patIdx===i?" on":""),
          onClick:function(){ setPatIdx(i); if(engine.playing){ engine.setGrid(p.grid); } }},
          e("span",{className:"pname"},p.name),
          e("span",{className:"diff-dots"}, Array.apply(null,{length:p.diff}).map(function(_,k){
            return e("div",{key:k,className:"diff-dot"});
          }))
        );
      })
    );
  }
  function randomPick(synco){
    var pool=RHYTHM_PATTERNS.map(function(p,i){return i;});
    if(synco) pool=[2,3,4,5,7,8]; /* 싱커페이션 계열 */
    var i=pool[Math.floor(Math.random()*pool.length)];
    setPatIdx(i); if(engine.playing) engine.setGrid(RHYTHM_PATTERNS[i].grid);
  }
  function setBpm(v){ engine.setBpm(Math.max(30,Math.min(240,v))); }

  return e("div",null,
    /* 패턴 선택 */
    e("div",{className:"card"},
      e("div",{className:"sec-label"},"패턴 선택"),
      patternCards(),
      e("div",{className:"rand-row"},
        e("button",{className:"rand-btn",onClick:function(){randomPick(false);}},"\uD83C\uDFB2 랜덤 패턴"),
        e("button",{className:"rand-btn purple",onClick:function(){randomPick(true);}},"\u26A1 싱커페이션 랜덤")
      )
    ),
    /* 현재 패턴 시각화 + 재생 */
    e("div",{className:"card"},
      e("div",{style:{fontWeight:"800",color:"var(--green)",fontSize:"16px"}},pattern.name),
      e("div",{style:{fontSize:"12px",color:"#8a92b0"}},"난이도 "+
        Array.apply(null,{length:pattern.diff}).map(function(){return "\u25CF";}).join("")+" · 4/4박자 · 16분음표 그리드"),
      e(RhythmViz,{grid:pattern.grid, playStep:engine.step}),
      e("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}},
        e("button",{className:"step-btn",onClick:function(){setBpm(engine.bpm-5);}},"-5"),
        e("div",{className:"bpm-val",style:{color:"var(--purple)"}},engine.bpm),
        e("button",{className:"step-btn",onClick:function(){setBpm(engine.bpm+5);}},"+5"),
        e("input",{type:"range",className:"slider",min:30,max:240,value:engine.bpm,
          onChange:function(ev){setBpm(parseInt(ev.target.value,10));}}),
        e("button",{className:"play-btn"+(engine.playing?" playing":""),
          onClick:function(){ engine.toggle(pattern.grid); }}, engine.playing?"\u25A0 정지":"\u25B6 재생")
      )
    ),
    /* Tap Tempo */
    e(TapTempo,{onApply:function(bpm){ setBpm(bpm); }}),
    /* 커스텀 패턴 */
    e(CustomPatternBuilder,{onPlay:function(grid){ engine.toggle(grid); }}),
    /* 리듬 챌린지 */
    e(RhythmChallenge,{bpm:engine.bpm}),
    /* 스트로크 예제 */
    e(StrumSection,{examples:STROKE_EXAMPLES, title:"스트로크 예제", icon:"\uD83E\uDD41", color:"var(--indigo)"}),
    /* 펑크 리듬 커팅 */
    e(StrumSection,{examples:FUNK_CUTTING, title:"펑크 리듬 커팅", icon:"\uD83C\uDFB8", color:"var(--purple)"}),
    /* 싱커페이션 팁 */
    e("div",{className:"card"},
      e("div",{className:"tip-box"},
        e("span",{className:"th"},"\uD83D\uDCA1 싱커페이션 팁"),
        e("div",null,"1. BPM 60 이하로 시작 — 패턴 구조 파악"),
        e("div",null,"2. 발로 다운비트 탭 → 오프비트 자연스럽게"),
        e("div",null,"3. '따-라-라-따' 음절화 후 연주"),
        e("div",null,"4. 마스터 후 BPM 10씩 올리기")
      )
    )
  );
}

/* ---------------- 탭 4: 플레이어 ---------------- */

export { RhythmTab };
=======
import React from 'react';
import { useState, useRef, useEffect } from 'react';
const e = React.createElement;

var RHYTHM_PATTERNS = [
  {name:"기본 4/4", diff:1, grid:[1,0,0,0, 2,0,0,0, 2,0,0,0, 2,0,0,0]},
  {name:"8분 스트레이트", diff:1, grid:[1,0,2,0, 2,0,2,0, 2,0,2,0, 2,0,2,0]},
  {name:"싱커페이션 기본", diff:2, grid:[1,0,0,2, 0,0,2,0, 2,0,0,2, 0,0,2,0]},
  {name:"반박 강조", diff:2, grid:[1,0,2,2, 2,0,2,2, 2,0,2,2, 2,0,2,2]},
  {name:"싱커페이션 심화", diff:3, grid:[1,0,2,0, 0,2,0,2, 2,0,0,2, 0,2,0,0]},
  {name:"타이 반박자", diff:3, grid:[1,0,0,2, 2,0,0,2, 2,0,0,2, 2,0,0,0]},
  {name:"오프비트 셋잇단", diff:3, grid:[1,0,2,0, 2,0,2,0, 0,2,0,2, 0,2,0,2]},
  {name:"16분 싱커페이션", diff:4, grid:[1,2,0,2, 2,0,2,2, 0,2,2,0, 2,0,2,2]},
  {name:"헤미올라", diff:4, grid:[1,0,0,2, 0,0,2,0, 0,2,0,0, 2,0,0,2]},
  {name:"펑크 그루브", diff:4, grid:[1,0,2,0, 0,2,2,0, 2,0,0,2, 0,2,0,2]}
];

/* 단순 16분 시퀀서 (리듬용 독립 엔진) */
function useRhythmEngine(){
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var bp=useState(80); var bpm=bp[0]; var setBpm=bp[1];
  var st=useState(-1); var step=st[0]; var setStep=st[1];
  var timerRef=useRef(null); var stepRef=useRef(0);
  var bpmRef=useRef(80); bpmRef.current=bpm;
  var gridRef=useRef([]);
  var ctxRef=useRef(null);
  function ensureCtx(){ if(!ctxRef.current){ try{ctxRef.current=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ctxRef.current=null;} } return ctxRef.current; }
  function click(type){
    var ctx=ensureCtx(); if(!ctx) return;
    var osc=ctx.createOscillator(); var g=ctx.createGain();
    osc.frequency.value = type===1?1320:(type===2?880:660);
    g.gain.setValueAtTime(0.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(type===1?0.5:0.3,ctx.currentTime+0.001);
    g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.05);
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.06);
  }
  function start(grid){
    var ctx=ensureCtx(); if(ctx&&ctx.state==="suspended"){try{ctx.resume();}catch(e){}}
    gridRef.current=grid; setPlaying(true); stepRef.current=0;
    function tick(){
      var s=stepRef.current%16;
      var v=gridRef.current[s]||0;
      if(v>0) click(v);
      setStep(s);
      stepRef.current++;
      timerRef.current=setTimeout(tick, (60000/bpmRef.current)/4); /* 16분 간격 */
    }
    tick();
  }
  function stop(){ setPlaying(false); if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;} setStep(-1); stepRef.current=0; }
  useEffect(function(){ return function(){ if(timerRef.current) clearTimeout(timerRef.current); }; },[]);
  return {playing:playing,bpm:bpm,setBpm:setBpm,step:step,
    toggle:function(grid){ if(playing) stop(); else start(grid); }, stop:stop, setGrid:function(g){gridRef.current=g;}};
}

/* 16분 그리드 시각화 */
function RhythmViz(props){
  var grid=props.grid; var playStep=props.playStep;
  var groups=[0,1,2,3];
  return e("div",{className:"rhythm-viz"},
    groups.map(function(gi){
      return e("div",{key:gi,className:"beat-group"},
        e("span",{className:"beat-label"},(gi+1)+"박"),
        [0,1,2,3].map(function(ci){
          var idx=gi*4+ci; var v=grid[idx]||0;
          var cls="cell16"+(v===1?" hit":v===2?" weak":"")+(playStep===idx?" play":"");
          return e("div",{key:ci,className:cls}, v>0?(v===1?"강":"약"):"");
        })
      );
    })
  );
}

/* Tap Tempo */
function TapTempo(props){
  var taps=useRef([]); 
  var bpmState=useState(0); var tapBpm=bpmState[0]; var setTapBpm=bpmState[1];
  var dotState=useState(0); var dotCount=dotState[0]; var setDotCount=dotState[1];
  var resetRef=useRef(null);
  function tap(){
    var now=Date.now();
    if(resetRef.current) clearTimeout(resetRef.current);
    taps.current.push(now);
    if(taps.current.length>8) taps.current.shift();
    if(taps.current.length>=2){
      var intervals=[];
      for(var i=1;i<taps.current.length;i++) intervals.push(taps.current[i]-taps.current[i-1]);
      var avg=intervals.reduce(function(a,b){return a+b;},0)/intervals.length;
      setTapBpm(Math.round(60000/avg));
    }
    setDotCount(taps.current.length);
    resetRef.current=setTimeout(function(){ taps.current=[]; setDotCount(0); },2500);
  }
  return e("div",{className:"card"},
    e("div",{className:"sec-label"},"\uD83D\uDC46 TAP TEMPO"),
    e("div",{style:{display:"flex",alignItems:"center",gap:"24px",flexWrap:"wrap"}},
      e("button",{className:"tap-circle",onClick:tap}, tapBpm>0?tapBpm:"TAP"),
      e("div",null,
        e("div",{style:{fontSize:"13px",color:"#8a92b0"}}, tapBpm>0?(tapBpm+" BPM"):"버튼을 박자에 맞춰 탭하세요"),
        e("div",{className:"tap-dots"}, Array.apply(null,{length:dotCount}).map(function(_,i){
          return e("div",{key:i,className:"tap-dot"});
        })),
        tapBpm>0 ? e("button",{className:"mini-btn",style:{marginTop:"10px"},
          onClick:function(){ props.onApply(tapBpm); }},"\u2192 리듬 BPM에 적용") : null
      )
    )
  );
}

/* 커스텀 패턴 빌더 */
function loadCustomPatterns(){ try{var r=localStorage.getItem("gtr_custpat"); return r?JSON.parse(r):[];}catch(e){return [];} }
function saveCustomPatterns(arr){ try{localStorage.setItem("gtr_custpat",JSON.stringify(arr.slice(0,8)));}catch(e){} }

function CustomPatternBuilder(props){
  var gs=useState(function(){ var a=[]; for(var i=0;i<16;i++) a.push(0); return a; });
  var grid=gs[0]; var setGrid=gs[1];
  var nm=useState("My Pattern"); var name=nm[0]; var setName=nm[1];
  var sv=useState(loadCustomPatterns()); var saved=sv[0]; var setSaved=sv[1];
  function cycle(i){
    var ng=grid.slice(); ng[i]=(ng[i]+1)%3; setGrid(ng);
  }
  function save(){
    if(grid.every(function(x){return x===0;})) { alert("패턴이 비어있습니다"); return; }
    var arr=saved.slice(); arr.unshift({name:name,grid:grid.slice(),ts:Date.now()});
    arr=arr.slice(0,8); saveCustomPatterns(arr); setSaved(arr);
    alert("저장됨: "+name);
  }
  function del(ts){ var arr=saved.filter(function(p){return p.ts!==ts;}); saveCustomPatterns(arr); setSaved(arr); }
  function reset(){ var a=[]; for(var i=0;i<16;i++)a.push(0); setGrid(a); }
  return e("div",{className:"card"},
    e("div",{className:"sec-label"},"\uD83C\uDF9B 커스텀 패턴"),
    e("div",{style:{fontSize:"13px",color:"#8a92b0",marginBottom:"4px"}},"클릭 → 무음 → 강박(파랑) → 약박(주황)"),
    e("div",{className:"cust-grid"},
      grid.map(function(v,i){
        var cls="cust-cell"+(v===1?" strong":v===2?" weak":"");
        return e("div",{key:i,className:cls,onClick:function(){cycle(i);}},
          (i%4===0)?((i/4+1)+"박"):"");
      })
    ),
    e("div",{style:{display:"flex",gap:"8px",marginTop:"8px",flexWrap:"wrap"}},
      e("input",{className:"memo-in",value:name,onChange:function(ev){setName(ev.target.value);}}),
      e("button",{className:"save-btn",onClick:save},"저장"),
      e("button",{className:"mini-btn",onClick:reset},"초기화"),
      e("button",{className:"mini-btn",onClick:function(){props.onPlay(grid);}},"\u25B6 듣기")
    ),
    saved.length>0 ? e("div",{style:{marginTop:"12px"}},
      saved.map(function(p){
        return e("div",{key:p.ts,style:{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"8px 0",borderTop:"1px solid #eef0ff"}},
          e("span",{style:{fontWeight:"700"}},p.name),
          e("span",null,
            e("button",{className:"mini-btn",onClick:function(){props.onPlay(p.grid);}},"\u25B6"),
            e("button",{className:"mini-btn",style:{marginLeft:"6px"},onClick:function(){del(p.ts);}},"\u00D7")
          )
        );
      })
    ) : null
  );
}

/* 리듬 챌린지 */
var STRUM=["\u2193","\u2191","\u2715","\u2014"]; /* 다운/업/뮤트/쉼 */

/* =========================================================================
   스트로크/커팅 예제 — 16분음표 16칸. 값: 0=쉼, 1=다운(D), 2=업(U), 3=뮤트(X)
   ========================================================================= */
/* 스트로크 예제 (어쿠스틱/통기타 정석 패턴) */
var STROKE_EXAMPLES = [
  {name:"8비트 기본", diff:1, desc:"D - D U - U D U", g:[1,0,0,0, 1,0,2,0, 0,0,2,0, 1,0,2,0]},
  {name:"올다운 8비트", diff:1, desc:"강한 8비트 다운", g:[1,0,2,0, 1,0,2,0, 1,0,2,0, 1,0,2,0]},
  {name:"발라드 기본", diff:1, desc:"D - - U - U D U", g:[1,0,0,0, 0,0,2,0, 0,0,2,0, 1,0,2,0]},
  {name:"컨트리/포크", diff:2, desc:"베이스+스트럼 느낌", g:[1,0,2,0, 0,0,2,0, 1,0,2,0, 0,0,2,0]},
  {name:"보사노바 느낌", diff:2, desc:"당김음 스트럼", g:[1,0,0,2, 0,0,2,0, 0,2,0,0, 2,0,0,2]},
  {name:"레게 오프비트", diff:2, desc:"업비트만 강조", g:[0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0]},
  {name:"16비트 스트럼", diff:3, desc:"D U D U 16분", g:[1,2,1,2, 1,2,1,2, 1,2,1,2, 1,2,1,2]},
  {name:"싱커페이션 팝", diff:3, desc:"당김 들어간 팝", g:[1,0,2,0, 0,2,0,2, 1,0,0,2, 0,2,0,2]}
];
/* 펑크 커팅 예제 (16분 유지 + 뮤트, 커팅 그루브) */
var FUNK_CUTTING = [
  {name:"기본 16분 커팅", diff:2, desc:"D U 유지, 1·3박만 발음 나머지 뮤트", g:[1,2,3,2, 3,2,1,2, 3,2,1,2, 3,2,3,2]},
  {name:"나일 로저스 풍", diff:3, desc:"고스트 스트로크 그루브", g:[3,2,1,2, 3,3,1,2, 3,2,3,2, 1,3,3,2]},
  {name:"원노트 펑크", diff:3, desc:"16분 손은 유지, 발음 최소", g:[1,3,3,3, 3,3,1,3, 3,3,1,3, 3,3,3,3]},
  {name:"오프비트 펑크", diff:4, desc:"업비트 발음 강조", g:[3,1,3,2, 3,1,3,2, 3,1,3,2, 3,1,3,2]},
  {name:"제임스 브라운 풍", diff:4, desc:"강한 1박 + 커팅", g:[1,3,3,2, 3,2,3,3, 1,3,1,2, 3,3,3,2]},
  {name:"디스코 펑크", diff:4, desc:"16분 풀 커팅 그루브", g:[1,2,3,2, 1,2,3,2, 3,2,1,2, 3,2,1,2]}
];

/* 스트럼 음색 재생 (다운=낮고 풍성 / 업=높고 가벼움 / 뮤트=짧은 노이즈성) */
function useStrumEngine(){
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var bp=useState(80); var bpm=bp[0]; var setBpm=bp[1];
  var st=useState(-1); var step=st[0]; var setStep=st[1];
  var timerRef=useRef(null); var stepRef=useRef(0); var gridRef=useRef([]);
  var bpmRef=useRef(80); bpmRef.current=bpm;
  var ctxRef=useRef(null);
  function ensureCtx(){ if(!ctxRef.current){try{ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();}catch(e){ctxRef.current=null;}} return ctxRef.current; }
  function voice(type){
    var ctx=ensureCtx(); if(!ctx)return;
    var t=ctx.currentTime;
    if(type===3){ /* 뮤트: 짧은 노이즈 버스트 */
      var bufSize=ctx.sampleRate*0.05;
      var buf=ctx.createBuffer(1,bufSize,ctx.sampleRate);
      var data=buf.getChannelData(0);
      for(var i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/bufSize,2);
      var src=ctx.createBufferSource(); src.buffer=buf;
      var bp2=ctx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=2500; bp2.Q.value=1.2;
      var g=ctx.createGain(); g.gain.setValueAtTime(0.35,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05);
      src.connect(bp2); bp2.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t+0.06);
      return;
    }
    /* 다운/업: 화음성 톤 (여러 오실레이터). 다운은 낮은 기음 + 길게, 업은 높고 짧게 */
    var freqs = type===1 ? [196,294,392] : [392,494,587]; /* G3코드성 / 높은쪽 */
    var dur = type===1 ? 0.18 : 0.10;
    var peak = type===1 ? 0.22 : 0.15;
    freqs.forEach(function(f,idx){
      var o=ctx.createOscillator(); o.type="triangle"; o.frequency.value=f;
      var g=ctx.createGain();
      var startT=t+idx*0.006; /* 스트럼 느낌: 현마다 미세 시차 */
      g.gain.setValueAtTime(0.0001,startT);
      g.gain.exponentialRampToValueAtTime(peak,startT+0.004);
      g.gain.exponentialRampToValueAtTime(0.0001,startT+dur);
      o.connect(g); g.connect(ctx.destination); o.start(startT); o.stop(startT+dur+0.02);
    });
  }
  function start(grid){
    var ctx=ensureCtx(); if(ctx&&ctx.state==="suspended"){try{ctx.resume();}catch(e){}}
    gridRef.current=grid; setPlaying(true); stepRef.current=0;
    function tick(){
      var s=stepRef.current%16; var v=gridRef.current[s]||0;
      if(v>0) voice(v);
      setStep(s); stepRef.current++;
      timerRef.current=setTimeout(tick,(60000/bpmRef.current)/4);
    }
    tick();
  }
  function stop(){ setPlaying(false); if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;} setStep(-1); stepRef.current=0; }
  useEffect(function(){ return function(){ if(timerRef.current) clearTimeout(timerRef.current); }; },[]);
  return {playing:playing,bpm:bpm,setBpm:setBpm,step:step,
    toggle:function(g){ if(playing)stop(); else start(g); }, stop:stop, setGrid:function(g){gridRef.current=g;}};
}

/* 스트럼 그리드 시각화 (D/U/X 화살표, 16분 4박 그룹) */
function StrumViz(props){
  var grid=props.grid; var playStep=props.playStep;
  var sym=["","\u2193","\u2191","\u2715"]; /* 0쉼 1다운 2업 3뮤트 */
  return e("div",{className:"rhythm-viz"},
    [0,1,2,3].map(function(gi){
      return e("div",{key:gi,className:"beat-group"},
        e("span",{className:"beat-label"},(gi+1)+"박"),
        [0,1,2,3].map(function(ci){
          var idx=gi*4+ci; var v=grid[idx]||0;
          var cls="cell16"+(v===1?" hit":v===2?" weak":v===3?" mute":"")+(playStep===idx?" play":"");
          return e("div",{key:ci,className:cls,style:{fontSize:"15px",alignItems:"center",paddingBottom:"0"}}, sym[v]);
        })
      );
    })
  );
}

/* 스트로크/커팅 공용 섹션 컴포넌트 */
function StrumSection(props){
  var engine=useStrumEngine();
  var examples=props.examples;
  var sel=useState(0); var idx=sel[0]; var setIdx=sel[1];
  var ex=examples[idx];
  return e("div",{className:"card"},
    e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}},
      e("div",{className:"sec-label",style:{color:props.color}}, props.icon+" "+props.title),
      e("span",{style:{fontSize:"12px",color:"#8a92b0"}},"\u2193 다운 · \u2191 업 · \u2715 뮤트 커팅")
    ),
    /* 예제 선택 */
    e("div",{className:"pat-grid",style:{marginTop:"8px"}},
      examples.map(function(p,i){
        return e("div",{key:i,className:"pat-card"+(idx===i?" on":""),
          onClick:function(){ setIdx(i); if(engine.playing) engine.setGrid(p.g); }},
          e("span",{className:"pname"},p.name),
          e("span",{className:"diff-dots"}, Array.apply(null,{length:p.diff}).map(function(_,k){
            return e("div",{key:k,className:"diff-dot"});
          }))
        );
      })
    ),
    /* 현재 예제 시각화 */
    e("div",{style:{fontWeight:"800",color:props.color,fontSize:"15px",marginTop:"12px"}}, ex.name),
    e("div",{style:{fontSize:"12px",color:"#8a92b0",marginBottom:"2px"}}, ex.desc),
    e(StrumViz,{grid:ex.g, playStep:engine.step}),
    e("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}},
      e("button",{className:"step-btn",onClick:function(){ engine.setBpm(Math.max(30,engine.bpm-5)); }},"-5"),
      e("div",{className:"bpm-val",style:{color:props.color}},engine.bpm),
      e("button",{className:"step-btn",onClick:function(){ engine.setBpm(Math.min(240,engine.bpm+5)); }},"+5"),
      e("input",{type:"range",className:"slider",min:30,max:240,value:engine.bpm,
        onChange:function(ev){ engine.setBpm(parseInt(ev.target.value,10)); }}),
      e("button",{className:"play-btn"+(engine.playing?" playing":""),
        onClick:function(){ engine.toggle(ex.g); }}, engine.playing?"\u25A0 정지":"\u25B6 재생")
    )
  );
}

function RhythmChallenge(props){
  var diffState=useState("Medium"); var diff=diffState[0]; var setDiff=diffState[1];
  var intState=useState(2); var interval=intState[0]; var setInterval2=intState[1];
  var runState=useState(false); var running=runState[0]; var setRunning=runState[1];
  var patState=useState([]); var pattern=patState[0]; var setPattern=patState[1];
  var nextState=useState([]); var nextPat=nextState[0]; var setNextPat=nextState[1];
  var posState=useState(-1); var pos=posState[0]; var setPos=posState[1];
  var metroRef=useRef(null); var beatRef=useRef(0);
  var intRef=useRef(2); intRef.current=interval;
  var diffRef=useRef("Medium"); diffRef.current=diff;
  var ctxRef=useRef(null);

  function genPattern(){
    var len=8; /* 8분음표 8개 */
    var pool=diffRef.current==="Easy"?[0,0,3]:diffRef.current==="Medium"?[0,1,3]:[0,1,2,3];
    var arr=[];
    for(var i=0;i<len;i++){
      if(i===0){ arr.push(0); } /* 첫박은 다운 */
      else arr.push(pool[Math.floor(Math.random()*pool.length)]);
    }
    return arr;
  }
  function ensureCtx(){ if(!ctxRef.current){try{ctxRef.current=new(window.AudioContext||window.webkitAudioContext)();}catch(e){ctxRef.current=null;}} return ctxRef.current; }
  function click(accent){
    var ctx=ensureCtx(); if(!ctx)return;
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.frequency.value=accent?1320:880;
    g.gain.setValueAtTime(0.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4,ctx.currentTime+0.001);
    g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.05);
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.06);
  }
  function start(){
    var ctx=ensureCtx(); if(ctx&&ctx.state==="suspended"){try{ctx.resume();}catch(e){}}
    setRunning(true);
    var p=genPattern(); setPattern(p); setNextPat(genPattern());
    beatRef.current=0;
    var bpm=props.bpm;
    function tick(){
      var halfBeat=beatRef.current%8; /* 8분음표 단위 */
      click(halfBeat===0);
      setPos(halfBeat);
      beatRef.current++;
      /* interval 마디 = interval*8 8분음표마다 패턴 교체 */
      if(beatRef.current % (intRef.current*8) === 0){
        setPattern(function(prev){ return window.__nextPat||genPattern(); });
        setNextPat(genPattern());
      }
      metroRef.current=setTimeout(tick, (60000/bpm)/2); /* 8분음표 간격 */
    }
    tick();
  }
  function stop(){ setRunning(false); if(metroRef.current){clearTimeout(metroRef.current);metroRef.current=null;} setPos(-1); }
  useEffect(function(){ return function(){ if(metroRef.current) clearTimeout(metroRef.current); }; },[]);
  /* nextPat을 전역에 보관해 클로저 문제 회피 */
  useEffect(function(){ window.__nextPat=nextPat; },[nextPat]);

  return e("div",{className:"card"},
    e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}},
      e("div",{className:"sec-label",style:{color:"var(--orange)"}},"\u26A1 리듬 챌린지"),
      e("span",{style:{fontSize:"12px",color:"#8a92b0"}},"랜덤 스트럼 패턴 즉흥 연주")
    ),
    e("div",{style:{display:"flex",gap:"8px",alignItems:"center",margin:"10px 0",flexWrap:"wrap"}},
      ["Easy","Medium","Hard"].map(function(d){
        return e("button",{key:d,className:"mini-btn"+(diff===d?" on":""),
          onClick:function(){ if(!running) setDiff(d); }},d);
      }),
      e("span",{style:{color:"#8a92b0",fontWeight:"700",marginLeft:"8px"}},"전환:"),
      [1,2,4].map(function(b){
        return e("button",{key:b,className:"mini-btn"+(interval===b?" on":""),
          onClick:function(){ if(!running) setInterval2(b); }},b+"마디");
      })
    ),
    running ? e("div",null,
      e("div",{className:"chal-strum"},
        pattern.map(function(v,i){
          return e("div",{key:i,className:"strum-box"+(pos===i?" play":"")}, STRUM[v]);
        })
      ),
      e("div",{className:"next-chord",style:{textAlign:"center"}},"다음 패턴 예고: "+
        nextPat.map(function(v){return STRUM[v];}).join(" "))
    ) : e("div",{style:{textAlign:"center",color:"#8a92b0",padding:"16px"}},
      "↓ 다운 · ↑ 업 · ✕ 뮤트 · — 쉼  — 시작을 누르면 랜덤 패턴이 나옵니다"),
    e("button",{className:"big-btn rhythm",onClick:function(){ if(running)stop(); else start(); }},
      running?"\u25A0 정지":"\u26A1 리듬 챌린지 시작")
  );
}

function RhythmTab(){
  var engine=useRhythmEngine();
  var sel=useState(0); var patIdx=sel[0]; var setPatIdx=sel[1];
  var pattern=RHYTHM_PATTERNS[patIdx];

  function patternCards(){
    return e("div",{className:"pat-grid"},
      RHYTHM_PATTERNS.map(function(p,i){
        return e("div",{key:i,className:"pat-card"+(patIdx===i?" on":""),
          onClick:function(){ setPatIdx(i); if(engine.playing){ engine.setGrid(p.grid); } }},
          e("span",{className:"pname"},p.name),
          e("span",{className:"diff-dots"}, Array.apply(null,{length:p.diff}).map(function(_,k){
            return e("div",{key:k,className:"diff-dot"});
          }))
        );
      })
    );
  }
  function randomPick(synco){
    var pool=RHYTHM_PATTERNS.map(function(p,i){return i;});
    if(synco) pool=[2,3,4,5,7,8]; /* 싱커페이션 계열 */
    var i=pool[Math.floor(Math.random()*pool.length)];
    setPatIdx(i); if(engine.playing) engine.setGrid(RHYTHM_PATTERNS[i].grid);
  }
  function setBpm(v){ engine.setBpm(Math.max(30,Math.min(240,v))); }

  return e("div",null,
    /* 패턴 선택 */
    e("div",{className:"card"},
      e("div",{className:"sec-label"},"패턴 선택"),
      patternCards(),
      e("div",{className:"rand-row"},
        e("button",{className:"rand-btn",onClick:function(){randomPick(false);}},"\uD83C\uDFB2 랜덤 패턴"),
        e("button",{className:"rand-btn purple",onClick:function(){randomPick(true);}},"\u26A1 싱커페이션 랜덤")
      )
    ),
    /* 현재 패턴 시각화 + 재생 */
    e("div",{className:"card"},
      e("div",{style:{fontWeight:"800",color:"var(--green)",fontSize:"16px"}},pattern.name),
      e("div",{style:{fontSize:"12px",color:"#8a92b0"}},"난이도 "+
        Array.apply(null,{length:pattern.diff}).map(function(){return "\u25CF";}).join("")+" · 4/4박자 · 16분음표 그리드"),
      e(RhythmViz,{grid:pattern.grid, playStep:engine.step}),
      e("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}},
        e("button",{className:"step-btn",onClick:function(){setBpm(engine.bpm-5);}},"-5"),
        e("div",{className:"bpm-val",style:{color:"var(--purple)"}},engine.bpm),
        e("button",{className:"step-btn",onClick:function(){setBpm(engine.bpm+5);}},"+5"),
        e("input",{type:"range",className:"slider",min:30,max:240,value:engine.bpm,
          onChange:function(ev){setBpm(parseInt(ev.target.value,10));}}),
        e("button",{className:"play-btn"+(engine.playing?" playing":""),
          onClick:function(){ engine.toggle(pattern.grid); }}, engine.playing?"\u25A0 정지":"\u25B6 재생")
      )
    ),
    /* Tap Tempo */
    e(TapTempo,{onApply:function(bpm){ setBpm(bpm); }}),
    /* 커스텀 패턴 */
    e(CustomPatternBuilder,{onPlay:function(grid){ engine.toggle(grid); }}),
    /* 리듬 챌린지 */
    e(RhythmChallenge,{bpm:engine.bpm}),
    /* 스트로크 예제 */
    e(StrumSection,{examples:STROKE_EXAMPLES, title:"스트로크 예제", icon:"\uD83E\uDD41", color:"var(--indigo)"}),
    /* 펑크 리듬 커팅 */
    e(StrumSection,{examples:FUNK_CUTTING, title:"펑크 리듬 커팅", icon:"\uD83C\uDFB8", color:"var(--purple)"}),
    /* 싱커페이션 팁 */
    e("div",{className:"card"},
      e("div",{className:"tip-box"},
        e("span",{className:"th"},"\uD83D\uDCA1 싱커페이션 팁"),
        e("div",null,"1. BPM 60 이하로 시작 — 패턴 구조 파악"),
        e("div",null,"2. 발로 다운비트 탭 → 오프비트 자연스럽게"),
        e("div",null,"3. '따-라-라-따' 음절화 후 연주"),
        e("div",null,"4. 마스터 후 BPM 10씩 올리기")
      )
    )
  );
}

/* ---------------- 탭 4: 플레이어 ---------------- */

export { RhythmTab };
>>>>>>> 2f92f95a7b5d5397a1a4ef0d21b28402df7da544
