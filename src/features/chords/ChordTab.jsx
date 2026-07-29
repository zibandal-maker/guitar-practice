import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { NOTE_NAMES } from '../../lib/theory.js';
import { useMetronome } from '../../lib/metronome.js';
import { MetronomeBar } from '../../ui/MetronomeBar.jsx';
const e = React.createElement;

var CHORD_SHAPES = {
  "C":  {"Major":{f:[-1,3,2,0,1,0],fg:[0,3,2,0,1,0]},"Minor":{f:[-1,3,5,5,4,3],fg:[0,1,3,4,2,1]},"Dom7":{f:[-1,3,2,3,1,0],fg:[0,3,2,4,1,0]},"Major7":{f:[-1,3,2,0,0,0],fg:[0,3,2,0,0,0]},"Minor7":{f:[-1,3,5,3,4,3],fg:[0,1,3,1,2,1]}},
  "G":  {"Major":{f:[3,2,0,0,0,3],fg:[2,1,0,0,0,3]},"Minor":{f:[3,5,5,3,3,3],fg:[1,3,4,1,1,1]},"Dom7":{f:[3,2,0,0,0,1],fg:[3,2,0,0,0,1]},"Major7":{f:[3,2,0,0,0,2],fg:[3,1,0,0,0,2]},"Minor7":{f:[3,5,3,3,3,3],fg:[1,3,1,1,1,1]}},
  "D":  {"Major":{f:[-1,-1,0,2,3,2],fg:[0,0,0,1,3,2]},"Minor":{f:[-1,-1,0,2,3,1],fg:[0,0,0,2,3,1]},"Dom7":{f:[-1,-1,0,2,1,2],fg:[0,0,0,2,1,3]},"Major7":{f:[-1,-1,0,2,2,2],fg:[0,0,0,1,1,1]},"Minor7":{f:[-1,-1,0,2,1,1],fg:[0,0,0,2,1,1]}},
  "A":  {"Major":{f:[-1,0,2,2,2,0],fg:[0,0,1,2,3,0]},"Minor":{f:[-1,0,2,2,1,0],fg:[0,0,2,3,1,0]},"Dom7":{f:[-1,0,2,0,2,0],fg:[0,0,2,0,3,0]},"Major7":{f:[-1,0,2,1,2,0],fg:[0,0,2,1,3,0]},"Minor7":{f:[-1,0,2,0,1,0],fg:[0,0,2,0,1,0]}},
  "E":  {"Major":{f:[0,2,2,1,0,0],fg:[0,2,3,1,0,0]},"Minor":{f:[0,2,2,0,0,0],fg:[0,2,3,0,0,0]},"Dom7":{f:[0,2,0,1,0,0],fg:[0,2,0,1,0,0]},"Major7":{f:[0,2,1,1,0,0],fg:[0,3,1,2,0,0]},"Minor7":{f:[0,2,0,0,0,0],fg:[0,2,0,0,0,0]}},
  "F":  {"Major":{f:[1,3,3,2,1,1],fg:[1,3,4,2,1,1]},"Minor":{f:[1,3,3,1,1,1],fg:[1,3,4,1,1,1]},"Dom7":{f:[1,3,1,2,1,1],fg:[1,3,1,2,1,1]},"Major7":{f:[1,3,2,2,1,0],fg:[1,4,2,3,1,0]},"Minor7":{f:[1,3,1,1,1,1],fg:[1,3,1,1,1,1]}},
  "B":  {"Major":{f:[-1,2,4,4,4,2],fg:[0,1,3,3,3,1]},"Minor":{f:[-1,2,4,4,3,2],fg:[0,1,3,4,2,1]},"Dom7":{f:[-1,2,1,2,0,2],fg:[0,2,1,3,0,4]},"Major7":{f:[-1,2,4,3,4,2],fg:[0,1,3,2,4,1]},"Minor7":{f:[-1,2,4,2,3,2],fg:[0,1,3,1,2,1]}},
  "Bb": {"Major":{f:[-1,1,3,3,3,1],fg:[0,1,3,3,3,1]},"Minor":{f:[-1,1,3,3,2,1],fg:[0,1,3,4,2,1]},"Dom7":{f:[-1,1,3,1,3,1],fg:[0,1,3,1,4,1]},"Major7":{f:[-1,1,3,2,3,1],fg:[0,1,3,2,4,1]},"Minor7":{f:[-1,1,3,1,2,1],fg:[0,1,3,1,2,1]}},
  "Eb": {"Major":{f:[-1,6,5,3,4,3],fg:[0,4,3,1,2,1]},"Minor":{f:[-1,6,4,3,4,2],fg:[0,4,2,1,3,1]},"Dom7":{f:[-1,6,5,6,4,6],fg:[0,2,1,3,1,4]},"Major7":{f:[-1,6,5,3,3,3],fg:[0,4,3,1,1,1]},"Minor7":{f:[-1,6,4,6,4,6],fg:[0,2,1,3,1,4]}},
  "Ab": {"Major":{f:[4,6,6,5,4,4],fg:[1,3,4,2,1,1]},"Minor":{f:[4,6,6,4,4,4],fg:[1,3,4,1,1,1]},"Dom7":{f:[4,6,4,5,4,4],fg:[1,3,1,2,1,1]},"Major7":{f:[4,6,5,5,4,4],fg:[1,4,2,3,1,1]},"Minor7":{f:[4,6,4,4,4,4],fg:[1,3,1,1,1,1]}},
  "Db": {"Major":{f:[-1,4,6,6,6,4],fg:[0,1,3,3,3,1]},"Minor":{f:[-1,4,6,6,5,4],fg:[0,1,3,4,2,1]},"Dom7":{f:[-1,4,6,4,6,4],fg:[0,1,3,1,4,1]},"Major7":{f:[-1,4,6,5,6,4],fg:[0,1,3,2,4,1]},"Minor7":{f:[-1,4,6,4,5,4],fg:[0,1,3,1,2,1]}},
  "F#": {"Major":{f:[2,4,4,3,2,2],fg:[1,3,4,2,1,1]},"Minor":{f:[2,4,4,2,2,2],fg:[1,3,4,1,1,1]},"Dom7":{f:[2,4,2,3,2,2],fg:[1,3,1,2,1,1]},"Major7":{f:[2,4,3,3,2,2],fg:[1,4,2,3,1,1]},"Minor7":{f:[2,4,2,2,2,2],fg:[1,3,1,1,1,1]}}
};
/* 5도권 순서 (시계방향) */
var CIRCLE5 = ["C","G","D","A","E","B","F#","Db","Ab","Eb","Bb","F"];
var CHORD_TYPES = [
  {id:"Major",label:"Major",suffix:""},
  {id:"Minor",label:"Minor",suffix:"m"},
  {id:"Dom7",label:"Dom 7",suffix:"7"},
  {id:"Major7",label:"Major 7",suffix:"maj7"},
  {id:"Minor7",label:"Minor 7",suffix:"m7"}
];
function typeLabelFull(t){ return ({Major:"Major",Minor:"Minor",Dom7:"Dominant 7",Major7:"Major 7",Minor7:"Minor 7"})[t]; }

