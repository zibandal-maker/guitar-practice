import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useBackingTrack } from '../../hooks/useBackingTrack.js';
import { BK_PROGRESSIONS, CHORD_LABEL, progById, BK_CHORD_IVS } from '../../data/progressions.js';
import { SEMITONE_KEY } from '../../lib/theory.js';
import { loadBkCustom, saveBkCustom } from '../../lib/storage.js';
import { ProgressionEditor } from './ProgressionEditor.jsx';
import '../../lib/soundfont.js';
const e = React.createElement;

function BackingTrack(props){
  var bk=useBackingTrack();
  var keySemi=props.keySemi; /* C=0 기준 */
  var ks=useState({drums:true,bass:true,chords:true}); var mix=ks[0]; var setMix=ks[1];
  var pg=useState("blues_std"); var progId=pg[0]; var setProgId=pg[1];
  var sm=useState(true); var useSamples=sm[0]; var setUseSamples=sm[1];
  var ss=useState("idle"); var smplrStatus=ss[0]; var setSmplrStatus=ss[1];
  var dk=useState("TR-808"); var drumKit=dk[0]; var setDrumKit=dk[1];
  var dn=useState(["TR-808","TR-909","LM-2","Roland CR-78","Casio RZ-1"]); var drumNames=dn[0]; var setDrumNames=dn[1];
  var dg=useState(""); var drumInfo=dg[0]; var setDrumInfo=dg[1];
  var cst=useState(loadBkCustom()); var customs=cst[0]; var setCustoms=cst[1];
  var ed=useState(false); var editing=ed[0]; var setEditing=ed[1];
  var eip=useState(null); var editInit=eip[0]; var setEditInit=eip[1];

  /* smplr 로딩 상태 폴링 + 가용 드럼머신 목록 동기화 */
  useEffect(function(){
    var id=setInterval(function(){
      if(window.__smplrStatus && window.__smplrStatus!==smplrStatus) setSmplrStatus(window.__smplrStatus);
      if(window.__smplrDrumNames && window.__smplrDrumNames.length && window.__smplrDrumNames[0]!==drumNames[0]) setDrumNames(window.__smplrDrumNames.slice(0,8));
      if(window.__drumMap){
        var info="kick:"+window.__drumMap.kick+" / snare:"+window.__drumMap.snare+" / hat:"+window.__drumMap.hat;
        if(info!==drumInfo) setDrumInfo(info);
      }
    },300);
    return function(){ clearInterval(id); };
  },[smplrStatus,drumNames,drumInfo]);

  function resolveProg(id){
    for(var i=0;i<customs.length;i++){ if(customs[i].id===id) return customs[i]; }
    return progById(id);
  }
  var prog = resolveProg(progId);
  function saveCustom(p){
    var arr=customs.slice(); var idx=-1;
    for(var i=0;i<arr.length;i++){ if(arr[i].id===p.id){ idx=i; break; } }
    if(idx>=0) arr[idx]=p; else arr.push(p);
    setCustoms(arr); saveBkCustom(arr); setProgId(p.id); setEditing(false);
  }
  function deleteCustom(id){
    var arr=customs.filter(function(p){return p.id!==id;});
    setCustoms(arr); saveBkCustom(arr);
    if(progId===id) setProgId("blues_std");
  }
  function config(){
    return {keySemi:keySemi, bars:prog.bars, groove:prog.groove,
      drums:mix.drums, bass:mix.bass, chords:mix.chords};
  }
  function handlePlay(){
    if(!bk.playing){
      if(useSamples && window.__smplrStatus!=="ready" && window.__smplrStatus!=="error"){
        if(window.loadSmplr) window.loadSmplr();
      }
    }
    bk.toggle(config());
  }
  /* 진행 바꾸면 그 진행의 기본 BPM으로, 재생 중이면 즉시 반영 */
  useEffect(function(){ bk.setBpm(prog.bpm); },[progId]);
  useEffect(function(){ if(bk.playing) bk.updateConfig(config()); },[mix,progId,keySemi]);
  /* 현재 재생 중인 코드의 구성음을 상위(지판)로 전달 — 코드별 지판 하이라이트용 */
  useEffect(function(){
    if(!props.onChord) return;
    if(!bk.playing){ props.onChord(null); return; }
    var bar = prog.bars[bk.curBar] || prog.bars[0];
    var rootC = ((keySemi + bar.d) % 12 + 12) % 12;
    var rootE = (rootC + 8) % 12;                 /* C=0 → E=0 (NOTE_NAMES 기준) */
    var ivs = BK_CHORD_IVS[bar.t] || [0,4,7];
    var tones = ivs.map(function(iv){ return (rootE + iv) % 12; });
    props.onChord({ rootPc: rootE, tones: tones });
  },[bk.curBar, bk.playing, progId, keySemi]);

  function toggleMix(k){ var nm=Object.assign({},mix); nm[k]=!nm[k]; setMix(nm); }
  var keyName = SEMITONE_KEY[keySemi];
  var soundBadge = !useSamples ? "합성음"
    : smplrStatus==="ready" ? "🎵 실제 악기"
    : smplrStatus==="loading" ? "샘플 불러오는 중…"
    : smplrStatus==="error" ? "합성음(샘플 실패)"
    : "샘플(재생 시 로드)";
  var grooveLabel={shuffle:"셔플",swing:"스윙",slowblues:"슬로",straight:"스트레이트",funk:"펑크"}[prog.groove]||prog.groove;
  /* 스타일별 진행 그룹 */
  var styles=["블루스","재즈","팝/락","펑크/소울"];

  return e("div",{className:"card"},
    e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}},
      e("div",{className:"sec-label",style:{marginBottom:0}},"\uD83C\uDFB7 백킹 트랙 ("+keyName+" 키 · "+grooveLabel+")"),
      e("span",{style:{fontSize:"11px",fontWeight:"700",color:smplrStatus==="ready"&&useSamples?"#10b981":"#8a92b0",
        padding:"2px 8px",borderRadius:"10px",background:smplrStatus==="ready"&&useSamples?"rgba(16,185,129,.12)":"#f3f5fb"}},soundBadge)
    ),
    e("div",{style:{fontSize:"12px",color:"#8a92b0",marginTop:"2px"}},"루트 버튼으로 키 변경 · 진행은 키를 따라 이조됩니다"),
    /* 진행 선택 (스타일별) */
    styles.map(function(st){
      return e("div",{key:st,className:"bk-row",style:{marginTop:"6px"}},
        e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px",minWidth:"56px"}},st),
        BK_PROGRESSIONS.filter(function(p){return p.style===st;}).map(function(p){
          return e("button",{key:p.id,className:"mini-btn"+(progId===p.id?" on":""),
            onClick:function(){ setProgId(p.id); }}, p.name.replace(/\s*\(.*\)/,""));
        })
      );
    }),
    /* 커스텀 진행 목록 + 만들기 */
    e("div",{className:"bk-row",style:{marginTop:"6px",flexWrap:"wrap"}},
      e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"11px",minWidth:"56px"}},"커스텀"),
      customs.map(function(p){
        return e("span",{key:p.id,className:"pe-chip"+(progId===p.id?" on":"")},
          e("button",{className:"pe-chip-name"+(progId===p.id?" on":""),
            onClick:function(){ setProgId(p.id); }}, p.name),
          e("button",{className:"pe-mini",title:"편집",
            onClick:function(){ setEditInit(p); setEditing(true); }},"✏️"),
          e("button",{className:"pe-mini",title:"삭제",
            onClick:function(){ deleteCustom(p.id); }},"✕")
        );
      }),
      e("button",{className:"mini-btn",style:{borderStyle:"dashed"},
        onClick:function(){ setEditInit(null); setEditing(true); }},"➕ 진행 만들기")
    ),
    /* 에디터 패널 */
    editing ? e(ProgressionEditor,{keySemi:keySemi, initial:editInit,
      onSave:saveCustom, onCancel:function(){ setEditing(false); }}) : null,
    /* 진행 마디 표시 */
    e("div",{className:"bk-grid",style:{gridTemplateColumns:"repeat("+(prog.bars.length<=4?prog.bars.length:4)+",1fr)"}},
      prog.bars.map(function(bar,i){
        var rootSemi=((keySemi+bar.d)%12+12)%12;
        var bassNote = (bar.b!==undefined&&bar.b!==null) ? "/"+SEMITONE_KEY[((keySemi+bar.b)%12+12)%12] : "";
        return e("div",{key:i,className:"bk-bar"+(bk.playing&&bk.curBar===i?" act":"")},
          e("span",{className:"bn"},(i+1)),
          SEMITONE_KEY[rootSemi]+(CHORD_LABEL[bar.t]||"")+bassNote);
      })
    ),
    /* 믹스 토글 */
    e("div",{className:"bk-mix"},
      e("label",{className:"bk-track"},
        e("input",{type:"checkbox",checked:mix.drums,onChange:function(){toggleMix("drums");}}),"🥁 드럼"),
      e("label",{className:"bk-track"},
        e("input",{type:"checkbox",checked:mix.bass,onChange:function(){toggleMix("bass");}}),"🎸 베이스"),
      e("label",{className:"bk-track"},
        e("input",{type:"checkbox",checked:mix.chords,onChange:function(){toggleMix("chords");}}),"🎹 코드"),
      e("label",{className:"bk-track",title:"실제 악기 샘플(인터넷 필요) ↔ 합성음"},
        e("input",{type:"checkbox",checked:useSamples,onChange:function(){
          var nv=!useSamples; setUseSamples(nv);
          if(nv && window.__smplrStatus!=="ready" && window.loadSmplr) window.loadSmplr();
        }}),"실제 악기")
    ),
    /* 드럼머신 선택 */
    useSamples ? e("div",{className:"bk-row"},
      e("span",{className:"sec-label",style:{marginBottom:0,fontSize:"12px"}},"🥁 드럼머신"),
      drumNames.map(function(nm){
        return e("button",{key:nm,className:"mini-btn"+(drumKit===nm?" on":""),
          onClick:function(){ setDrumKit(nm); if(window.changeDrumKit) window.changeDrumKit(nm); }}, nm);
      })
    ) : null,
    /* 드럼 매핑 디버그 (어떤 그룹 이름으로 매핑됐는지) */
    useSamples && drumInfo ? e("div",{style:{fontSize:"10px",color:"#8a92b0",marginTop:"2px"}}, drumInfo) : null,
    /* BPM */
    e("div",{className:"bk-row"},
      e("button",{className:"step-btn",onClick:function(){ bk.setBpm(Math.max(40,bk.bpm-5)); }},"-5"),
      e("div",{className:"bpm-val",style:{color:"var(--purple)"}},bk.bpm),
      e("button",{className:"step-btn",onClick:function(){ bk.setBpm(Math.min(240,bk.bpm+5)); }},"+5"),
      e("input",{type:"range",className:"slider",min:40,max:240,value:bk.bpm,
        onChange:function(ev){ bk.setBpm(parseInt(ev.target.value,10)); }})
    ),
    e("button",{className:"bk-big"+(bk.playing?" playing":""),
      onClick:handlePlay},
      bk.playing?"\u25A0 정지"
        :(useSamples&&smplrStatus==="loading"?"\u25B6 재생 (샘플 로딩 중…)":"\u25B6 백킹 트랙 재생")),
    useSamples&&smplrStatus!=="ready"&&smplrStatus!=="error"
      ? e("div",{style:{fontSize:"11px",color:"#8a92b0",marginTop:"6px",textAlign:"center"}},
          "첫 재생 시 실제 악기 샘플을 불러옵니다(수 초, 인터넷 필요). 로딩 전에는 합성음으로 시작될 수 있습니다.")
      : null
  );
}

/* ========================================================================
   리드 프레이즈 플레이어 훅 — 백킹과 동일한 16분 look-ahead 스케줄러 패턴.
   합성음은 playNote의 openFreq(개방현 주파수) 재사용. 백킹과 동시 재생 가능.
   onStep 콜백으로 현재 음 인덱스를 알려 프렛보드/타브 하이라이트.
   ======================================================================== */

export { BackingTrack };
