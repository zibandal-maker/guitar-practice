import React from 'react';
import { useState } from 'react';
import './styles/app.css';
import { ScaleTab } from './features/scales/ScaleTab.jsx';
import { BackingTab } from './features/backing/BackingTab.jsx';
import { SoloTab } from './features/solo/SoloTab.jsx';
import { ChordTab } from './features/chords/ChordTab.jsx';
import { RhythmTab } from './features/rhythm/RhythmTab.jsx';
import { PlayerTab } from './features/player/PlayerTab.jsx';
const e = React.createElement;

function ComingTab(props){
  return e("div",{className:"card"},
    e("div",{className:"placeholder"}, props.label+" — 다음 단계에서 구현 예정")
  );
}

/* ---------------- App ---------------- */
var TABS=[
  {id:"scale",  label:"스케일 & 포지션"},
  {id:"backing",label:"🎼 백킹"},
  {id:"solo",   label:"🎸 솔로"},
  {id:"chord",  label:"🎵 코드"},
  {id:"rhythm", label:"🥁 리듬"},
  {id:"player", label:"🎧 플레이어"},
  {id:"hist",   label:"📋 기록"}
];
function App(){
  var t=useState("scale"); var tab=t[0]; var setTab=t[1];
  function nav(){
    return TABS.map(function(tb){
      return e("button",{key:tb.id, className:tab===tb.id?"active":"",
        onClick:function(){ setTab(tb.id); }}, tb.label);
    });
  }
  function body(){
    if(tab==="scale") return e(ScaleTab,null);
    if(tab==="backing") return e(BackingTab,null);
    if(tab==="solo") return e(SoloTab,null);
    if(tab==="chord") return e(ChordTab,null);
    if(tab==="rhythm") return e(RhythmTab,null);
    if(tab==="player") return e(PlayerTab,null);
    return e(ComingTab,{label:"기록"});
  }
  return e("div",null,
    e("div",{className:"topbar"},
      e("div",{className:"logo"},
        e("span",{className:"ico"},"🎸"),
        e("div",null,
          e("div",{className:"t1"},"GUITAR PRACTICE"),
          e("div",{className:"t2"},"TRACKER v4")
        )
      ),
      e("div",{className:"nav"}, nav())
    ),
    e("div",{className:"wrap"}, body())
  );
}

export { App };