/* 코드 다이어그램 SVG */
function ChordDiagram(props){
  var shape=props.shape; /* {f:[],fg:[]} 6번줄→1번줄 */
  if(!shape) return e("div",{style:{color:"#8a92b0"}},"운지 정보 없음");
  var W=210, H=240, padL=34, padT=34;
  var nStr=6, nFrets=5;
  var colW=(W-padL-14)/(nStr-1); /* 줄 간격(세로 줄) */
  var rowH=(H-padT-20)/nFrets;   /* 프렛 간격 */
  /* 표시 기준 프렛: 0이 아닌 최소 프렛. 1~ 이면 오픈, 아니면 베이스프렛 표시 */
  var pressed=shape.f.filter(function(x){return x>0;});
  var minF=pressed.length?Math.min.apply(null,pressed):1;
  var maxF=pressed.length?Math.max.apply(null,pressed):1;
  /* 표준 규칙: 최저 누름 프렛이 1이면 오픈 포지션(baseFret=1).
     아니면 윈도우를 최저 프렛에 맞춤. 단 최고 프렛까지 nFrets칸 안에 담기도록 보정 */
  var baseFret;
  if(minF<=1){
    baseFret=1;
  }else{
    baseFret=minF;
    /* 범위가 표시 칸 수를 넘으면 최고 프렛 기준으로 당김 (방어적) */
    if(maxF-baseFret+1>nFrets){ baseFret=maxF-nFrets+1; if(baseFret<1) baseFret=1; }
  }
  var els=[];
  var labels=["E","A","D","G","B","e"]; /* 6번줄→1번줄, 화면 왼→오른쪽 */
  var i;
  /* 세로선(줄) — 왼쪽=6번줄 */
  for(i=0;i<nStr;i++){
    var x=padL+i*colW;
    els.push(e("line",{key:"v"+i,x1:x,y1:padT,x2:x,y2:padT+nFrets*rowH,stroke:"#cfd6ea",strokeWidth:1}));
    els.push(e("text",{key:"vl"+i,x:x,y:padT-10,fontSize:11,fill:"#8a92b0",textAnchor:"middle"},labels[i]));
  }
  /* 가로선(프렛) */
  for(i=0;i<=nFrets;i++){
    var y=padT+i*rowH;
    els.push(e("line",{key:"h"+i,x1:padL,y1:y,x2:padL+(nStr-1)*colW,y2:y,
      stroke:"#cfd6ea",strokeWidth:(i===0&&baseFret===1)?3:1}));
  }
  if(baseFret>1){
    els.push(e("text",{key:"bf",x:padL-22,y:padT+rowH-4,fontSize:11,fill:"#8a92b0"},baseFret+"fr"));
  }
  /* 각 줄 상태 */
  for(i=0;i<nStr;i++){
    var fr=shape.f[i]; var fg=shape.fg[i]; var x2=padL+i*colW;
    if(fr===-1){
      els.push(e("text",{key:"x"+i,x:x2,y:padT-22,fontSize:13,fill:"#ef4444",textAnchor:"middle",fontWeight:"700"},"\u00D7"));
    }else if(fr===0){
      els.push(e("circle",{key:"o"+i,cx:x2,cy:padT-26,r:5,fill:"none",stroke:"#10b981",strokeWidth:2}));
    }else{
      var rowPos=fr-baseFret+1; /* 1-indexed 프렛 칸 */
      var cy=padT+(rowPos-0.5)*rowH;
      var col=(fg===1)?"#5b6ef5":(fg===2)?"#f97316":(fg===3)?"#10b981":"#8b5cf6";
      els.push(e("circle",{key:"p"+i,cx:x2,cy:cy,r:11,fill:col}));
      els.push(e("text",{key:"pt"+i,x:x2,y:cy+4,fontSize:12,fill:"#fff",textAnchor:"middle",fontWeight:"700"},fg||""));
    }
  }
  return e("svg",{viewBox:"0 0 "+W+" "+H,width:"100%",style:{maxWidth:"230px"}},els);
}

