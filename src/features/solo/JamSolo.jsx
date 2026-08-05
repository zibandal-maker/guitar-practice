import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { JAM_SOLOS, JN, JR, BLUES12_CHORDS, JAM_BASE_ROOT, soloById } from '../../data/solos.js';
import { SEMITONE_KEY } from '../../lib/theory.js';
import { useLeadPlayer } from '../../hooks/useLeadPlayer.js';
import { loadJamFavs, saveJamFavs } from '../../lib/storage.js';
const e = React.createElement;

/* ---- 솔로 타브/생성 유틸 ---- */
<<<<<<< HEAD
function normalizeBars(bars){
  return bars.map(function(bar){
    var sum=0, i;
    for(i=0;i<bar.length;i++){ sum+=(bar[i].d||0); }
    if(sum===16) return bar;
    var nb=bar.slice();
    if(sum<16){ nb.push({rest:true, d:16-sum}); }
    else { /* 초과: 끝에서부터 줄임 */
      while(sum>16 && nb.length){ var last=nb[nb.length-1]; 
        if((last.d||0) <= (sum-16)){ sum-=(last.d||0); nb.pop(); }
        else { nb[nb.length-1]=Object.assign({}, last, {d:last.d-(sum-16)}); sum=16; }
      }
    }
    return nb;
  });
}
/* 로드 시 1회 정규화 (개발 중 길이 실수 자동 보정) */
(function(){ for(var i=0;i<JAM_SOLOS.length;i++){ JAM_SOLOS[i].bars=normalizeBars(JAM_SOLOS[i].bars); } })();

/* ---- 주법 표기 매핑 ---- */
function repeatCh(c,n){ var s=""; for(var i=0;i<n;i++) s+=c; return s; }
var ART_TAB = { "h":"h","p":"p","b":"b","hb":"b","br":"b","pb":"b","r":"r",
  "/":"/","\\":"\\","~":"~","x":"x","t":"t","":"" };
var ART_LABEL = { "h":"해머온","p":"풀오프","b":"풀벤딩","hb":"하프벤딩","br":"벤드릴리스",
  "pb":"프리벤드","r":"릴리스","/":"슬라이드업","\\":"슬라이드다운","~":"비브라토",
  "x":"뮤트","t":"태핑" };

/* ---- 길이(16분 단위) → 리듬 기호 ---- */
function durSym(d){
  switch(d){
    case 1: return "\u266F"; /* 16분 (♯ 대용 표기 회피, 아래 매핑 사용) */
    default: return "";
  }
}
/* 정확한 음표 기호: 16분=𝅘𝅥𝅯 류는 폰트 의존 → 단순 ASCII 기호로 */
var DUR_GLYPH = {
  1:"\u266C",   /* 16분 ♬ */
  2:"\u266A",   /* 8분 ♪ */
  3:"\u266A.",  /* 점8분 */
  4:"\u2669",   /* 4분 ♩ */
  6:"\u2669.",  /* 점4분 */
  8:"\u{1D15E}",/* 2분 (폴백 처리) */
  12:"\u{1D15E}.",
  16:"\u{1D15D}"/* 온음표 */
};
function durGlyph(d){ return DUR_GLYPH[d] || "\u2669"; }

/* ---- 12마디 → flat 음 배열 (재생용). 쉼표 포함, 마디 인덱스 부착 ---- */
function flattenBars(bars){
  var out=[]; 
  for(var b=0;b<bars.length;b++){
    var bar=bars[b];
    for(var i=0;i<bar.length;i++){
      var n=bar[i];
      out.push(Object.assign({}, n, {bar:b}));
    }
  }
  return out;
}
/* 마디 길이 합 검증 (개발용; 16이 아니면 콘솔 경고) */
function validateBars(solo){
  for(var b=0;b<solo.bars.length;b++){
    var sum=0; var bar=solo.bars[b];
    for(var i=0;i<bar.length;i++){ sum+=(bar[i].d||0); }
    if(sum!==16){ try{ console.warn("[jam] "+solo.id+" 마디"+(b+1)+" 길이합="+sum); }catch(e){} }
  }
}

/* ---- 이조: A(5프렛) 기준 → rootSemiE에 맞춰 프렛 시프트 ---- */
function transposeBars(bars, rootSemiE){
  var shift=((rootSemiE - JAM_BASE_ROOT)%12+12)%12;
  return bars.map(function(bar){
    return bar.map(function(n){
      if(n.rest) return Object.assign({}, n);
      var nf=n.f+shift; if(nf<0) nf+=12;
      return Object.assign({}, n, {f:nf});
    });
  });
}

/* ========================================================================
   ASCII 타브 렌더 — 마디 단위 줄바꿈, 각 마디 위에 리듬 라인.
   반환: [{barNo, chord, rhythm:문자열, lines:[6줄], cells:[{ci,col,len,note}]}]
   cells: 전역 flat 인덱스(ci)와 화면상 컬럼(col)·셀폭(len)·음 매핑 (마커/하이라이트용)
   ======================================================================== */
function buildAsciiTab(bars, chordsSemi, keySemiC){
  var strLabels=["e","B","G","D","A","E"]; /* 위→아래 = 1번줄~6번줄 */
  var result=[]; var flatIdx=0;
  for(var b=0;b<bars.length;b++){
    var bar=bars[b];
    var rows=[[],[],[],[],[],[]];
    var rhythmCells=[];
    var cells=[];
    var prefix="X|"; var col=prefix.length;
    for(var i=0;i<bar.length;i++){
      var n=bar[i];
      var cell, rsym;
      if(n.rest){
        cell="-"; rsym=" ";
      } else {
        var fnum=(n.f<0?"x":String(n.f));
        var art=ART_TAB[n.art]||"";
        var pre=(art==="/"||art==="\\"||art==="h"||art==="p"||art==="t")?art:"";
        var post=(art==="b"||art==="r"||art==="~")?art:"";
        cell=pre+fnum+post;
        rsym=durGlyphShort(n.d);
        cells.push({ci:flatIdx, col:col, len:cell.length, note:n});
      }
      var row=n.rest? -1 : (5-n.s);
      for(var r=0;r<6;r++){
        if(r===row){ rows[r].push(cell); }
        else { rows[r].push(repeatCh("-", cell.length)); }
      }
      /* 리듬 라인: 셀 폭에 맞춰 기호 + 패딩 */
      rhythmCells.push(padRight(rsym, cell.length));
      /* 음 사이 구분 */
      var gap="-";
      for(var r2=0;r2<6;r2++){ rows[r2].push(gap); }
      rhythmCells.push(repeatCh(" ", gap.length));
      col += cell.length + gap.length;
      flatIdx++;
    }
    var lines=[];
    for(var k=0;k<6;k++){ lines.push(strLabels[k]+"|"+rows[k].join("")+"|"); }
    var chordLabel = chordsSemi? SEMITONE_KEY[((keySemiC+chordsSemi[b])%12+12)%12]+"7" : "";
    result.push({
      barNo:b+1, chord:chordLabel,
      rhythm:"  "+rhythmCells.join(""), /* prefix(2) 정렬 */
      lines:lines, cells:cells, width:col+1
    });
  }
  return result;
}
/* 리듬 라인용 짧은 기호 (셀 폭 안에 들어가게) */
function durGlyphShort(d){
  var m={1:"\u266C",2:"\u266A",3:"\u266A.",4:"\u2669",6:"\u2669.",8:"o",12:"o.",16:"O"};
  return m[d]||"\u2669";
}
function padRight(s,w){ while(s.length<w) s+=" "; return s.length>w? s.slice(0,w): s; }

/* 마디 데이터(buildAsciiTab 결과)를 perRow개씩 가로로 이어붙여 라인 그룹 생성.
   반환: [{bars:[원본마디데이터+barOffsetCol], rhythm:문자열, lines:[6줄], heads:[{barNo,chord,startCol}]}]
   각 셀의 전역 컬럼 = 라벨(1)+| 누적. 마커/하이라이트는 전역 col 사용. */
