import React from 'react';
import { isInScale, noteNameAt, intervalLabelAt, degreeLabelAt, isRootAt, noteIndexAt } from '../../lib/theory.js';
const e = React.createElement;

function dotLabel(labelMode, scaleKey, s, f, rootOverride){
  if(labelMode==="note") return noteNameAt(s,f);
  if(labelMode==="interval") return intervalLabelAt(scaleKey,s,f,rootOverride);
  if(labelMode==="degree") return degreeLabelAt(scaleKey,s,f,rootOverride);
  return String(f); /* fret */
}

/* 인레이(포지션) 마커 프렛: 단일 점 프렛 + 12·24는 더블 */
var SINGLE_INLAYS = [3,5,7,9,15,17,19,21];
var DOUBLE_INLAYS = [12,24];

/* ---------------- Fretboard SVG (박스 뷰, 하이라이트) ---------------- */
function Fretboard(props){
  var scaleKey = props.scaleKey;
  var box = props.box;            /* [lowFret, highFret] */
  var current = props.current;    /* {string, fret} 또는 null */
  var labelMode = props.labelMode || "fret";
  var rootOverride = props.rootOverride;
  var onDot = props.onDot;        /* 클릭 콜백 (s,f) */
  var lowFret = box[0], highFret = box[1];
  var nFrets = highFret - lowFret + 1;
  var hasOpen = (lowFret === 0);
  var W=340, H=212, padL=34, padT=18;
  var openW = hasOpen ? 24 : 0;
  var gridLeft = padL + openW;
  var fretCols = hasOpen ? (nFrets-1) : nFrets;
  if(fretCols<1) fretCols=1;
  var colW=(W-gridLeft-10)/fretCols;
  var rowH=(190-padT-14)/5;
  function rowY(s){ return padT + (5 - s) * rowH; }
  function fretX(fret){
    if(fret===0) return padL + openW/2;
    var col = hasOpen ? (fret - 1) : (fret - lowFret);
    return gridLeft + col*colW + colW/2;
  }
  var strLabels=["E","A","D","G","B","e"];
  var firstGridFret = hasOpen ? 1 : lowFret;
  var boardTop=padT, boardBot=padT+5*rowH, midY=padT+2.5*rowH;

  var els=[];
  var s, f;
  /* 인레이 점 (격자 뒤에) */
  function inRange(fr){ return fr>=firstGridFret && fr<=highFret; }
  SINGLE_INLAYS.forEach(function(fr){ if(inRange(fr)) els.push(e("circle",{key:"iy"+fr,cx:fretX(fr),cy:midY,r:5,fill:"#e6eaf5"})); });
  DOUBLE_INLAYS.forEach(function(fr){ if(inRange(fr)){
    els.push(e("circle",{key:"iyA"+fr,cx:fretX(fr),cy:padT+1.5*rowH,r:5,fill:"#e6eaf5"}));
    els.push(e("circle",{key:"iyB"+fr,cx:fretX(fr),cy:padT+3.5*rowH,r:5,fill:"#e6eaf5"}));
  }});
  /* 줄 (가로선) — 개방현 포함 시 개방 영역까지 연장 */
  for(s=0;s<6;s++){
    var y=rowY(s);
    var lineX1 = hasOpen ? padL : gridLeft;
    els.push(e("line",{key:"s"+s, x1:lineX1, y1:y, x2:gridLeft+fretCols*colW, y2:y,
      stroke:"#c2cbe4", strokeWidth:1}));
    els.push(e("text",{key:"sl"+s, x:padL-20, y:y+4, fontSize:11, fill:"#8a92b0", fontWeight:"700"}, strLabels[s]));
  }
  /* 세로선(프렛) */
  for(f=0;f<=fretCols;f++){
    var x=gridLeft+f*colW;
    var isNut = hasOpen && f===0;
    els.push(e("line",{key:"f"+f, x1:x, y1:boardTop, x2:x, y2:boardBot,
      stroke:isNut?"#7c88a8":"#c2cbe4", strokeWidth: isNut?4:1}));
  }
  /* 개방현 라벨 */
  if(hasOpen){
    els.push(e("text",{key:"openlbl", x:padL+openW/2, y:boardBot+16, fontSize:11, fill:"#8a92b0",
      textAnchor:"middle", fontWeight:"700"}, "0"));
  }
  /* 프렛 번호 (보드 아래) */
  for(f=0; f<fretCols; f++){
    var fnum = firstGridFret + f;
    els.push(e("text",{key:"fn"+f, x:gridLeft+f*colW+colW/2, y:boardBot+16,
      fontSize:11, fill:"#8a92b0", textAnchor:"middle", fontWeight:"700"}, String(fnum)));
  }
  /* 음 점 */
  for(s=0;s<6;s++){
    for(f=lowFret; f<=highFret; f++){
      if(isInScale(scaleKey, s, f, rootOverride)){
        (function(s,f){
        var cx=fretX(f);
        var cy=rowY(s);
        var isCur = current && current.string===s && current.fret===f;
        var isRoot = isRootAt(scaleKey, s, f, rootOverride);
        var fill = isCur ? "#ffffff" : (isRoot ? "#ea580c" : "#f97316");
        var stroke = isCur ? "#5b6ef5" : (isRoot ? "#9a3412" : "#ffffff");
        els.push(e("circle",{key:"d"+s+"-"+f, cx:cx, cy:cy, r:11,
          fill:fill, stroke:stroke, strokeWidth:isCur?3:(isRoot?2:1),
          style:onDot?{cursor:"pointer"}:null,
          onClick:onDot?function(){ onDot(s,f); }:null}));
        var txtFill = isCur ? "#5b6ef5" : "#fff";
        els.push(e("text",{key:"dt"+s+"-"+f, x:cx, y:cy+4, fontSize:10, fill:txtFill,
          textAnchor:"middle", fontWeight:"800",
          style:onDot?{cursor:"pointer",pointerEvents:"none"}:{pointerEvents:"none"}},
          dotLabel(labelMode, scaleKey, s, f, rootOverride)));
        })(s,f);
      }
    }
  }
  /* 스케일 밖 현재 음 오버레이 */
  if(current && current.fret>=lowFret && current.fret<=highFret){
    var inScaleNow=isInScale(scaleKey, current.string, current.fret, rootOverride);
    if(!inScaleNow){
      els.push(e("circle",{key:"curRing",cx:fretX(current.fret),cy:rowY(current.string),r:11,
        fill:"#22d3ee",stroke:"#0891b2",strokeWidth:2}));
      els.push(e("text",{key:"curRingT",x:fretX(current.fret),y:rowY(current.string)+4,
        fontSize:10,fill:"#06283d",textAnchor:"middle",fontWeight:"800",
        style:{pointerEvents:"none"}},dotLabel(labelMode,scaleKey,current.string,current.fret,rootOverride)));
    }
  }
  return e("svg",{viewBox:"0 0 "+W+" "+H, width:"100%", style:{maxWidth:"380px"}}, els);
}