/* 5도권 원형 */
function CircleOf5ths(props){
  var sel=props.sel; var onSel=props.onSel;
  var cx=110, cy=110, rOuter=92, rInner=58;
  var els=[];
  CIRCLE5.forEach(function(key,idx){
    var ang=(idx/12)*2*Math.PI - Math.PI/2;
    var x=cx+Math.cos(ang)*((rOuter+rInner)/2);
    var y=cy+Math.sin(ang)*((rOuter+rInner)/2);
    var on=key===sel;
    els.push(e("circle",{key:"c"+key,cx:x,cy:y,r:17,
      fill:on?"#5b6ef5":"#f3f5fb",stroke:on?"#5b6ef5":"#e3e7f2",strokeWidth:1,
      style:{cursor:"pointer"},onClick:function(){onSel(key);}}));
    els.push(e("text",{key:"t"+key,x:x,y:y+4,fontSize:12,textAnchor:"middle",fontWeight:"700",
      fill:on?"#fff":"#1e2433",style:{cursor:"pointer",pointerEvents:"none"}},key));
  });
  els.push(e("text",{key:"lbl",x:cx,y:cy+4,fontSize:11,fill:"#8a92b0",textAnchor:"middle"},"5도권"));
  return e("svg",{viewBox:"0 0 220 220",width:"100%",style:{maxWidth:"220px"}},els);
}