function buildAsciiRows(barsData, perRow){
  perRow=perRow||4;
  var strLabels=["e","B","G","D","A","E"];
  var groups=[];
  for(var g=0; g<barsData.length; g+=perRow){
    var chunk=barsData.slice(g, g+perRow);
    var rowStr=["","","","","",""]; /* 6선 */
    var rhythmStr="";
    var heads=[];
    var globalCells=[]; /* {ci, gcol, len} 전역 컬럼 */
    /* 시작: 라벨 1칸. 첫 마디선 | 은 각 마디 lines가 자체 보유 */
    var prefixLen=1; /* "e" 라벨 폭 */
    /* 리듬 라인 prefix: 라벨(1)만큼 공백 */
    rhythmStr=repeatCh(" ", prefixLen);
    for(var r=0;r<6;r++){ rowStr[r]=strLabels[r]; }
    var acc=prefixLen; /* 전역 컬럼 누적 (라벨 다음부터) */
    for(var c=0;c<chunk.length;c++){
      var bd=chunk[c];
      /* bd.lines[k] = "e|....|" → 라벨 제거하고 "|....|" 본문만 사용 */
      for(var k=0;k<6;k++){
        var body=bd.lines[k].slice(1); /* 라벨 1글자 제거 → "|....|" */
        rowStr[k]+=body;
      }
      /* 리듬: bd.rhythm = "  "+cells... (prefix 2). 라벨 정렬 위해 "|" 자리 보정.
         본문 시작이 "|"(1) 다음이므로 리듬도 " "(마디선 자리) + 리듬내용 */
      var rbody=bd.rhythm.slice(2); /* "  " 제거 */
      rhythmStr+=" "+rbody+" "; /* 앞 |, 뒤 | 자리 공백 */
      /* head: 이 마디가 전역에서 시작하는 컬럼 (마디선 | 다음) */
      var barStartCol=acc+1; /* | 다음 */
      heads.push({barNo:bd.barNo, chord:bd.chord, startCol:barStartCol});
      /* 셀 전역 컬럼: bd.cells[].col 은 마디내 "X|" 기준(col≥2). 본문에서 "|"가 col1 위치.
         전역 = acc + (col - 1)  ('X' 라벨 1글자를 빼고 | 부터 이으므로) */
      for(var ci2=0; ci2<bd.cells.length; ci2++){
        var cell=bd.cells[ci2];
        globalCells.push({ci:cell.ci, gcol:acc+(cell.col-1), len:cell.len, note:cell.note});
      }
      acc += (bd.lines[0].length-1); /* 본문 길이("|....|") 만큼 전진 */
    }
    var lines=[];
    for(var kk=0;kk<6;kk++){ lines.push(rowStr[kk]); }
    groups.push({ heads:heads, rhythm:rhythmStr, lines:lines, cells:globalCells, width:acc+1 });
  }
  return groups;
}

/* ========================================================================
   SVG 타브 렌더 데이터 — 마디별 음을 좌표로 배치. 벤딩 화살표·슬라이드·슬러·비브라토.
   컴포넌트(JamSolo)에서 직접 그리도록 좌표 계산 함수 제공.
   ======================================================================== */
function layoutSvgBar(bar, opts){
  /* opts: {w, padL, rowH, padT} 한 마디 폭 안에 음을 길이비례 배치 */
  var W=opts.w, padL=opts.padL, rowH=opts.rowH, padT=opts.padT;
  var inner=W-padL-8;
  var totalDur=0, i;
  for(i=0;i<bar.length;i++){ totalDur+=(bar[i].d||0); }
  if(totalDur<=0) totalDur=16;
  var items=[]; var acc=0;
  for(i=0;i<bar.length;i++){
    var n=bar[i];
    var x=padL + (acc/totalDur)*inner + ((n.d||0)/totalDur)*inner*0.5;
    if(!n.rest){
      items.push({ note:n, x:x, y:padT+(5-n.s)*rowH, w:((n.d||0)/totalDur)*inner });
    }
    acc+=(n.d||0);
  }
  return items;
}

/* ========================================================================
   절차적 12바 생성기 — 코드 진행 위에 마디별 모티프를 음악 제약으로 생성.
   제약: 마디 첫 음은 코드톤 근처 착지, 도약 ≤ 펜타 2스텝, 마디 끝 음 길이감.
   ======================================================================== */
/* A 마이너펜타 박스1 음 풀 (string,fret) — 5프렛 박스 기준 */
var GEN_POOL = [
  {s:0,f:5},{s:0,f:8},{s:1,f:5},{s:1,f:7},{s:2,f:5},{s:2,f:7},
  {s:3,f:5},{s:3,f:7},{s:4,f:5},{s:4,f:8},{s:5,f:5},{s:5,f:8}
];
/* 블루노트 ♭5 (A블루스: 6프렛/G줄 등) */
var GEN_BLUE = [{s:3,f:8},{s:2,f:8}];

function genRand(seed){ /* 간단 LCG */
  var s=seed||Math.floor(Math.random()*1e9);
  return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
}
/* 리듬 패턴 풀 (마디=16) */
var GEN_RHYTHMS = [
  [4,2,2,4,4],[2,2,4,2,2,4],[4,4,2,2,4],[2,2,2,2,4,4],
  [4,2,2,2,2,4],[6,2,4,4],[2,2,2,2,2,2,2,2],[4,4,4,4],
  [3,1,2,2,4,4],[2,2,4,4,2,2]
];
function generate12BarSolo(opts){
  opts=opts||{};
  var rnd=genRand(opts.seed);
  var density=opts.density||0.6; /* 음 밀도 */
  var useBlue=opts.blue!==false;
  var chords=opts.chords||BLUES12_CHORDS;
  var bars=[];
  var prev=GEN_POOL[4]; /* 시작: 3번줄 5프렛 근처 */
  for(var b=0;b<12;b++){
    var rhythm=GEN_RHYTHMS[Math.floor(rnd()*GEN_RHYTHMS.length)];
    var bar=[]; var filled=0;
    for(var i=0;i<rhythm.length;i++){
      var d=rhythm[i];
      /* 쉼표 확률 (밀도 반비례, 마디 끝쪽 더 자주) */
      if(rnd() > density && i>0){ bar.push(JR(d)); filled+=d; continue; }
      /* 다음 음: prev 근처에서 선택 (도약 제한) */
      var cand=nearbyNote(prev, rnd, useBlue);
      var art="";
      /* 주법: 긴 음에 벤딩/비브라토, 짧은 연속음에 해머/풀오프 */
      if(d>=4 && rnd()<0.35){ art=(rnd()<0.5?"b":"~"); }
      else if(d<=2 && rnd()<0.2){ art=(cand.f>prev.f?"h":"p"); }
      bar.push(JN(cand.s,cand.f,d,art));
      prev=cand; filled+=d;
    }
    /* 길이 보정: 합이 16 안되면 마지막에 쉼표/연장 */
    if(filled<16){ bar.push(JR(16-filled)); }
    else if(filled>16){ /* 초과분 잘라내기 */
      while(filled>16 && bar.length){ var last=bar.pop(); filled-=(last.d||0); }
      if(filled<16) bar.push(JR(16-filled));
    }
    bars.push(bar);
  }
  return {
    id:"solo_generated", name:"AI 생성 솔로", level:"생성", style:opts.style||"shuffle",
    scale:"minPenta", bpm:opts.bpm||90, chords:chords,
    desc:"절차적 생성 — 코드톤 착지·도약 제한·블루노트 경유 규칙 기반. 생성 버튼으로 새로고침.",
    bars:bars, generated:true
  };
}
function nearbyNote(prev, rnd, useBlue){
  if(useBlue && rnd()<0.12){ return GEN_BLUE[Math.floor(rnd()*GEN_BLUE.length)]; }
  /* prev와 같은 줄 ±1 안에서 선택 */
  var cands=GEN_POOL.filter(function(p){ return Math.abs(p.s-prev.s)<=1; });
  if(!cands.length) cands=GEN_POOL;
  return cands[Math.floor(rnd()*cands.length)];
}

/* ---- 즐겨찾기/저장 (localStorage) ---- */

