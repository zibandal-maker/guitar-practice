import React from 'react';
import { useState } from 'react';
import { SEMITONE_KEY } from '../../lib/theory.js';
import { CHORD_TYPE_ORDER, CHORD_LABEL, GROOVE_OPTS } from '../../data/progressions.js';
const e = React.createElement;

/* 코드 타입 → 읽기 쉬운 라벨(드롭다운용) */
var TYPE_TEXT = {
  maj:"메이저", min:"마이너", dom7:"7", maj7:"maj7", min7:"m7", m7b5:"m7♭5",
  dim7:"dim7", "6":"6", min6:"m6", dom9:"9", maj9:"maj9", min9:"m9", sus7:"7sus", aug:"aug"
};

function noteFor(keySemi, off){ return SEMITONE_KEY[((keySemi + off) % 12 + 12) % 12]; }
function barLabel(keySemi, bar){
  return noteFor(keySemi, bar.d) + (CHORD_LABEL[bar.t] || "")
    + (bar.b !== undefined && bar.b !== null ? "/" + noteFor(keySemi, bar.b) : "");
}

/* 커스텀 코드진행 에디터.
   props: keySemi(C=0), initial(편집 대상 prog|null), onSave(prog), onCancel */
function ProgressionEditor(props){
  var keySemi = props.keySemi;
  var init = props.initial;
  var nm = useState(init ? init.name : ""); var name = nm[0]; var setName = nm[1];
  var gv = useState(init ? init.groove : "straight"); var groove = gv[0]; var setGroove = gv[1];
  var bp = useState(init ? init.bpm : 100); var bpm = bp[0]; var setBpm = bp[1];
  var br = useState(init ? init.bars.map(function(b){return {d:b.d, t:b.t, b:(b.b==null?null:b.b)};})
                        : [{d:0,t:"maj",b:null},{d:7,t:"maj",b:null},{d:9,t:"min",b:null},{d:5,t:"maj",b:null}]);
  var bars = br[0]; var setBars = br[1];

  function setBar(i, patch){ var nb = bars.slice(); nb[i] = Object.assign({}, nb[i], patch); setBars(nb); }
  function addBar(){ var last = bars[bars.length-1] || {d:0,t:"maj",b:null}; setBars(bars.concat([{d:last.d,t:last.t,b:null}])); }
  function removeBar(i){ if(bars.length<=1) return; setBars(bars.filter(function(_,j){return j!==i;})); }

  function rootSelect(i, bar){
    return e("select",{className:"pe-sel", value:String(bar.d),
      onChange:function(ev){ setBar(i,{d:parseInt(ev.target.value,10)}); }},
      [0,1,2,3,4,5,6,7,8,9,10,11].map(function(off){
        return e("option",{key:off, value:String(off)}, noteFor(keySemi, off));
      }));
  }
  function typeSelect(i, bar){
    return e("select",{className:"pe-sel", value:bar.t,
      onChange:function(ev){ setBar(i,{t:ev.target.value}); }},
      CHORD_TYPE_ORDER.map(function(t){
        return e("option",{key:t, value:t}, TYPE_TEXT[t]||t);
      }));
  }
  function bassSelect(i, bar){
    return e("select",{className:"pe-sel", title:"베이스 지정(슬래시코드)",
      value:(bar.b==null?"":String(bar.b)),
      onChange:function(ev){ var v=ev.target.value; setBar(i,{b:(v===""?null:parseInt(v,10))}); }},
      [e("option",{key:"def", value:""},"베이스: 코드")].concat(
        [0,1,2,3,4,5,6,7,8,9,10,11].map(function(off){
          return e("option",{key:off, value:String(off)}, "/"+noteFor(keySemi, off));
        })));
  }

  function doSave(){
    var nm2 = (name||"").trim() || ("커스텀 "+bars.length+"마디");
    var id = init ? init.id : ("custom_"+Date.now());
    props.onSave({ id:id, name:nm2, style:"커스텀", groove:groove, bpm:bpm,
      bars: bars.map(function(b){ var o={d:b.d,t:b.t}; if(b.b!=null) o.b=b.b; return o; }), custom:true });
  }

  return e("div",{className:"card", style:{border:"1.5px solid var(--indigo)"}},
    e("div",{className:"sec-label"}, init ? "✏️ 커스텀 진행 편집" : "✏️ 커스텀 코드진행 만들기"),
    /* 이름 + 그루브 + BPM */
    e("div",{className:"bk-row", style:{gap:"8px",flexWrap:"wrap"}},
      e("input",{className:"memo-in", style:{maxWidth:"200px"}, placeholder:"진행 이름", value:name,
        onChange:function(ev){ setName(ev.target.value); }}),
      e("span",{style:{fontSize:"12px",color:"#8a92b0"}},"그루브"),
      GROOVE_OPTS.map(function(g){
        return e("button",{key:g[0], className:"mini-btn"+(groove===g[0]?" on":""),
          onClick:function(){ setGroove(g[0]); }}, g[1]);
      }),
      e("span",{style:{fontSize:"12px",color:"#8a92b0",marginLeft:"6px"}},"BPM"),
      e("input",{type:"number", className:"memo-in", style:{maxWidth:"70px"}, min:40, max:240, value:bpm,
        onChange:function(ev){ setBpm(Math.max(40,Math.min(240,parseInt(ev.target.value,10)||100))); }})
    ),
    e("div",{style:{fontSize:"12px",color:"#8a92b0",margin:"6px 0"}},
      "키(위에서 선택한 키) 기준으로 저장되어, 나중에 키를 바꾸면 진행 전체가 함께 이조됩니다."),
    /* 마디 편집 */
    e("div",{style:{display:"flex",flexWrap:"wrap",gap:"8px"}},
      bars.map(function(bar,i){
        return e("div",{key:i, className:"pe-bar"},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            e("span",{className:"bn"}, i+1),
            e("button",{className:"pe-x", title:"마디 삭제", onClick:function(){ removeBar(i); }},"✕")
          ),
          e("div",{className:"pe-preview"}, barLabel(keySemi, bar)),
          rootSelect(i,bar), typeSelect(i,bar), bassSelect(i,bar)
        );
      }),
      e("button",{className:"pe-add", onClick:addBar},"➕ 마디")
    ),
    /* 저장 / 취소 */
    e("div",{className:"bk-row", style:{marginTop:"10px",gap:"8px"}},
      e("button",{className:"save-btn", onClick:doSave}, init?"수정 저장":"저장하고 사용"),
      e("button",{className:"mini-btn", onClick:props.onCancel},"취소")
    )
  );
}

export { ProgressionEditor };