/* ---------------- 전체 지판 뷰 ---------------- */
var CAGED_COLORS=["#5b6ef5","#10b981","#f97316","#8b5cf6","#ef4444","#0ea5e9","#eab308"];
function FretboardFull(props){
  var scaleKey=props.scaleKey;
  var labelMode=props.labelMode||"interval";
  var rootOverride=props.rootOverride;
  var onDot=props.onDot;
  var showCaged=props.showCaged;
  var boxes=props.boxes;
  var highlightBox=props.highlightBox;
  var chordTones=props.chordTones;     /* 현재 코드 구성음 (E=0 기준 pc 배열) 또는 null */
  var chordRootPc=props.chordRootPc;   /* 현재 코드 루트 pc (E=0) 또는 null */
  var maxFret=15;
  var W=760, H=214, padL=30, padT=18;
  var openW=24, gridLeft=padL+openW;
  var colW=(W-gridLeft-8)/maxFret;
  var rowH=(190-padT-14)/5;
  function rowY(s){ return padT+(5-s)*rowH; }
  function fretX(fret){ if(fret===0) return padL+openW/2; return gridLeft+(fret-1)*colW+colW/2; }
  var strLabels=["E","A","D","G","B","e"];
  var boardTop=padT, boardBot=padT+5*rowH, midY=padT+2.5*rowH;
  var els=[], s, f;
  /* 현재 박스 음영 */
  if(highlightBox){
    var hx1=highlightBox[0]===0?padL:gridLeft+(highlightBox[0]-1)*colW;
    var hx2=gridLeft+(highlightBox[1])*colW;
    els.push(e("rect",{key:"hl",x:hx1,y:boardTop,width:hx2-hx1,height:5*rowH,fill:"#5b6ef5",opacity:0.08}));
  }
  /* 인레이 점 */
  SINGLE_INLAYS.forEach(function(fr){ if(fr<=maxFret) els.push(e("circle",{key:"iy"+fr,cx:fretX(fr),cy:midY,r:5,fill:"#e6eaf5"})); });
  DOUBLE_INLAYS.forEach(function(fr){ if(fr<=maxFret){
    els.push(e("circle",{key:"iyA"+fr,cx:fretX(fr),cy:padT+1.5*rowH,r:5,fill:"#e6eaf5"}));
    els.push(e("circle",{key:"iyB"+fr,cx:fretX(fr),cy:padT+3.5*rowH,r:5,fill:"#e6eaf5"}));
  }});
  /* 줄 (개방 영역까지 연장) */
  for(s=0;s<6;s++){
    var y=rowY(s);
    els.push(e("line",{key:"s"+s,x1:padL,y1:y,x2:gridLeft+maxFret*colW,y2:y,stroke:"#c2cbe4",strokeWidth:1}));
    els.push(e("text",{key:"sl"+s,x:padL-18,y:y+4,fontSize:11,fill:"#8a92b0",fontWeight:"700"},strLabels[s]));
  }
  /* 프렛선 */
  for(f=0;f<=maxFret;f++){
    var x=gridLeft+f*colW;
    els.push(e("line",{key:"f"+f,x1:x,y1:boardTop,x2:x,y2:boardBot,stroke:f===0?"#7c88a8":"#c2cbe4",strokeWidth:f===0?4:1}));
  }
  /* 프렛 번호 (모든 프렛) */
  els.push(e("text",{key:"pm0",x:padL+openW/2,y:boardBot+16,fontSize:11,fill:"#8a92b0",textAnchor:"middle",fontWeight:"700"},"0"));
  for(f=1;f<=maxFret;f++){
    els.push(e("text",{key:"pm"+f,x:fretX(f),y:boardBot+16,fontSize:10,fill:"#8a92b0",textAnchor:"middle",
      fontWeight:(f%2===1||f===12)?"700":"400"},String(f)));
  }
  /* 음 점 */
  for(s=0;s<6;s++){
    for(f=0;f<=maxFret;f++){
      if(isInScale(scaleKey,s,f,rootOverride)){
        (function(s,f){
          var cx=fretX(f), cy=rowY(s);
          var isRoot=isRootAt(scaleKey,s,f,rootOverride);
          var pc=noteIndexAt(s,f);
          var isChordTone = chordTones && chordTones.indexOf(pc)>=0;
          var isChordRoot = (chordRootPc!==null && chordRootPc!==undefined) && pc===chordRootPc;
          var dim = chordTones && !isChordTone; /* 코드 활성 시 비구성음은 흐리게 */
          var col="#f97316";
          if(showCaged && boxes){
            for(var bi=0;bi<boxes.length;bi++){ if(f>=boxes[bi][0]&&f<=boxes[bi][1]){ col=CAGED_COLORS[bi%CAGED_COLORS.length]; break; } }
          }
          var fill=isRoot?"#ea580c":col;
          var stroke = isChordRoot ? "#eab308" : (isChordTone ? "#0f1424" : (isRoot?"#9a3412":"#ffffff"));
          var sw = isChordRoot ? 3 : (isChordTone ? 2.5 : (isRoot?2:1));
          var rr = isChordTone ? 11 : 10;
          els.push(e("circle",{key:"d"+s+"-"+f,cx:cx,cy:cy,r:rr,fill:fill,
            stroke:stroke,strokeWidth:sw,opacity:dim?0.32:1,
            style:onDot?{cursor:"pointer"}:null,
            onClick:onDot?function(){onDot(s,f);}:null}));
          els.push(e("text",{key:"t"+s+"-"+f,x:cx,y:cy+3.5,fontSize:9,fill:"#fff",
            textAnchor:"middle",fontWeight:"800",style:{pointerEvents:"none"},opacity:dim?0.4:1},
            dotLabel(labelMode,scaleKey,s,f,rootOverride)));
        })(s,f);
      }
    }
  }
  /* 현재 재생 음(잼) 하이라이트 링 */
  var cur=props.current;
  if(cur && cur.fret>=0 && cur.fret<=maxFret){
    els.push(e("circle",{key:"curHL",cx:fretX(cur.fret),cy:rowY(cur.string),r:14,
      fill:"none",stroke:"#0891b2",strokeWidth:3}));
  }
  return e("svg",{viewBox:"0 0 "+W+" "+H,width:"100%",style:{maxWidth:"800px"}},els);
}

export { Fretboard, FretboardFull };
