import React from 'react';
import { NOTE_VALS } from '../lib/theory.js';
const e = React.createElement;

<<<<<<< HEAD
function MetronomeBar(props){
  var m = props.metro;
  function noteButtons(){
    return NOTE_VALS.map(function(n){
      return e("button",{
        key:n.id, className:"note-btn"+(m.noteVal===n.id?" on":""),
        onClick:function(){ m.setNoteVal(n.id); }
      }, n.label);
    });
  }
  function dots(){
    var arr=[0,1,2,3];
    return e("div",{className:"dots"}, arr.map(function(i){
      return e("div",{key:i, className:"dot"+(m.playing&&m.beat===i?" act":"")});
    }));
  }
  function setBpm(v){ var x=Math.max(30,Math.min(240,v)); m.setBpm(x); }
  return e("div",{className:"card"},
    e("div",{className:"metro"},
      noteButtons(),
      e("div",{className:"divider"}),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm-5);}},"-5"),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm-1);}},"-1"),
      e("div",{className:"bpm-val"}, m.bpm),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm+1);}},"+1"),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm+5);}},"+5"),
      e("input",{type:"range", className:"slider", min:30, max:240, value:m.bpm,
        onChange:function(ev){ setBpm(parseInt(ev.target.value,10)); }}),
      dots(),
      e("button",{className:"play-btn"+(m.playing?" playing":""), onClick:m.toggle},
        m.playing?"\u25A0 \uC815\uC9C0":"\u25B6 \uC7AC\uC0DD")
    )
  );
}

/* 점 라벨 결정: labelMode = fret/note/interval/degree */
=======
function MetronomeBar(props){
  var m = props.metro;
  function noteButtons(){
    return NOTE_VALS.map(function(n){
      return e("button",{
        key:n.id, className:"note-btn"+(m.noteVal===n.id?" on":""),
        onClick:function(){ m.setNoteVal(n.id); }
      }, n.label);
    });
  }
  function dots(){
    var arr=[0,1,2,3];
    return e("div",{className:"dots"}, arr.map(function(i){
      return e("div",{key:i, className:"dot"+(m.playing&&m.beat===i?" act":"")});
    }));
  }
  function setBpm(v){ var x=Math.max(30,Math.min(240,v)); m.setBpm(x); }
  return e("div",{className:"card"},
    e("div",{className:"metro"},
      noteButtons(),
      e("div",{className:"divider"}),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm-5);}},"-5"),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm-1);}},"-1"),
      e("div",{className:"bpm-val"}, m.bpm),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm+1);}},"+1"),
      e("button",{className:"step-btn", onClick:function(){setBpm(m.bpm+5);}},"+5"),
      e("input",{type:"range", className:"slider", min:30, max:240, value:m.bpm,
        onChange:function(ev){ setBpm(parseInt(ev.target.value,10)); }}),
      dots(),
      e("button",{className:"play-btn"+(m.playing?" playing":""), onClick:m.toggle},
        m.playing?"\u25A0 \uC815\uC9C0":"\u25B6 \uC7AC\uC0DD")
    )
  );
}

/* 점 라벨 결정: labelMode = fret/note/interval/degree */
>>>>>>> 2f92f95a7b5d5397a1a4ef0d21b28402df7da544

export { MetronomeBar };
