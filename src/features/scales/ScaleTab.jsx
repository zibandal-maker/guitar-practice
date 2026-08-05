import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { SCALES, SCALE_ORDER, NUM_POSITIONS, NOTE_NAMES, NOTE_VALS, SEMITONE_KEY, isInScale, noteNameAt, intervalLabelAt } from '../../lib/theory.js';
import { useMetronome } from '../../lib/metronome.js';
import { usePracticeTimer, fmtTime } from '../../lib/timer.js';
import { playNote } from '../../lib/audio.js';
import { loadSessions, saveSessions } from '../../lib/storage.js';
import { MetronomeBar } from '../../ui/MetronomeBar.jsx';
import { Fretboard, FretboardFull } from './Fretboard.jsx';
const e = React.createElement;

function ScaleTab(){
  var metro = useMetronome(); /* 독립 메트로놈 */
  var sk=useState("minPenta"); var scaleKey=sk[0]; var setScaleKey=sk[1];
  var pi=useState(0); var posIdx=pi[0]; var setPosIdx=pi[1];
  var cur=useState(null); var current=cur[0]; var setCurrent=cur[1];
  var memo=useState(""); var memoVal=memo[0]; var setMemo=memo[1];
  var timer=usePracticeTimer();
  /* 보강 상태 */
  var rt=useState(null); var rootSel=rt[0]; var setRootSel=rt[1]; /* null=스케일 기본 루트 */
  var lm=useState("interval"); var labelMode=lm[0]; var setLabelMode=lm[1]; /* fret/note/interval/degree */
  var vm=useState("box"); var viewMode=vm[0]; var setViewMode=vm[1]; /* box/full */
  var cg=useState(false); var showCaged=cg[0]; var setShowCaged=cg[1];
  var tp=useState(null); var tappedNote=tp[0]; var setTappedNote=tp[1];

  var rootOverride = rootSel; /* null이면 헬퍼가 스케일 기본 루트 사용 */

  /* 현재 포지션의 박스 범위 */
  var box = SCALES[scaleKey].boxes[posIdx] || [0,3];
  var lowFret = box[0], highFret = box[1];

  /* 박스 범위의 모든 스케일 음을 (줄,프렛) 순서로 펼침 — 6번줄(0)부터 1번줄(5)로 상행 */
  var seqList = (function(){
    var list=[]; var s,f;
    for(s=0; s<6; s++){
      for(f=lowFret; f<=highFret; f++){
        if(isInScale(scaleKey, s, f, rootOverride)){
          list.push({string:s, fret:f});
        }
      }
    }
    return list;
  })();
  var seqRef=useRef({i:0, dir:1});

  /* 스케일/포지션/루트 변경 시 시퀀스 리셋 */
  useEffect(function(){ seqRef.current={i:0, dir:1}; setCurrent(null); }, [scaleKey, posIdx, rootSel]);

  function onDotClick(s,f){
    playNote(s,f);
    setTappedNote({string:s, fret:f, name:noteNameAt(s,f),
      interval:intervalLabelAt(scaleKey,s,f,rootOverride)});
  }

  /* 메트로놈 tick에 하이라이트 연결 (리스너 1회 등록 + 해제) */
  var seqListRef=useRef(seqList); seqListRef.current=seqList;
  useEffect(function(){
    var off=metro.onTick(function(){
      var sq=seqRef.current;
      var list=seqListRef.current;
      var n=list.length;
      if(n===0){ setCurrent(null); return; }
      var idx=sq.i;
      if(idx<0) idx=0; if(idx>n-1) idx=n-1;
      setCurrent(list[idx]);
      /* 다음 위치: 경계를 넘으면 인덱스 유지하고 방향만 반전
         → 끝음·첫음을 두 번 치는 왕복 (0..n-1, n-1..0, 0..) */
      if(n>1){
        var next=sq.i+sq.dir;
        if(next>n-1 || next<0){ sq.dir=-sq.dir; } /* 끝: 인덱스 유지, 방향만 반전 → 같은 음 한 번 더 */
        else{ sq.i=next; }
      }
    });
    return off;
  }, []);

  useEffect(function(){ if(!metro.playing) setCurrent(null); }, [metro.playing]);

  function scaleCards(){
    return SCALE_ORDER.map(function(key){
      var sc=SCALES[key];
      var on=scaleKey===key;
      return e("div",{key:key, className:"scale-card "+(on?"on":"off"),
        onClick:function(){ setScaleKey(key); }},
        e("div",{className:"nm"}, sc.name),
        e("div",{className:"sub"}, sc.desc)
      );
    });
  }
  function posButtons(){
    var arr=[]; var i;
    for(i=0;i<NUM_POSITIONS;i++){
      (function(i){
        arr.push(e("button",{key:i, className:"pos-btn"+(posIdx===i?" on":""),
          onClick:function(){ setPosIdx(i); }}, i+1));
      })(i);
    }
    return arr;
  }
  function noteValLabel(){
    var nv=NOTE_VALS.filter(function(n){return n.id===metro.noteVal;})[0]||NOTE_VALS[0];
    return nv.label;
  }
  function doSave(){
    var arr=loadSessions();
    arr.push({
      ts:Date.now(), tab:"scale",
      scale:SCALES[scaleKey].name, note:metro.noteVal,
      bpm:metro.bpm, min:timer.minutes, memo:memoVal
    });
    saveSessions(arr);
    setMemo("");
    alert("세션 저장됨: "+SCALES[scaleKey].name+" · "+metro.bpm+"BPM");
  }

  return e("div",null,
    e(MetronomeBar,{metro:metro}),
    /* 스케일 선택 카드 */
    e("div",{className:"card"},
      e("div",{className:"scale-top-row",style:{display:"flex", justifyContent:"space-between"}},
        e("div",{style:{flex:1}},
          e("div",{className:"sec-label"},"SCALE"),
          e("div",{className:"scale-grid"}, scaleCards())
        ),
        e("div",{className:"scale-pos-col",style:{marginLeft:20, minWidth:170}},
          e("div",{className:"sec-label"},"포지션"),
          e("div",{className:"pos-row"}, posButtons()),
          e("div",{className:"hint"},
            e("span",{className:"pl"}, "\u25B6 재생 시 현재 포지션 음을"),
            e("br"),
            "6번줄→1번줄 순차 상행 후 다시 하행, 왕복 하이라이트"
          )
        )
      )
    ),
    /* 루트 선택 + 표시 토글 */
    e("div",{className:"card"},
      e("div",{style:{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap",marginBottom:"8px"}},
        e("span",{className:"sec-label",style:{marginBottom:0}},"루트"),
        SEMITONE_KEY.map(function(k,ki){
          /* SEMITONE_KEY는 C=0 기준. NOTE_NAMES(E=0)로 변환: E=0 → C는 인덱스8 */
          var eIdx=(ki+8)%12; /* C(ki=0) → NOTE_NAMES 인덱스 8 */
          var isOn = (rootSel===null) ? (SCALES[scaleKey].root===eIdx) : (rootSel===eIdx);
          return e("button",{key:k,className:"mini-btn"+(isOn?" on":""),
            onClick:function(){ setRootSel(eIdx); }}, k);
        }),
        e("button",{className:"mini-btn"+(rootSel===null?" on":""),
          onClick:function(){ setRootSel(null); },title:"스케일 기본 루트"},"기본")
      ),
      e("div",{style:{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}},
        e("span",{className:"sec-label",style:{marginBottom:0}},"표시"),
        [["fret","프렛#"],["note","음이름"],["interval","인터벌"],["degree","도수"]].map(function(o){
          return e("button",{key:o[0],className:"mini-btn"+(labelMode===o[0]?" on":""),
            onClick:function(){ setLabelMode(o[0]); }}, o[1]);
        }),
        e("span",{style:{width:"1px",height:"22px",background:"var(--line)",margin:"0 4px"}}),
        e("button",{className:"mini-btn"+(viewMode==="box"?" on":""),onClick:function(){ setViewMode("box"); }},"박스"),
        e("button",{className:"mini-btn"+(viewMode==="full"?" on":""),onClick:function(){ setViewMode("full"); }},"전체 지판"),
        viewMode==="full" ? e("button",{className:"mini-btn"+(showCaged?" on":""),
          onClick:function(){ setShowCaged(!showCaged); }},"CAGED 색") : null
      ),
      tappedNote ? e("div",{style:{marginTop:"8px",fontSize:"13px",color:"var(--indigo)",fontWeight:"700"}},
        "♪ "+tappedNote.name+" · 인터벌 "+tappedNote.interval+" ("+(6-tappedNote.string)+"번줄 "+tappedNote.fret+"프렛)") : null
    ),
    /* 프렛보드 */
    e("div",{className:"card sel"},
      e("div",{className:"fb-title"}, (rootSel!==null?NOTE_NAMES[rootSel]+" ":"")+SCALES[scaleKey].name+(viewMode==="box"?" · "+(posIdx+1)+"포지션":" · 전체 지판")),
      e("div",{className:"fb-sub"}, viewMode==="box"
        ? (lowFret===0?"개방현 포함 · "+lowFret+"~"+highFret+"프렛":lowFret+"~"+highFret+"프렛")
        : "0~15프렛 · 점을 누르면 소리납니다"),
      viewMode==="box"
        ? e(Fretboard,{scaleKey:scaleKey, box:box, current:current,
            labelMode:labelMode, rootOverride:rootOverride, onDot:onDotClick})
        : e(FretboardFull,{scaleKey:scaleKey, labelMode:labelMode, rootOverride:rootOverride,
            onDot:onDotClick, showCaged:showCaged, boxes:SCALES[scaleKey].boxes, highlightBox:box, current:current})
    ),
    /* 타이머 + 저장 */
    e("div",{className:"two-col"},
      e("div",{className:"card"},
        e("div",{className:"sec-label"},"연습 타이머"),
        timer.running ? e("div",{className:"timer-disp"}, fmtTime(timer.remain)) : null,
        e("div",{className:"timer-row"},
          [3,5,10,15,20].map(function(mn){
            return e("button",{key:mn, className:"timer-btn"+(timer.minutes===mn?" on":""),
              onClick:function(){ if(!timer.running) timer.setMinutes(mn); }}, mn+"분");
          })
        ),
        e("button",{className:"big-btn"+(timer.running?" run":""), onClick:function(){
          timer.toggle();
          if(!timer.running && !metro.playing) metro.toggle();
        }}, timer.running?"\u25A0 정지":"\u25B6 타이머 + 메트로놈")
      ),
      e("div",{className:"card"},
        e("div",{className:"sec-label"},"세션 저장"),
        e("div",{className:"save-row"},
          e("div",{className:"chip"}, SCALES[scaleKey].name+" · "+noteValLabel()+" · "+metro.bpm+"BPM"),
          e("input",{className:"memo-in", placeholder:"메모", value:memoVal,
            onChange:function(ev){ setMemo(ev.target.value); }}),
          e("button",{className:"save-btn", onClick:doSave}, "저장")
        )
      )
    )
  );
}

/* ---------------- 탭 2: 코드 다이어그램 ---------------- */
/* 코드 모양: frets 배열 = 6번줄→1번줄, -1=뮤트, 0=개방, 숫자=프렛. fingers 동일 순서(0=없음) */
/* 오픈 포지션 기준 표준 운지 */

export { ScaleTab };