/* 진행 패턴 (roman → 키 기준 코드 변환은 단순 매핑) */
var PROGRESSIONS = [
  {genre:"Pop", name:"I–V–vi–IV", degrees:["I","V","vi","IV"]},
  {genre:"Pop", name:"I–IV–V", degrees:["I","IV","V"]},
  {genre:"Pop", name:"I–vi–IV–V", degrees:["I","vi","IV","V"]},
  {genre:"Pop", name:"vi–IV–I–V", degrees:["vi","IV","I","V"]},
  {genre:"Pop", name:"Canon", degrees:["I","V","vi","iii","IV","I","IV","V"]},
  {genre:"Pop", name:"팝 발라드", degrees:["I","iii","IV","V"]},
  {genre:"Rock", name:"I–IV–V–IV", degrees:["I","IV","V","IV"]},
  {genre:"Rock", name:"I–bVII–IV", degrees:["I","bVII","IV"]},
  {genre:"Rock", name:"안달루시아", degrees:["i","bVII","bVI","V"]},
  {genre:"Rock", name:"블루스 록", degrees:["I","I","IV","I","V","IV","I","V"]},
  {genre:"Rock", name:"메탈", degrees:["i","bVI","bVII","i"]},
  {genre:"Jazz", name:"ii–V–I", degrees:["ii","V","I"]},
  {genre:"Jazz", name:"리듬체인지", degrees:["I","vi","ii","V"]},
  {genre:"Jazz", name:"서브도미넌트", degrees:["I","IV","ii","V"]},
  {genre:"Jazz", name:"재즈 스윙", degrees:["ii","V","I","vi"]},
  {genre:"Jazz", name:"블루스 재즈", degrees:["I","IV","I","V","IV","I"]},
  {genre:"Blues", name:"12-Bar", degrees:["I","I","I","I","IV","IV","I","I","V","IV","I","V"]},
  {genre:"Blues", name:"8-Bar", degrees:["I","V","IV","IV","I","V","I","V"]},
  {genre:"Blues", name:"Minor Blues", degrees:["i","i","i","i","iv","iv","i","i","V","iv","i","V"]},
  {genre:"Folk", name:"I–IV–V–I", degrees:["I","IV","V","I"]},
  {genre:"Folk", name:"내슈빌", degrees:["I","V","IV","V"]},
  {genre:"Folk", name:"컨트리", degrees:["I","IV","I","V"]},
  {genre:"Bossa", name:"보사노바", degrees:["I","II","ii","V"]},
  {genre:"Bossa", name:"플라멩코", degrees:["i","bVII","bVI","V"]},
  {genre:"Bossa", name:"보사 루프", degrees:["ii","V","I","I"]}
];
var GENRES=["전체","Pop","Rock","Jazz","Blues","Folk","Bossa"];
/* 메이저 스케일 도수 → 반음, 코드 품질 */
var DEGREE_MAP={
  "I":{semi:0,q:"Major"},"ii":{semi:2,q:"Minor"},"II":{semi:2,q:"Major"},
  "iii":{semi:4,q:"Minor"},"III":{semi:4,q:"Major"},"IV":{semi:5,q:"Major"},"iv":{semi:5,q:"Minor"},
  "V":{semi:7,q:"Major"},"v":{semi:7,q:"Minor"},"vi":{semi:9,q:"Minor"},"VI":{semi:9,q:"Major"},
  "vii":{semi:11,q:"Minor"},"i":{semi:0,q:"Minor"},
  "bVI":{semi:8,q:"Major"},"bVII":{semi:10,q:"Major"},"bIII":{semi:3,q:"Major"}
};
/* 키 루트 음 인덱스 (C기준). NOTE_NAMES는 E=0이므로 별도 12음 맵 */
var KEY_SEMITONE={"C":0,"Db":1,"D":2,"Eb":3,"E":4,"F":5,"F#":6,"G":7,"Ab":8,"A":9,"Bb":10,"B":11};
var SEMITONE_KEY=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
function degreeToChord(key, degree){
  var base=KEY_SEMITONE[key]; var d=DEGREE_MAP[degree];
  if(d===undefined) return {root:key,quality:"Major",degree:degree};
  var root=SEMITONE_KEY[(base+d.semi)%12];
  return {root:root, quality:d.q, degree:degree};
}
function chordDisplayName(root, quality){
  var suf=({Major:"",Minor:"m",Dom7:"7",Major7:"maj7",Minor7:"m7"})[quality]||"";
  return root+suf;
}
function getShape(root, quality){
  var c=CHORD_SHAPES[root];
  if(!c) return null;
  return c[quality] || c["Major"] || null;
}