/* ---- JamSolo 컴포넌트 ---- */
function JamSolo(props){
  var lead=useLeadPlayer();
  var rootSemiE=props.rootSemiE;
  var keySemiC=props.keySemiC;
  var keyName=props.keyName||"";

  var pid=useState(JAM_SOLOS[0].id); var soloId=pid[0]; var setSoloId=pid[1];
  var gen=useState(null); var genSolo=gen[0]; var setGenSolo=gen[1]; /* 생성된 솔로 */
  var view=useState("ascii"); var tabView=view[0]; var setTabView=view[1]; /* ascii / svg */
  var bpmS=useState(80); var bpm=bpmS[0]; var setBpm=bpmS[1];
  var oct=useState(0); var octShift=oct[0]; var setOctShift=oct[1];
  var crMode=useState(false); var callResp=crMode[0]; var setCallResp=crMode[1]; /* call&response 연습 */
  var favs=useState(loadJamFavs()); var favList=favs[0]; var setFavList=favs[1];
  var seedS=useState(1); var seed=seedS[0]; var setSeed=seedS[1];

  /* 현재 솔로: 생성본 우선, 없으면 라이브러리 */
  var base = genSolo || soloById(soloId);

  /* 이조 + 옥타브 변형 적용 */
  var bars=(function(){
    var t=transposeBars(base.bars, rootSemiE);
    if(octShift!==0){
      t=t.map(function(bar){ return bar.map(function(n){
        if(n.rest) return n;
        var nf=n.f+octShift*12; if(nf<0) nf=n.f;
        return Object.assign({},n,{f:nf});
      }); });
    }
    return t;
  })();

  var flat=flattenBars(bars);
  var flatRef=useRef(flat); flatRef.current=flat;

  /* 프렛보드 하이라이트 */
  useEffect(function(){
    if(!props.onHighlight) return;
    var n=flatRef.current[lead.stepIdx];
    if(lead.stepIdx>=0 && n && !n.rest){ props.onHighlight({string:n.s, fret:n.f}); }
    else { props.onHighlight(null); }
  },[lead.stepIdx]);
  useEffect(function(){ if(!lead.playing && props.onHighlight) props.onHighlight(null); },[lead.playing]);

  /* 재생: call&response면 짝수쌍 마디만? → 단순화: 전체 재생.
     call&response 토글 시 백킹과 맞춰 듣고 따라치는 안내만 표시 */
  function handlePlay(){ lead.toggle({bpm:bpm, notes:flatRef.current, loop:true}); }

  /* 솔로/키/옥타브/생성 바뀌면 재생 중단 (인덱스 안전) */
  useEffect(function(){ if(lead.playing) lead.stop(); },[soloId, octShift, rootSemiE, genSolo]);
  useEffect(function(){ setBpm(base.bpm||80); },[soloId, genSolo]);

  function doGenerate(){
    var ns=seed+1; setSeed(ns);
    var g=generate12BarSolo({seed:ns*7919, style:base.style, bpm:bpm, chords:base.chords});
    setGenSolo(g);
  }
  function clearGenerate(){ setGenSolo(null); }

  function doFav(){
    var snap={ id:"fav_"+Date.now(), name:(base.name)+" ("+keyName+")",
      bars:base.bars, chords:base.chords, style:base.style, scale:base.scale,
      bpm:bpm, level:"저장", desc:base.desc, ts:Date.now() };
    var arr=favList.concat([snap]); saveJamFavs(arr); setFavList(arr);
  }
  function loadFav(f){ setGenSolo(f); }
  function delFav(id){ var arr=favList.filter(function(f){return f.id!==id;}); saveJamFavs(arr); setFavList(arr); }

  /* ASCII 타브 (마디별 → 4마디씩 가로 행) */
  var ascii = buildAsciiTab(bars, base.chords, keySemiC);
  var asciiRows = buildAsciiRows(ascii, 4);

  /* 현재 재생 마디 */
  var curBar = (lead.stepIdx>=0 && flat[lead.stepIdx]) ? flat[lead.stepIdx].bar : -1;
  /* 현재 재생 음의 마디내 셀 인덱스 (ascii 마커용) */
  var curFlat = lead.stepIdx;

  var levels=["입문","중급","고급"];
  var levelColor={입문:"#10b981",중급:"#6366f1",고급:"#a855f7",생성:"#f59e0b",저장:"#0ea5e9"};

  function soloButtons(){
    return levels.map(function(lv){
      var items=JAM_SOLOS.filter(function(p){return p.level===lv;});
      if(!items.length) return null;
      return e("div",{key:lv,className:"bk-row",style:{marginTop:"6px"}},
        e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px",minWidth:"40px",color:levelColor[lv]}},lv),
        items.map(function(p){
          return e("button",{key:p.id,className:"mini-btn"+((!genSolo&&soloId===p.id)?" on":""),
            onClick:function(){ setGenSolo(null); setSoloId(p.id); }}, p.name);
        })
      );
    });
  }

  /* ASCII 타브 행 렌더 (4마디 가로) — 헤더(마디번호+코드) + 리듬/마커 + 6선 */
  function renderAsciiRow(rowData, rowIdx){
    /* 헤더 라인: monospace 공백으로 각 마디 시작 컬럼에 코드 배치 */
    var headStr="";
    for(var h=0;h<rowData.heads.length;h++){
      var hd=rowData.heads[h];
      var label=hd.barNo+(hd.chord?" "+hd.chord:"");
      while(headStr.length < hd.startCol) headStr+=" ";
      headStr+=label;
    }
    /* 마커 라인: 현재 음이 이 행에 있으면 전역 gcol에 ▼, 아니면 리듬 라인 */
    var showMarker=false; var markerStr="";
    if(curFlat>=0){
      for(var i=0;i<rowData.cells.length;i++){
        if(rowData.cells[i].ci===curFlat){
          markerStr=repeatCh(" ", rowData.cells[i].gcol)+"\u25BC";
          showMarker=true; break;
        }
      }
    }
    /* 현재 재생 마디가 이 행에 포함되면 행 강조 */
    var rowHasCur = (curBar>=rowIdx*4 && curBar<rowIdx*4+4);
    return e("div",{key:rowIdx, className:"jam-row"+(rowHasCur?" cur":"")},
      e("div",{className:"jam-row-head"}, headStr),
      e("div",{className:"jam-rhythm"}, showMarker? markerStr : rowData.rhythm),
      rowData.lines.map(function(ln,i){
        return e("div",{key:i, className:"jam-tab-line"}, ln);
      })
    );
  }

  /* SVG 타브 마디 렌더 */
  function renderSvgBar(bar, bIdx){
    var isCur=(curBar===bIdx);
    var W=300, padL=26, padT=16, rowH=15, H=padT+5*rowH+34;
    var items=layoutSvgBar(bar, {w:W,padL:padL,rowH:rowH,padT:padT});
    var strLabels=["e","B","G","D","A","E"];
    var els=[];
    /* 줄 */
    for(var s=0;s<6;s++){
      var y=padT+s*rowH;
      els.push(e("line",{key:"s"+s,x1:padL,y1:y,x2:W-6,y2:y,stroke:"#33406b",strokeWidth:1}));
      els.push(e("text",{key:"sl"+s,x:padL-16,y:y+4,fontSize:9,fill:"#6b78a8"},strLabels[s]));
    }
    /* 마디선 */
    els.push(e("line",{key:"barL",x1:padL,y1:padT,x2:padL,y2:padT+5*rowH,stroke:"#5566aa",strokeWidth:2}));
    els.push(e("line",{key:"barR",x1:W-6,y1:padT,x2:W-6,y2:padT+5*rowH,stroke:"#5566aa",strokeWidth:2}));
    /* 음 */
    items.forEach(function(it,ii){
      var n=it.note; var y=it.y; var x=it.x;
      var isPlay=(isCur && flat[curFlat] && !flat[curFlat].rest &&
                  flat[curFlat].s===n.s && flat[curFlat].f===n.f && curBarCellMatch(bIdx, n, ii));
      var fnum=(n.f<0?"x":String(n.f));
      /* 프렛 숫자 */
      els.push(e("rect",{key:"nb"+ii,x:x-7,y:y-7,width:14+(fnum.length-1)*5,height:14,rx:3,
        fill:isPlay?"#22d3ee":"#1a2138",stroke:"none"}));
      els.push(e("text",{key:"nt"+ii,x:x,y:y+4,fontSize:10,fill:isPlay?"#06283d":"#dbe2f7",
        textAnchor:"middle",fontWeight:"700"},fnum));
      /* 주법 마킹 */
      var art=n.art||"";
      if(art==="b"||art==="hb"||art==="pb"){ /* 벤딩 화살표 ↗ */
        var amt=(art==="hb")?"½":(art==="pb")?"P":"full";
        els.push(e("text",{key:"ar"+ii,x:x+10,y:y-6,fontSize:8,fill:"#f59e0b",fontWeight:"700"},"\u2197"));
        els.push(e("text",{key:"av"+ii,x:x+16,y:y-2,fontSize:7,fill:"#f59e0b"},amt));
      } else if(art==="r"||art==="br"){
        els.push(e("text",{key:"rr"+ii,x:x+10,y:y-6,fontSize:8,fill:"#f59e0b"},"\u2198"));
      } else if(art==="/"){
        els.push(e("text",{key:"sl"+ii,x:x+9,y:y-4,fontSize:10,fill:"#10b981"},"/"));
      } else if(art==="\\"){
        els.push(e("text",{key:"sd"+ii,x:x+9,y:y-4,fontSize:10,fill:"#10b981"},"\\"));
      } else if(art==="h"){
        els.push(e("text",{key:"hh"+ii,x:x+7,y:y-7,fontSize:7,fill:"#a855f7",fontWeight:"700"},"H"));
      } else if(art==="p"){
        els.push(e("text",{key:"pp"+ii,x:x+7,y:y-7,fontSize:7,fill:"#a855f7",fontWeight:"700"},"P"));
      } else if(art==="~"){
        els.push(e("text",{key:"vv"+ii,x:x+9,y:y+1,fontSize:9,fill:"#ef4444"},"\u3030"));
      }
      /* 음표 길이: 기둥/머리 색으로 (아래 작은 글리프) */
      els.push(e("text",{key:"dg"+ii,x:x,y:padT+5*rowH+14,fontSize:9,fill:"#6b78a8",textAnchor:"middle"},
        durGlyphShort(n.d)));
    });
    return e("div",{key:bIdx, className:"jam-svg-bar"+(isCur?" cur":"")},
      e("div",{className:"jam-bar-head"},
        e("span",{className:"jam-bar-no"}, "마디 "+(bIdx+1)),
        ascii[bIdx] && ascii[bIdx].chord? e("span",{className:"jam-bar-chord"}, ascii[bIdx].chord): null
      ),
      e("svg",{viewBox:"0 0 "+W+" "+H, width:"100%", style:{maxWidth:"320px"}}, els)
    );
  }
  /* SVG에서 현재 재생 음 매칭 (마디+음 인덱스) */
  function curBarCellMatch(bIdx, n, itemIdx){
    if(curBar!==bIdx) return false;
    /* flat 인덱스 → 이 마디 내 몇 번째 비쉼표 음인지 비교 */
    var count=0;
    for(var b=0;b<bIdx;b++){ count+=bars[b].length; }
    /* curFlat가 이 마디 범위인지 */
    var start=count, end=count+bars[bIdx].length;
    return curFlat>=start && curFlat<end;
  }

  /* 주법 범례 */
  var legendArts=["b","hb","r","h","p","/","\\","~","x"];

  return e("div",{className:"card"},
    e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}},
      e("div",{className:"sec-label",style:{marginBottom:0}},"\uD83C\uDFB8 12\ub9c8\ub514 \ube14\ub8e8\uc2a4 \uc194\ub85c ("+keyName+" \ud0a4)"),
      e("span",{style:{fontSize:"11px",fontWeight:"700",color:levelColor[base.level]||"#8a92b0",
        padding:"2px 8px",borderRadius:"10px",background:"#f3f5fb"}},
        base.level+" · "+(base.scale==="minPenta"?"마이너펜타":base.scale==="majPenta"?"메이저펜타":base.scale==="blues"?"블루스":base.scale==="natMinor"?"내추럴마이너":base.scale))
    ),
    e("div",{style:{fontSize:"12px",color:"#8a92b0",marginTop:"2px"}}, base.desc),

    /* 솔로 선택 */
    soloButtons(),

    /* 생성기 + 즐겨찾기 줄 */
    e("div",{className:"bk-row",style:{marginTop:"8px"}},
      e("button",{className:"mini-btn"+(genSolo&&genSolo.generated?" on":""),
        onClick:doGenerate, style:{background:"#fff7ed",borderColor:"#fb923c",color:"#ea580c"}},
        "\u2728 12\ubc14 \uc0dd\uc131"),
      genSolo? e("button",{className:"mini-btn",onClick:clearGenerate},"\u21a9 \ub77c\uc774\ube0c\ub7ec\ub9ac\ub85c"):null,
      e("button",{className:"mini-btn",onClick:doFav,style:{borderColor:"#0ea5e9",color:"#0369a1"}},"\u2605 \uc800\uc7a5"),
      e("label",{className:"bk-track",style:{fontSize:"12px"}},
        e("input",{type:"checkbox",checked:callResp,onChange:function(){setCallResp(!callResp);}}),"call&response \uc5f0\uc2b5")
    ),
    callResp? e("div",{style:{fontSize:"11px",color:"#6366f1",marginTop:"2px",fontWeight:"700"}},
      "\ud83d\udd01 \uc9dd\uc218 \ub9c8\ub514(1-2,5-6,9-10)\ub294 call \u00b7 \ud640\uc218 \ub9c8\ub514\ub294 \uc9c1\uc811 \ub530\ub77c\uce58\uae30(response) \u2014 \ubc31\ud0b9\uacfc \ud568\uaed8") : null,

    /* 즐겨찾기 목록 */
    favList.length? e("div",{className:"bk-row",style:{marginTop:"4px"}},
      e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px",color:"#0ea5e9"}},"\u2605 \uc800\uc7a5"),
      favList.slice().reverse().slice(0,8).map(function(f){
        return e("span",{key:f.id,style:{display:"inline-flex",alignItems:"center",gap:"3px"}},
          e("button",{className:"mini-btn"+(genSolo&&genSolo.id===f.id?" on":""),
            onClick:function(){ loadFav(f); }}, f.name),
          e("button",{className:"mini-btn",style:{padding:"7px 8px",color:"#ef4444"},
            onClick:function(){ delFav(f.id); }}, "\u00d7"));
      })
    ): null,

    /* 타브 뷰 토글 + 주법 범례 */
    e("div",{className:"bk-row",style:{marginTop:"10px",justifyContent:"space-between"}},
      e("div",{style:{display:"flex",gap:"6px"}},
        e("button",{className:"mini-btn"+(tabView==="ascii"?" on":""),onClick:function(){setTabView("ascii");}},"\ud0a4\ub9ac\ub4ec \ud0c0\ube0c"),
        e("button",{className:"mini-btn"+(tabView==="svg"?" on":""),onClick:function(){setTabView("svg");}},"\uadf8\ub798\ud53d \ud0c0\ube0c")
      )
    ),

    /* 타브 본문 */
    tabView==="ascii"
      ? e("div",{className:"jam-tab jam-tab-rows"},
          asciiRows.map(function(rd,i){ return renderAsciiRow(rd,i); }))
      : e("div",{className:"jam-svg-grid"},
          bars.map(function(bar,i){ return renderSvgBar(bar,i); })),

    /* 현재 음/마디 표시 */
    lead.playing && curBar>=0
      ? e("div",{style:{fontSize:"12px",color:"var(--indigo)",fontWeight:"700",marginTop:"6px"}},
          "\u25B6 마디 "+(curBar+1)+"/12"+(flat[curFlat]&&!flat[curFlat].rest?
            " · "+(6-flat[curFlat].s)+"번줄 "+flat[curFlat].f+"프렛"+
            (flat[curFlat].art&&ART_LABEL[flat[curFlat].art]?" ("+ART_LABEL[flat[curFlat].art]+")":""):""))
      : null,

    /* 주법 범례 */
    e("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",marginTop:"8px",fontSize:"11px",color:"#8a92b0"}},
      legendArts.map(function(a){
        return e("span",{key:a},e("b",{style:{color:"#5b6ef5"}},ART_TAB[a]||a),"="+ART_LABEL[a]);
      })
    ),

    /* 변형(옥타브) */
    e("div",{className:"bk-row",style:{marginTop:"8px"}},
      e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px"}},"변형"),
      [["-1","옥타브↓"],["0","원본"],["1","옥타브↑"]].map(function(o){
        var v=parseInt(o[0],10);
        return e("button",{key:o[0],className:"mini-btn"+(octShift===v?" on":""),
          onClick:function(){ setOctShift(v); }}, o[1]);
      })
    ),

    /* BPM */
    e("div",{className:"bk-row"},
      e("button",{className:"step-btn",onClick:function(){ setBpm(Math.max(40,bpm-5)); }},"-5"),
      e("div",{className:"bpm-val",style:{color:"var(--purple)"}},bpm),
      e("button",{className:"step-btn",onClick:function(){ setBpm(Math.min(240,bpm+5)); }},"+5"),
      e("input",{type:"range",className:"slider",min:40,max:240,value:bpm,
        onChange:function(ev){ setBpm(parseInt(ev.target.value,10)); }})
    ),
    e("button",{className:"bk-big"+(lead.playing?" playing":""),onClick:handlePlay},
      lead.playing?"\u25A0 정지":"\u25B6 솔로 재생 (12마디 루프)"),
    e("div",{style:{fontSize:"11px",color:"#8a92b0",marginTop:"6px",textAlign:"center"}},
      "위 백킹 트랙을 같은 키로 함께 재생하면 12마디 잼 연습이 됩니다")
  );
}


