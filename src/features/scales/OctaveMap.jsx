import React from 'react';
import { useState } from 'react';
import { noteIndexAt, noteNameAt } from '../../lib/theory.js';
import { playNote } from '../../lib/audio.js';
const e = React.createElement;

/* 옥타브 지도 — 음 하나를 고르면 지판 전체에서 그 음의 모든 위치를 표시하고,
   옥타브(2·3·4)를 라벨링 + 옥타브 쉐입(두 줄 위)을 선으로 연결한다.
   "각 음의 옥타브를 찾아라"를 눈으로 보이게 만들어 지판 암기를 돕는다. */

/* 개방현 MIDI (idx0=6번줄 low E … idx5=1번줄 high e) */
var OPEN_MIDI = [40,45,50,55,59,64];
/* 선택 버튼: C부터, [표시이름, E=0 기준 pc] */
var PICK = [["C",8],["C#",9],["D",10],["D#",11],["E",0],["F",1],
            ["F#",2],["G",3],["G#",4],["A",5],["A#",6],["B",7]];
/* 자연음(♯ 없는 음)의 E=0 pc */
var NATURAL_PC = [0,1,3,5,7,8,10]; /* E F G A B C D */

function OctaveMap(){
  var st = useState(5); var pc = st[0]; var setPc = st[1];           /* 기본 A(=5) */
  var am = useState(false); var showAll = am[0]; var setShowAll = am[1];

  var maxFret = 15;
  var W = 760, H = 220, padL = 30, padT = 18;
  var openW = 24, gridLeft = padL + openW;
  var colW = (W - gridLeft - 8) / maxFret;
  var rowH = (188 - padT - 14) / 5;
  function rowY(s){ return padT + (5 - s) * rowH; }
  function fretX(f){ if(f===0) return padL + openW/2; return gridLeft + (f-1)*colW + colW/2; }
  var strLabels = ["E","A","D","G","B","e"];
  var boardTop = padT, boardBot = padT + 5*rowH, midY = padT + 2.5*rowH;
  var SINGLE = [3,5,7,9,15], DOUBLE = [12];

  var els = [], s, f;
  /* 인레이 */
  SINGLE.forEach(function(fr){ if(fr<=maxFret) els.push(e("circle",{key:"iy"+fr,cx:fretX(fr),cy:midY,r:5,fill:"#e6eaf5"})); });
  DOUBLE.forEach(function(fr){ els.push(e("circle",{key:"iA"+fr,cx:fretX(fr),cy:padT+1.5*rowH,r:5,fill:"#e6eaf5"}));
    els.push(e("circle",{key:"iB"+fr,cx:fretX(fr),cy:padT+3.5*rowH,r:5,fill:"#e6eaf5"})); });
  /* 줄 */
  for(s=0;s<6;s++){ var y=rowY(s);
    els.push(e("line",{key:"s"+s,x1:padL,y1:y,x2:gridLeft+maxFret*colW,y2:y,stroke:"#c2cbe4",strokeWidth:1}));
    els.push(e("text",{key:"sl"+s,x:padL-18,y:y+4,fontSize:11,fill:"#8a92b0",fontWeight:"700"},strLabels[s]));
  }
  /* 프렛선 + 번호 */
  for(f=0;f<=maxFret;f++){ var x=gridLeft+f*colW;
    els.push(e("line",{key:"f"+f,x1:x,y1:boardTop,x2:x,y2:boardBot,stroke:f===0?"#7c88a8":"#c2cbe4",strokeWidth:f===0?4:1}));
  }
  els.push(e("text",{key:"n0",x:padL+openW/2,y:boardBot+16,fontSize:11,fill:"#8a92b0",textAnchor:"middle",fontWeight:"700"},"0"));
  for(f=1;f<=maxFret;f++){ els.push(e("text",{key:"n"+f,x:fretX(f),y:boardBot+16,fontSize:10,fill:"#8a92b0",textAnchor:"middle",fontWeight:(f%2===1||f===12)?"700":"400"},String(f))); }

  /* 옥타브 연결선 (두 줄 위 = 같은 음 한 옥타브 위) */
  for(s=0;s<4;s++){
    for(f=0;f<=maxFret;f++){
      if(noteIndexAt(s,f)===pc){
        var tf = (OPEN_MIDI[s]+f+12) - OPEN_MIDI[s+2]; /* 두 줄 위에서의 프렛 */
        if(tf>=0 && tf<=maxFret){
          els.push(e("line",{key:"oc"+s+"-"+f, x1:fretX(f), y1:rowY(s), x2:fretX(tf), y2:rowY(s+2),
            stroke:"#5b6ef5", strokeWidth:2, opacity:0.45, strokeDasharray:"4 3"}));
        }
      }
    }
  }
  /* 자연음 전체 표시(옅게) — 지판 지도 학습용 */
  if(showAll){
    for(s=0;s<6;s++){ for(f=0;f<=maxFret;f++){
      var p2=noteIndexAt(s,f);
      if(p2!==pc && NATURAL_PC.indexOf(p2)>=0){
        (function(s,f){ var cx=fretX(f),cy=rowY(s);
          els.push(e("text",{key:"na"+s+"-"+f,x:cx,y:cy+4,fontSize:10,fill:"#b8c0d8",textAnchor:"middle",fontWeight:"700",
            style:{cursor:"pointer"}, onClick:function(){ playNote(s,f); }}, noteNameAt(s,f)));
        })(s,f);
      }
    }}
  }
  /* 선택 음: 모든 위치 강조 + 옥타브 번호 */
  for(s=0;s<6;s++){ for(f=0;f<=maxFret;f++){
    if(noteIndexAt(s,f)===pc){
      (function(s,f){
        var cx=fretX(f), cy=rowY(s);
        var octv = Math.floor((OPEN_MIDI[s]+f)/12) - 1;   /* MIDI → 옥타브 번호 */
        els.push(e("circle",{key:"h"+s+"-"+f,cx:cx,cy:cy,r:11,fill:"#f97316",stroke:"#ffffff",strokeWidth:1.5,
          style:{cursor:"pointer"}, onClick:function(){ playNote(s,f); }}));
        els.push(e("text",{key:"ht"+s+"-"+f,x:cx,y:cy+4,fontSize:10,fill:"#fff",textAnchor:"middle",fontWeight:"800",
          style:{pointerEvents:"none"}}, String(octv)));
      })(s,f);
    }
  }}

  var noteName = PICK.filter(function(p){return p[1]===pc;})[0][0];

  return e("div",{className:"card"},
    e("div",{className:"sec-label"},"🎯 옥타브 지도 · 음계 암기"),
    e("div",{className:"bk-row",style:{flexWrap:"wrap"}},
      e("span",{className:"sec-label",style:{marginBottom:0,minWidth:"auto"}},"음"),
      PICK.map(function(p){
        return e("button",{key:p[0],className:"mini-btn"+(pc===p[1]?" on":""),
          onClick:function(){ setPc(p[1]); }}, p[0]);
      }),
      e("label",{className:"bk-track",style:{marginLeft:"8px"}},
        e("input",{type:"checkbox",checked:showAll,onChange:function(){ setShowAll(!showAll); }}),"모든 음이름")
    ),
    e("div",{className:"fb-sub",style:{margin:"8px 0"}},
      noteName+" 음의 모든 위치입니다. 원 안 숫자는 옥타브(예: "+noteName+"2 · "+noteName+"3 · "+noteName+"4), 점선은 '두 줄 위 = 한 옥타브 위' 쉐입입니다. 점을 누르면 소리납니다."),
    e("div",{className:"card sel",style:{padding:"10px",marginBottom:0,border:"none",boxShadow:"none"}},
      e("svg",{viewBox:"0 0 "+W+" "+H,width:"100%",style:{maxWidth:"800px"}},els)
    ),
    e("div",{className:"hint"},
      "외우는 법: ① 6번줄·5번줄에서 그 음의 자리를 먼저 외운다 → ② 점선을 따라 '두 줄 위, 프렛은 살짝 오른쪽'으로 옮기면 같은 음(한 옥타브 위)이다 → ③ 이 옥타브 쉐입만 알면 한 자리에서 지판 전체의 같은 음이 보인다. (4번→2번, 3번→1번줄은 B줄 때문에 한 프렛 더 오른쪽)")
  );
}

export { OctaveMap };