function ChordTab(){
  var metro=useMetronome();
  var sub=useState("diagram"); var subtab=sub[0]; var setSubtab=sub[1];

  /* --- 서브탭 1: 코드 다이어그램 --- */
  var rt=useState("C"); var root=rt[0]; var setRoot=rt[1];
  var ty=useState("Major"); var ctype=ty[0]; var setCtype=ty[1];
  var auto=useState("off"); var autoDir=auto[0]; var setAutoDir=auto[1]; /* off/cw/ccw */
  var bar=useState(2); var barCount=bar[0]; var setBarCount=bar[1];

  var rootRef=useRef("C"); rootRef.current=root;
  var autoRef=useRef("off"); autoRef.current=autoDir;
  var barRef=useRef(2); barRef.current=barCount;
  var beatCnt=useRef(0);

  /* 다이어그램 자동전환: 박 머리마다 카운트 → barCount*4 박 후 다음 코드 */
  useEffect(function(){
    var off=metro.onTick(function(totalSub, isHead){
      if(autoRef.current==="off") return;
      if(!isHead) return; /* 박 머리에서만 (분할 tick 무시) */
      beatCnt.current++;
      if(beatCnt.current >= barRef.current*4){
        beatCnt.current=0;
        var step=autoRef.current==="cw"?1:-1;
        /* 함수형 업데이트로 항상 최신 root 기준 계산 (rootRef 지연 회피) */
        setRoot(function(prev){
          var idx=CIRCLE5.indexOf(prev);
          if(idx<0) idx=0;
          var nxt=(idx+step+CIRCLE5.length)%CIRCLE5.length;
          return CIRCLE5[nxt];
        });
      }
    });
    return off;
  }, []);
  useEffect(function(){ if(!metro.playing){ beatCnt.current=0; } },[metro.playing]);

  var shape=getShape(root,ctype);
  var fretStr=shape?shape.f.map(function(x){return x===-1?"x":x;}).join(" "):"";
  var idx=CIRCLE5.indexOf(root);
  var prevKey=CIRCLE5[(idx-1+12)%12];
  var nextKey=CIRCLE5[(idx+1)%12];

  function diagramView(){
    return e("div",{className:"card"},
      e("div",{className:"chord-layout"},
        /* 좌: 5도권 + 자동전환 */
        e("div",null,
          e(CircleOf5ths,{sel:root,onSel:setRoot}),
          e("div",{style:{textAlign:"center",color:"#8a92b0",fontWeight:"700",marginTop:"6px"}},"현재: "+root),
          e("div",{className:"arrow-btns"},
            e("button",{onClick:function(){setRoot(prevKey);}},"\u2190"),
            e("button",{onClick:function(){setRoot(nextKey);}},"\u2192")
          ),
          e("div",{className:"auto-panel"},
            e("div",{style:{fontWeight:"700",fontSize:"13px"}},"\u21BB 자동 코드 전환"),
            e("div",{style:{fontSize:"11px",color:"#8a92b0",marginTop:"2px",marginBottom:"6px"}},
              autoDir==="off" ? "방향·간격을 고른 뒤 위쪽 ▶ 재생을 누르면 코드가 자동 전환됩니다"
                : (metro.playing ? "▶ 재생 중 · "+barCount+"마디마다 전환" : "위쪽 ▶ 재생을 누르면 "+barCount+"마디마다 전환됩니다")),
            e("div",{className:"auto-row"},
              e("button",{className:"mini-btn"+(autoDir==="cw"?" on":""),onClick:function(){
                setAutoDir("cw"); beatCnt.current=0;
              }},"\u2192 시계"),
              e("button",{className:"mini-btn"+(autoDir==="ccw"?" on":""),onClick:function(){
                setAutoDir("ccw"); beatCnt.current=0;
              }},"\u2190 반시계"),
              e("button",{className:"mini-btn"+(autoDir==="off"?" on":""),onClick:function(){
                setAutoDir("off");
              }},"끄기")
            ),
            e("div",{className:"auto-row"},
              e("span",{style:{color:"#8a92b0",fontWeight:"700",fontSize:"12px",alignSelf:"center"}},"간격:"),
              [1,2,4,8].map(function(b){
                return e("button",{key:b,className:"mini-btn"+(barCount===b?" on":""),
                  onClick:function(){setBarCount(b);}},b+"마디");
              })
            )
          )
        ),
        /* 우: 타입 + 다이어그램 */
        e("div",null,
          e("div",{className:"type-row"},
            CHORD_TYPES.map(function(t){
              return e("button",{key:t.id,className:"type-btn"+(ctype===t.id?" on":""),
                onClick:function(){setCtype(t.id);}},t.label);
            })
          ),
          e("div",{style:{display:"flex",gap:"30px",flexWrap:"wrap",alignItems:"flex-start"}},
            e("div",null, e(ChordDiagram,{shape:shape})),
            e("div",null,
              e("div",{className:"chord-name"}, chordDisplayName(root,ctype)),
              e("div",{className:"chord-root"},"Root: "+root+"  ·  "+typeLabelFull(ctype)),
              e("div",null,
                e("span",{className:"frets-label"},"E A D G B e"),
                e("span",{className:"frets-box"}, fretStr)
              ),
              e("span",{className:"nav-chord",onClick:function(){setRoot(prevKey);}},"\u2190 "+prevKey),
              e("span",{className:"nav-chord",onClick:function(){setRoot(nextKey);}},"\u2192 "+nextKey)
            )
          )
        )
      )
    );
  }

  /* --- 서브탭 2: 코드 진행 연습 --- */
  var pg=useState(0); var progIdx=pg[0]; var setProgIdx=pg[1];
  var pk=useState("C"); var progKey=pk[0]; var setProgKey=pk[1];
  var gf=useState("전체"); var genreF=gf[0]; var setGenreF=gf[1];
  var pstep=useState(0); var stepIdx=pstep[0]; var setStepIdx=pstep[1];
  var pbar=useState(2); var progBar=pbar[0]; var setProgBar=pbar[1];

  var stepRef=useRef(0); stepRef.current=stepIdx;
  var pbarRef=useRef(2); pbarRef.current=progBar;
  var progIdxRef=useRef(0); progIdxRef.current=progIdx;
  var progBeatCnt=useRef(0);
  var prog=PROGRESSIONS[progIdx];
  var progChords=prog.degrees.map(function(d){ return degreeToChord(progKey,d); });

  var subtabRef=useRef("diagram"); subtabRef.current=subtab;
  useEffect(function(){
    var off=metro.onTick(function(totalSub, isHead){
      if(subtabRef.current!=="progression") return;
      if(!isHead) return; /* 박 머리에서만 */
      progBeatCnt.current++;
      if(progBeatCnt.current >= pbarRef.current*4){
        progBeatCnt.current=0;
        var len=PROGRESSIONS[progIdxRef.current].degrees.length;
        setStepIdx(function(s){ return (s+1)%len; });
      }
    });
    return off;
  }, []);
  useEffect(function(){ progBeatCnt.current=0; setStepIdx(0); },[progIdx,progKey,subtab]);
  useEffect(function(){ if(!metro.playing){ progBeatCnt.current=0; } },[metro.playing]);

  function progView(){
    var filtered=PROGRESSIONS.map(function(p,i){return {p:p,i:i};}).filter(function(o){
      return genreF==="전체"||o.p.genre===genreF;
    });
    return e("div",null,
      e("div",{className:"card"},
        e("div",{className:"sec-label"},"키 & 장르"),
        e("div",{style:{display:"flex",gap:"8px",alignItems:"center",marginBottom:"12px",flexWrap:"wrap"}},
          e("span",{style:{fontWeight:"700",color:"#8a92b0"}},"KEY:"),
          SEMITONE_KEY.map(function(k){
            return e("button",{key:k,className:"mini-btn"+(progKey===k?" on":""),
              onClick:function(){setProgKey(k);}},k);
          })
        ),
        e("div",{className:"genre-row"},
          GENRES.map(function(g){
            return e("button",{key:g,className:"mini-btn"+(genreF===g?" on":""),
              onClick:function(){setGenreF(g);}},g);
          })
        ),
        e("div",{className:"prog-grid"},
          filtered.map(function(o){
            return e("div",{key:o.i,className:"prog-card"+(progIdx===o.i?" on":""),
              onClick:function(){setProgIdx(o.i);}},
              e("div",{className:"pn"},o.p.name),
              e("div",{className:"pc"},o.p.genre+" · "+o.p.degrees.join("–"))
            );
          })
        )
      ),
      e("div",{className:"card"},
        e("div",{style:{display:"flex",gap:"8px",alignItems:"center",marginBottom:"6px",flexWrap:"wrap"}},
          e("span",{style:{color:"#8a92b0",fontWeight:"700"}},"전환 간격:"),
          [1,2,4].map(function(b){
            return e("button",{key:b,className:"mini-btn"+(progBar===b?" on":""),
              onClick:function(){setProgBar(b);}},b+"마디");
          })
        ),
        e("div",{className:"prog-bar"},
          progChords.map(function(c,i){
            return e("div",{key:i,className:"prog-step"+(stepIdx===i?" act":"")},
              c.degree+" · "+chordDisplayName(c.root,c.quality));
          })
        ),
        /* 진행의 모든 코드 다이어그램을 한 줄로 나열, 현재 코드 강조 */
        e("div",{className:"prog-chords"},
          progChords.map(function(c,i){
            var sh=getShape(c.root,c.quality);
            return e("div",{key:i,className:"prog-chord-card"+(stepIdx===i?" act":""),
              onClick:function(){ setStepIdx(i); }, style:{cursor:"pointer"}},
              e("div",{className:"pcc-idx"}, i+1),
              e("div",{className:"pcc-deg"}, c.degree),
              e("div",{className:"pcc-name"}, chordDisplayName(c.root,c.quality)),
              e(ChordDiagram,{shape:sh})
            );
          })
        )
      )
    );
  }

  return e("div",null,
    e(MetronomeBar,{metro:metro}),
    e("div",{className:"subtabs"},
      e("button",{className:"subtab"+(subtab==="diagram"?" on":""),
        onClick:function(){setSubtab("diagram");}},"코드 다이어그램"),
      e("button",{className:"subtab"+(subtab==="progression"?" on":""),
        onClick:function(){setSubtab("progression");}},"\uD83D\uDD01 코드 진행 연습")
    ),
    subtab==="diagram"?diagramView():progView()
  );
}


export { ChordTab };