/* ---------------- 세션 저장 ---------------- */
=======
function normalizeBars(bars){
  return bars.map(function(bar){
    var sum=0, i;
    for(i=0;i<bar.length;i++){ sum+=(bar[i].d||0); }
    if(sum===16) return bar;
    var nb=bar.slice();
    if(sum<16){ nb.push({rest:true, d:16-sum}); }
    else { /* 초과: 끝에서부터 줄임 */
      while(sum>16 && nb.length){ var last=nb[nb.length-1]; 
        if((last.d||0) <= (sum-16)){ sum-=(last.d||0); nb.pop(); }
        else { nb[nb.length-1]=Object.assign({}, last, {d:last.d-(sum-16)}); sum=16; }
      }
    }
    return nb;
  });
}
/* 로드 시 1회 정규화 (개발 중 길이 실수 자동 보정) */
(function(){ for(var i=0;i<JAM_SOLOS.length;i++){ JAM_SOLOS[i].bars=normalizeBars(JAM_SOLOS[i].bars); } })();

/* ---- 주법 표기 매핑 ---- */
function repeatCh(c,n){ var s=""; for(var i=0;i<n;i++) s+=c; return s; }
var ART_TAB = { "h":"h","p":"p","b":"b","hb":"b","br":"b","pb":"b","r":"r",
  "/":"/","\\":"\\","~":"~","x":"x","t":"t","":"" };
var ART_LABEL = { "h":"해머온","p":"풀오프","b":"풀벤딩","hb":"하프벤딩","br":"벤드릴리스",
  "pb":"프리벤드","r":"릴리스","/":"슬라이드업","\\":"슬라이드다운","~":"비브라토",
  "x":"뮤트","t":"태핑" };

/* ---- 길이(16분 단위) → 리듬 기호 ---- */
function durSym(d){
  switch(d){
    case 1: return "\u266F"; /* 16분 (♯ 대용 표기 회피, 아래 매핑 사용) */
    default: return "";
  }
}
/* 정확한 음표 기호: 16분=𝅘𝅥𝅯 류는 폰트 의존 → 단순 ASCII 기호로 */
var DUR_GLYPH = {
  1:"\u266C",   /* 16분 ♬ */
  2:"\u266A",   /* 8분 ♪ */
  3:"\u266A.",  /* 점8분 */
  4:"\u2669",   /* 4분 ♩ */
  6:"\u2669.",  /* 점4분 */
  8:"\u{1D15E}",/* 2분 (폴백 처리) */
  12:"\u{1D15E}.",
  16:"\u{1D15D}"/* 온음표 */
};
function durGlyph(d){ return DUR_GLYPH[d] || "\u2669"; }

/* ---- 12마디 → flat 음 배열 (재생용). 쉼표 포함, 마디 인덱스 부착 ---- */
function flattenBars(bars){
  var out=[]; 
  for(var b=0;b<bars.length;b++){
    var bar=bars[b];
    for(var i=0;i<bar.length;i++){
      var n=bar[i];
      out.push(Object.assign({}, n, {bar:b}));
    }
  }
  return out;
}
/* 마디 길이 합 검증 (개발용; 16이 아니면 콘솔 경고) */
function validateBars(solo){
  for(var b=0;b<solo.bars.length;b++){
    var sum=0; var bar=solo.bars[b];
    for(var i=0;i<bar.length;i++){ sum+=(bar[i].d||0); }
    if(sum!==16){ try{ console.warn("[jam] "+solo.id+" 마디"+(b+1)+" 길이합="+sum); }catch(e){} }
  }
}

/* ---- 이조: A(5프렛) 기준 → rootSemiE에 맞춰 프렛 시프트 ---- */
function transposeBars(bars, rootSemiE){
  var shift=((rootSemiE - JAM_BASE_ROOT)%12+12)%12;
  return bars.map(function(bar){
    return bar.map(function(n){
      if(n.rest) return Object.assign({}, n);
      var nf=n.f+shift; if(nf<0) nf+=12;
      return Object.assign({}, n, {f:nf});
    });
  });
}

/* ========================================================================
   ASCII 타브 렌더 — 마디 단위 줄바꿈, 각 마디 위에 리듬 라인.
   반환: [{barNo, chord, rhythm:문자열, lines:[6줄], cells:[{ci,col,len,note}]}]
   cells: 전역 flat 인덱스(ci)와 화면상 컬럼(col)·셀폭(len)·음 매핑 (마커/하이라이트용)
   ======================================================================== */
function buildAsciiTab(bars, chordsSemi, keySemiC){
  var strLabels=["e","B","G","D","A","E"]; /* 위→아래 = 1번줄~6번줄 */
  var result=[]; var flatIdx=0;
  for(var b=0;b<bars.length;b++){
    var bar=bars[b];
    var rows=[[],[],[],[],[],[]];
    var rhythmCells=[];
    var cells=[];
    var prefix="X|"; var col=prefix.length;
    for(var i=0;i<bar.length;i++){
      var n=bar[i];
      var cell, rsym;
      if(n.rest){
        cell="-"; rsym=" ";
      } else {
        var fnum=(n.f<0?"x":String(n.f));
        var art=ART_TAB[n.art]||"";
        var pre=(art==="/"||art==="\\"||art==="h"||art==="p"||art==="t")?art:"";
        var post=(art==="b"||art==="r"||art==="~")?art:"";
        cell=pre+fnum+post;
        rsym=durGlyphShort(n.d);
        cells.push({ci:flatIdx, col:col, len:cell.length, note:n});
      }
      var row=n.rest? -1 : (5-n.s);
      for(var r=0;r<6;r++){
        if(r===row){ rows[r].push(cell); }
        else { rows[r].push(repeatCh("-", cell.length)); }
      }
      /* 리듬 라인: 셀 폭에 맞춰 기호 + 패딩 */
      rhythmCells.push(padRight(rsym, cell.length));
      /* 음 사이 구분 */
      var gap="-";
      for(var r2=0;r2<6;r2++){ rows[r2].push(gap); }
      rhythmCells.push(repeatCh(" ", gap.length));
      col += cell.length + gap.length;
      flatIdx++;
    }
    var lines=[];
    for(var k=0;k<6;k++){ lines.push(strLabels[k]+"|"+rows[k].join("")+"|"); }
    var chordLabel = chordsSemi? SEMITONE_KEY[((keySemiC+chordsSemi[b])%12+12)%12]+"7" : "";
    result.push({
      barNo:b+1, chord:chordLabel,
      rhythm:"  "+rhythmCells.join(""), /* prefix(2) 정렬 */
      lines:lines, cells:cells, width:col+1
    });
  }
  return result;
}
/* 리듬 라인용 짧은 기호 (셀 폭 안에 들어가게) */
function durGlyphShort(d){
  var m={1:"\u266C",2:"\u266A",3:"\u266A.",4:"\u2669",6:"\u2669.",8:"o",12:"o.",16:"O"};
  return m[d]||"\u2669";
}
function padRight(s,w){ while(s.length<w) s+=" "; return s.length>w? s.slice(0,w): s; }

/* 마디 데이터(buildAsciiTab 결과)를 perRow개씩 가로로 이어붙여 라인 그룹 생성.
   반환: [{bars:[원본마디데이터+barOffsetCol], rhythm:문자열, lines:[6줄], heads:[{barNo,chord,startCol}]}]
   각 셀의 전역 컬럼 = 라벨(1)+| 누적. 마커/하이라이트는 전역 col 사용. */
function buildAsciiRows(barsData, perRow){
  perRow=perRow||4;
  var strLabels=["e","B","G","D","A","E"];
  var groups=[];
  for(var g=0; g<barsData.length; g+=perRow){
    var chunk=barsData.slice(g, g+perRow);
    var rowStr=["","","","","",""]; /* 6선 */
    var rhythmStr="";
    var heads=[];
    var globalCells=[]; /* {ci, gcol, len} 전역 컬럼 */
    /* 시작: 라벨 1칸. 첫 마디선 | 은 각 마디 lines가 자체 보유 */
    var prefixLen=1; /* "e" 라벨 폭 */
    /* 리듬 라인 prefix: 라벨(1)만큼 공백 */
    rhythmStr=repeatCh(" ", prefixLen);
    for(var r=0;r<6;r++){ rowStr[r]=strLabels[r]; }
    var acc=prefixLen; /* 전역 컬럼 누적 (라벨 다음부터) */
    for(var c=0;c<chunk.length;c++){
      var bd=chunk[c];
      /* bd.lines[k] = "e|....|" → 라벨 제거하고 "|....|" 본문만 사용 */
      for(var k=0;k<6;k++){
        var body=bd.lines[k].slice(1); /* 라벨 1글자 제거 → "|....|" */
        rowStr[k]+=body;
      }
      /* 리듬: bd.rhythm = "  "+cells... (prefix 2). 라벨 정렬 위해 "|" 자리 보정.
         본문 시작이 "|"(1) 다음이므로 리듬도 " "(마디선 자리) + 리듬내용 */
      var rbody=bd.rhythm.slice(2); /* "  " 제거 */
      rhythmStr+=" "+rbody+" "; /* 앞 |, 뒤 | 자리 공백 */
      /* head: 이 마디가 전역에서 시작하는 컬럼 (마디선 | 다음) */
      var barStartCol=acc+1; /* | 다음 */
      heads.push({barNo:bd.barNo, chord:bd.chord, startCol:barStartCol});
      /* 셀 전역 컬럼: bd.cells[].col 은 마디내 "X|" 기준(col≥2). 본문에서 "|"가 col1 위치.
         전역 = acc + (col - 1)  ('X' 라벨 1글자를 빼고 | 부터 이으므로) */
      for(var ci2=0; ci2<bd.cells.length; ci2++){
        var cell=bd.cells[ci2];
        globalCells.push({ci:cell.ci, gcol:acc+(cell.col-1), len:cell.len, note:cell.note});
      }
      acc += (bd.lines[0].length-1); /* 본문 길이("|....|") 만큼 전진 */
    }
    var lines=[];
    for(var kk=0;kk<6;kk++){ lines.push(rowStr[kk]); }
    groups.push({ heads:heads, rhythm:rhythmStr, lines:lines, cells:globalCells, width:acc+1 });
  }
  return groups;
}

/* ========================================================================
   SVG 타브 렌더 데이터 — 마디별 음을 좌표로 배치. 벤딩 화살표·슬라이드·슬러·비브라토.
   컴포넌트(JamSolo)에서 직접 그리도록 좌표 계산 함수 제공.
   ======================================================================== */
function layoutSvgBar(bar, opts){
  /* opts: {w, padL, rowH, padT} 한 마디 폭 안에 음을 길이비례 배치 */
  var W=opts.w, padL=opts.padL, rowH=opts.rowH, padT=opts.padT;
  var inner=W-padL-8;
  var totalDur=0, i;
  for(i=0;i<bar.length;i++){ totalDur+=(bar[i].d||0); }
  if(totalDur<=0) totalDur=16;
  var items=[]; var acc=0;
  for(i=0;i<bar.length;i++){
    var n=bar[i];
    var x=padL + (acc/totalDur)*inner + ((n.d||0)/totalDur)*inner*0.5;
    if(!n.rest){
      items.push({ note:n, x:x, y:padT+(5-n.s)*rowH, w:((n.d||0)/totalDur)*inner });
    }
    acc+=(n.d||0);
  }
  return items;
}

/* ========================================================================
   절차적 12바 생성기 — 코드 진행 위에 마디별 모티프를 음악 제약으로 생성.
   제약: 마디 첫 음은 코드톤 근처 착지, 도약 ≤ 펜타 2스텝, 마디 끝 음 길이감.
   ======================================================================== */
/* A 마이너펜타 박스1 음 풀 (string,fret) — 5프렛 박스 기준 */
var GEN_POOL = [
  {s:0,f:5},{s:0,f:8},{s:1,f:5},{s:1,f:7},{s:2,f:5},{s:2,f:7},
  {s:3,f:5},{s:3,f:7},{s:4,f:5},{s:4,f:8},{s:5,f:5},{s:5,f:8}
];
/* 블루노트 ♭5 (A블루스: 6프렛/G줄 등) */
var GEN_BLUE = [{s:3,f:8},{s:2,f:8}];

function genRand(seed){ /* 간단 LCG */
  var s=seed||Math.floor(Math.random()*1e9);
  return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
}
/* 리듬 패턴 풀 (마디=16) */
var GEN_RHYTHMS = [
  [4,2,2,4,4],[2,2,4,2,2,4],[4,4,2,2,4],[2,2,2,2,4,4],
  [4,2,2,2,2,4],[6,2,4,4],[2,2,2,2,2,2,2,2],[4,4,4,4],
  [3,1,2,2,4,4],[2,2,4,4,2,2]
];
function generate12BarSolo(opts){
  opts=opts||{};
  var rnd=genRand(opts.seed);
  var density=opts.density||0.6; /* 음 밀도 */
  var useBlue=opts.blue!==false;
  var chords=opts.chords||BLUES12_CHORDS;
  var bars=[];
  var prev=GEN_POOL[4]; /* 시작: 3번줄 5프렛 근처 */
  for(var b=0;b<12;b++){
    var rhythm=GEN_RHYTHMS[Math.floor(rnd()*GEN_RHYTHMS.length)];
    var bar=[]; var filled=0;
    for(var i=0;i<rhythm.length;i++){
      var d=rhythm[i];
      /* 쉼표 확률 (밀도 반비례, 마디 끝쪽 더 자주) */
      if(rnd() > density && i>0){ bar.push(JR(d)); filled+=d; continue; }
      /* 다음 음: prev 근처에서 선택 (도약 제한) */
      var cand=nearbyNote(prev, rnd, useBlue);
      var art="";
      /* 주법: 긴 음에 벤딩/비브라토, 짧은 연속음에 해머/풀오프 */
      if(d>=4 && rnd()<0.35){ art=(rnd()<0.5?"b":"~"); }
      else if(d<=2 && rnd()<0.2){ art=(cand.f>prev.f?"h":"p"); }
      bar.push(JN(cand.s,cand.f,d,art));
      prev=cand; filled+=d;
    }
    /* 길이 보정: 합이 16 안되면 마지막에 쉼표/연장 */
    if(filled<16){ bar.push(JR(16-filled)); }
    else if(filled>16){ /* 초과분 잘라내기 */
      while(filled>16 && bar.length){ var last=bar.pop(); filled-=(last.d||0); }
      if(filled<16) bar.push(JR(16-filled));
    }
    bars.push(bar);
  }
  return {
    id:"solo_generated", name:"AI 생성 솔로", level:"생성", style:opts.style||"shuffle",
    scale:"minPenta", bpm:opts.bpm||90, chords:chords,
    desc:"절차적 생성 — 코드톤 착지·도약 제한·블루노트 경유 규칙 기반. 생성 버튼으로 새로고침.",
    bars:bars, generated:true
  };
}
function nearbyNote(prev, rnd, useBlue){
  if(useBlue && rnd()<0.12){ return GEN_BLUE[Math.floor(rnd()*GEN_BLUE.length)]; }
  /* prev와 같은 줄 ±1 안에서 선택 */
  var cands=GEN_POOL.filter(function(p){ return Math.abs(p.s-prev.s)<=1; });
  if(!cands.length) cands=GEN_POOL;
  return cands[Math.floor(rnd()*cands.length)];
}

/* ---- 즐겨찾기/저장 (localStorage) ---- */

/* ---- JamSolo 컴포넌트 ---- */
function JamSolo(props){
  var lead=useLeadPlayer();
  var rootSemiE=props.rootSemiE;
  var keySemiC=props.keySemiC;
  var keyName=props.keyName||"";

  var pid=useState(JAM_SOLOS[0].id); var soloId=pid[0]; var setSoloId=pid[1];
  var gen=useState(null); var genSolo=gen[0]; var setGenSolo=gen[1]; /* 생성된 솔로 */
  var view=useState("ascii"); var tabView=view[0]; var setTabView=view[1]; /* ascii / svg */
  var bpmS=useState(80); var bpm=bpmS[0]; var setBpm=bpmS[1];
  var oct=useState(0); var octShift=oct[0]; var setOctShift=oct[1];
  var crMode=useState(false); var callResp=crMode[0]; var setCallResp=crMode[1]; /* call&response 연습 */
  var favs=useState(loadJamFavs()); var favList=favs[0]; var setFavList=favs[1];
  var seedS=useState(1); var seed=seedS[0]; var setSeed=seedS[1];

  /* 현재 솔로: 생성본 우선, 없으면 라이브러리 */
  var base = genSolo || soloById(soloId);

  /* 이조 + 옥타브 변형 적용 */
  var bars=(function(){
    var t=transposeBars(base.bars, rootSemiE);
    if(octShift!==0){
      t=t.map(function(bar){ return bar.map(function(n){
        if(n.rest) return n;
        var nf=n.f+octShift*12; if(nf<0) nf=n.f;
        return Object.assign({},n,{f:nf});
      }); });
    }
    return t;
  })();

  var flat=flattenBars(bars);
  var flatRef=useRef(flat); flatRef.current=flat;

  /* 프렛보드 하이라이트 */
  useEffect(function(){
    if(!props.onHighlight) return;
    var n=flatRef.current[lead.stepIdx];
    if(lead.stepIdx>=0 && n && !n.rest){ props.onHighlight({string:n.s, fret:n.f}); }
    else { props.onHighlight(null); }
  },[lead.stepIdx]);
  useEffect(function(){ if(!lead.playing && props.onHighlight) props.onHighlight(null); },[lead.playing]);

  /* 재생: call&response면 짝수쌍 마디만? → 단순화: 전체 재생.
     call&response 토글 시 백킹과 맞춰 듣고 따라치는 안내만 표시 */
  function handlePlay(){ lead.toggle({bpm:bpm, notes:flatRef.current, loop:true}); }

  /* 솔로/키/옥타브/생성 바뀌면 재생 중단 (인덱스 안전) */
  useEffect(function(){ if(lead.playing) lead.stop(); },[soloId, octShift, rootSemiE, genSolo]);
  useEffect(function(){ setBpm(base.bpm||80); },[soloId, genSolo]);

  function doGenerate(){
    var ns=seed+1; setSeed(ns);
    var g=generate12BarSolo({seed:ns*7919, style:base.style, bpm:bpm, chords:base.chords});
    setGenSolo(g);
  }
  function clearGenerate(){ setGenSolo(null); }

  function doFav(){
    var snap={ id:"fav_"+Date.now(), name:(base.name)+" ("+keyName+")",
      bars:base.bars, chords:base.chords, style:base.style, scale:base.scale,
      bpm:bpm, level:"저장", desc:base.desc, ts:Date.now() };
    var arr=favList.concat([snap]); saveJamFavs(arr); setFavList(arr);
  }
  function loadFav(f){ setGenSolo(f); }
  function delFav(id){ var arr=favList.filter(function(f){return f.id!==id;}); saveJamFavs(arr); setFavList(arr); }

  /* ASCII 타브 (마디별 → 4마디씩 가로 행) */
  var ascii = buildAsciiTab(bars, base.chords, keySemiC);
  var asciiRows = buildAsciiRows(ascii, 4);

  /* 현재 재생 마디 */
  var curBar = (lead.stepIdx>=0 && flat[lead.stepIdx]) ? flat[lead.stepIdx].bar : -1;
  /* 현재 재생 음의 마디내 셀 인덱스 (ascii 마커용) */
  var curFlat = lead.stepIdx;

  var levels=["입문","중급","고급"];
  var levelColor={입문:"#10b981",중급:"#6366f1",고급:"#a855f7",생성:"#f59e0b",저장:"#0ea5e9"};

  function soloButtons(){
    return levels.map(function(lv){
      var items=JAM_SOLOS.filter(function(p){return p.level===lv;});
      if(!items.length) return null;
      return e("div",{key:lv,className:"bk-row",style:{marginTop:"6px"}},
        e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px",minWidth:"40px",color:levelColor[lv]}},lv),
        items.map(function(p){
          return e("button",{key:p.id,className:"mini-btn"+((!genSolo&&soloId===p.id)?" on":""),
            onClick:function(){ setGenSolo(null); setSoloId(p.id); }}, p.name);
        })
      );
    });
  }

  /* ASCII 타브 행 렌더 (4마디 가로) — 헤더(마디번호+코드) + 리듬/마커 + 6선 */
  function renderAsciiRow(rowData, rowIdx){
    /* 헤더 라인: monospace 공백으로 각 마디 시작 컬럼에 코드 배치 */
    var headStr="";
    for(var h=0;h<rowData.heads.length;h++){
      var hd=rowData.heads[h];
      var label=hd.barNo+(hd.chord?" "+hd.chord:"");
      while(headStr.length < hd.startCol) headStr+=" ";
      headStr+=label;
    }
    /* 마커 라인: 현재 음이 이 행에 있으면 전역 gcol에 ▼, 아니면 리듬 라인 */
    var showMarker=false; var markerStr="";
    if(curFlat>=0){
      for(var i=0;i<rowData.cells.length;i++){
        if(rowData.cells[i].ci===curFlat){
          markerStr=repeatCh(" ", rowData.cells[i].gcol)+"\u25BC";
          showMarker=true; break;
        }
      }
    }
    /* 현재 재생 마디가 이 행에 포함되면 행 강조 */
    var rowHasCur = (curBar>=rowIdx*4 && curBar<rowIdx*4+4);
    return e("div",{key:rowIdx, className:"jam-row"+(rowHasCur?" cur":"")},
      e("div",{className:"jam-row-head"}, headStr),
      e("div",{className:"jam-rhythm"}, showMarker? markerStr : rowData.rhythm),
      rowData.lines.map(function(ln,i){
        return e("div",{key:i, className:"jam-tab-line"}, ln);
      })
    );
  }

  /* SVG 타브 마디 렌더 */
  function renderSvgBar(bar, bIdx){
    var isCur=(curBar===bIdx);
    var W=300, padL=26, padT=16, rowH=15, H=padT+5*rowH+34;
    var items=layoutSvgBar(bar, {w:W,padL:padL,rowH:rowH,padT:padT});
    var strLabels=["e","B","G","D","A","E"];
    var els=[];
    /* 줄 */
    for(var s=0;s<6;s++){
      var y=padT+s*rowH;
      els.push(e("line",{key:"s"+s,x1:padL,y1:y,x2:W-6,y2:y,stroke:"#33406b",strokeWidth:1}));
      els.push(e("text",{key:"sl"+s,x:padL-16,y:y+4,fontSize:9,fill:"#6b78a8"},strLabels[s]));
    }
    /* 마디선 */
    els.push(e("line",{key:"barL",x1:padL,y1:padT,x2:padL,y2:padT+5*rowH,stroke:"#5566aa",strokeWidth:2}));
    els.push(e("line",{key:"barR",x1:W-6,y1:padT,x2:W-6,y2:padT+5*rowH,stroke:"#5566aa",strokeWidth:2}));
    /* 음 */
    items.forEach(function(it,ii){
      var n=it.note; var y=it.y; var x=it.x;
      var isPlay=(isCur && flat[curFlat] && !flat[curFlat].rest &&
                  flat[curFlat].s===n.s && flat[curFlat].f===n.f && curBarCellMatch(bIdx, n, ii));
      var fnum=(n.f<0?"x":String(n.f));
      /* 프렛 숫자 */
      els.push(e("rect",{key:"nb"+ii,x:x-7,y:y-7,width:14+(fnum.length-1)*5,height:14,rx:3,
        fill:isPlay?"#22d3ee":"#1a2138",stroke:"none"}));
      els.push(e("text",{key:"nt"+ii,x:x,y:y+4,fontSize:10,fill:isPlay?"#06283d":"#dbe2f7",
        textAnchor:"middle",fontWeight:"700"},fnum));
      /* 주법 마킹 */
      var art=n.art||"";
      if(art==="b"||art==="hb"||art==="pb"){ /* 벤딩 화살표 ↗ */
        var amt=(art==="hb")?"½":(art==="pb")?"P":"full";
        els.push(e("text",{key:"ar"+ii,x:x+10,y:y-6,fontSize:8,fill:"#f59e0b",fontWeight:"700"},"\u2197"));
        els.push(e("text",{key:"av"+ii,x:x+16,y:y-2,fontSize:7,fill:"#f59e0b"},amt));
      } else if(art==="r"||art==="br"){
        els.push(e("text",{key:"rr"+ii,x:x+10,y:y-6,fontSize:8,fill:"#f59e0b"},"\u2198"));
      } else if(art==="/"){
        els.push(e("text",{key:"sl"+ii,x:x+9,y:y-4,fontSize:10,fill:"#10b981"},"/"));
      } else if(art==="\\"){
        els.push(e("text",{key:"sd"+ii,x:x+9,y:y-4,fontSize:10,fill:"#10b981"},"\\"));
      } else if(art==="h"){
        els.push(e("text",{key:"hh"+ii,x:x+7,y:y-7,fontSize:7,fill:"#a855f7",fontWeight:"700"},"H"));
      } else if(art==="p"){
        els.push(e("text",{key:"pp"+ii,x:x+7,y:y-7,fontSize:7,fill:"#a855f7",fontWeight:"700"},"P"));
      } else if(art==="~"){
        els.push(e("text",{key:"vv"+ii,x:x+9,y:y+1,fontSize:9,fill:"#ef4444"},"\u3030"));
      }
      /* 음표 길이: 기둥/머리 색으로 (아래 작은 글리프) */
      els.push(e("text",{key:"dg"+ii,x:x,y:padT+5*rowH+14,fontSize:9,fill:"#6b78a8",textAnchor:"middle"},
        durGlyphShort(n.d)));
    });
    return e("div",{key:bIdx, className:"jam-svg-bar"+(isCur?" cur":"")},
      e("div",{className:"jam-bar-head"},
        e("span",{className:"jam-bar-no"}, "마디 "+(bIdx+1)),
        ascii[bIdx] && ascii[bIdx].chord? e("span",{className:"jam-bar-chord"}, ascii[bIdx].chord): null
      ),
      e("svg",{viewBox:"0 0 "+W+" "+H, width:"100%", style:{maxWidth:"320px"}}, els)
    );
  }
  /* SVG에서 현재 재생 음 매칭 (마디+음 인덱스) */
  function curBarCellMatch(bIdx, n, itemIdx){
    if(curBar!==bIdx) return false;
    /* flat 인덱스 → 이 마디 내 몇 번째 비쉼표 음인지 비교 */
    var count=0;
    for(var b=0;b<bIdx;b++){ count+=bars[b].length; }
    /* curFlat가 이 마디 범위인지 */
    var start=count, end=count+bars[bIdx].length;
    return curFlat>=start && curFlat<end;
  }

  /* 주법 범례 */
  var legendArts=["b","hb","r","h","p","/","\\","~","x"];

  return e("div",{className:"card"},
    e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}},
      e("div",{className:"sec-label",style:{marginBottom:0}},"\uD83C\uDFB8 12\ub9c8\ub514 \ube14\ub8e8\uc2a4 \uc194\ub85c ("+keyName+" \ud0a4)"),
      e("span",{style:{fontSize:"11px",fontWeight:"700",color:levelColor[base.level]||"#8a92b0",
        padding:"2px 8px",borderRadius:"10px",background:"#f3f5fb"}},
        base.level+" · "+(base.scale==="minPenta"?"마이너펜타":base.scale==="majPenta"?"메이저펜타":base.scale==="blues"?"블루스":base.scale==="natMinor"?"내추럴마이너":base.scale))
    ),
    e("div",{style:{fontSize:"12px",color:"#8a92b0",marginTop:"2px"}}, base.desc),

    /* 솔로 선택 */
    soloButtons(),

    /* 생성기 + 즐겨찾기 줄 */
    e("div",{className:"bk-row",style:{marginTop:"8px"}},
      e("button",{className:"mini-btn"+(genSolo&&genSolo.generated?" on":""),
        onClick:doGenerate, style:{background:"#fff7ed",borderColor:"#fb923c",color:"#ea580c"}},
        "\u2728 12\ubc14 \uc0dd\uc131"),
      genSolo? e("button",{className:"mini-btn",onClick:clearGenerate},"\u21a9 \ub77c\uc774\ube0c\ub7ec\ub9ac\ub85c"):null,
      e("button",{className:"mini-btn",onClick:doFav,style:{borderColor:"#0ea5e9",color:"#0369a1"}},"\u2605 \uc800\uc7a5"),
      e("label",{className:"bk-track",style:{fontSize:"12px"}},
        e("input",{type:"checkbox",checked:callResp,onChange:function(){setCallResp(!callResp);}}),"call&response \uc5f0\uc2b5")
    ),
    callResp? e("div",{style:{fontSize:"11px",color:"#6366f1",marginTop:"2px",fontWeight:"700"}},
      "\ud83d\udd01 \uc9dd\uc218 \ub9c8\ub514(1-2,5-6,9-10)\ub294 call \u00b7 \ud640\uc218 \ub9c8\ub514\ub294 \uc9c1\uc811 \ub530\ub77c\uce58\uae30(response) \u2014 \ubc31\ud0b9\uacfc \ud568\uaed8") : null,

    /* 즐겨찾기 목록 */
    favList.length? e("div",{className:"bk-row",style:{marginTop:"4px"}},
      e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px",color:"#0ea5e9"}},"\u2605 \uc800\uc7a5"),
      favList.slice().reverse().slice(0,8).map(function(f){
        return e("span",{key:f.id,style:{display:"inline-flex",alignItems:"center",gap:"3px"}},
          e("button",{className:"mini-btn"+(genSolo&&genSolo.id===f.id?" on":""),
            onClick:function(){ loadFav(f); }}, f.name),
          e("button",{className:"mini-btn",style:{padding:"7px 8px",color:"#ef4444"},
            onClick:function(){ delFav(f.id); }}, "\u00d7"));
      })
    ): null,

    /* 타브 뷰 토글 + 주법 범례 */
    e("div",{className:"bk-row",style:{marginTop:"10px",justifyContent:"space-between"}},
      e("div",{style:{display:"flex",gap:"6px"}},
        e("button",{className:"mini-btn"+(tabView==="ascii"?" on":""),onClick:function(){setTabView("ascii");}},"\ud0a4\ub9ac\ub4ec \ud0c0\ube0c"),
        e("button",{className:"mini-btn"+(tabView==="svg"?" on":""),onClick:function(){setTabView("svg");}},"\uadf8\ub798\ud53d \ud0c0\ube0c")
      )
    ),

    /* 타브 본문 */
    tabView==="ascii"
      ? e("div",{className:"jam-tab jam-tab-rows"},
          asciiRows.map(function(rd,i){ return renderAsciiRow(rd,i); }))
      : e("div",{className:"jam-svg-grid"},
          bars.map(function(bar,i){ return renderSvgBar(bar,i); })),

    /* 현재 음/마디 표시 */
    lead.playing && curBar>=0
      ? e("div",{style:{fontSize:"12px",color:"var(--indigo)",fontWeight:"700",marginTop:"6px"}},
          "\u25B6 마디 "+(curBar+1)+"/12"+(flat[curFlat]&&!flat[curFlat].rest?
            " · "+(6-flat[curFlat].s)+"번줄 "+flat[curFlat].f+"프렛"+
            (flat[curFlat].art&&ART_LABEL[flat[curFlat].art]?" ("+ART_LABEL[flat[curFlat].art]+")":""):""))
      : null,

    /* 주법 범례 */
    e("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",marginTop:"8px",fontSize:"11px",color:"#8a92b0"}},
      legendArts.map(function(a){
        return e("span",{key:a},e("b",{style:{color:"#5b6ef5"}},ART_TAB[a]||a),"="+ART_LABEL[a]);
      })
    ),

    /* 변형(옥타브) */
    e("div",{className:"bk-row",style:{marginTop:"8px"}},
      e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px"}},"변형"),
      [["-1","옥타브↓"],["0","원본"],["1","옥타브↑"]].map(function(o){
        var v=parseInt(o[0],10);
        return e("button",{key:o[0],className:"mini-btn"+(octShift===v?" on":""),
          onClick:function(){ setOctShift(v); }}, o[1]);
      })
    ),

    /* BPM */
    e("div",{className:"bk-row"},
      e("button",{className:"step-btn",onClick:function(){ setBpm(Math.max(40,bpm-5)); }},"-5"),
      e("div",{className:"bpm-val",style:{color:"var(--purple)"}},bpm),
      e("button",{className:"step-btn",onClick:function(){ setBpm(Math.min(240,bpm+5)); }},"+5"),
      e("input",{type:"range",className:"slider",min:40,max:240,value:bpm,
        onChange:function(ev){ setBpm(parseInt(ev.target.value,10)); }})
    ),
    e("button",{className:"bk-big"+(lead.playing?" playing":""),onClick:handlePlay},
      lead.playing?"\u25A0 정지":"\u25B6 솔로 재생 (12마디 루프)"),
    e("div",{style:{fontSize:"11px",color:"#8a92b0",marginTop:"6px",textAlign:"center"}},
      "위 백킹 트랙을 같은 키로 함께 재생하면 12마디 잼 연습이 됩니다")
  );
}


/* ---------------- 세션 저장 ---------------- */
>>>>>>> 2f92f95a7b5d5397a1a4ef0d21b28402df7da544

export { JamSolo };
