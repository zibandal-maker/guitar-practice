import React from 'react';
import { useState } from 'react';
import { SCALES, SEMITONE_KEY } from '../../lib/theory.js';
import { playNote } from '../../lib/audio.js';
import { FretboardFull } from '../scales/Fretboard.jsx';
import { BackingTrack } from './BackingTrack.jsx';
const e = React.createElement;

/* 백킹 트랙 전용 탭: 키·스케일을 고르고 백킹을 재생/편집한다.
   재생 중에는 현재 코드의 구성음이 지판에 강조된다(코드별 지판).
   keySemi 는 C=0 기준(BackingTrack 규약), 지판 rootOverride 는 E=0 기준. */
var BK_SCALES = ["minPenta", "blues", "natMinor", "majPenta", "major"];

function BackingTab(){
  var ks = useState(9); var keyC = ks[0]; var setKeyC = ks[1];           /* 기본 A */
  var sc = useState("minPenta"); var scaleKey = sc[0]; var setScaleKey = sc[1];
  var ch = useState(null); var chord = ch[0]; var setChord = ch[1];      /* 현재 코드 {rootPc,tones} */

  var rootSemiE = (keyC - 4 + 12) % 12;
  var keyName = SEMITONE_KEY[keyC];

  return e("div", null,
    /* 키 + 스케일 선택 */
    e("div", { className: "card" },
      e("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" } },
        e("span", { className: "sec-label", style: { marginBottom: 0 } }, "키 (KEY)"),
        SEMITONE_KEY.map(function (k, ki) {
          return e("button", {
            key: k, className: "mini-btn" + (keyC === ki ? " on" : ""),
            onClick: function () { setKeyC(ki); }
          }, k);
        })
      ),
      e("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" } },
        e("span", { className: "sec-label", style: { marginBottom: 0 } }, "스케일"),
        BK_SCALES.map(function (key) {
          return e("button", {
            key: key, className: "mini-btn" + (scaleKey === key ? " on" : ""),
            onClick: function () { setScaleKey(key); }
          }, SCALES[key].name);
        })
      ),
      e("div", { className: "hint", style: { marginTop: "8px" } },
        "선택한 키로 백킹이 이조됩니다. 재생하면 아래 지판에 현재 코드의 구성음이 강조돼요(코드별 지판).")
    ),
    /* 전체 지판 — 재생 중 현재 코드 구성음 강조 */
    e("div", { className: "card sel" },
      e("div", { className: "fb-title" }, keyName + " " + SCALES[scaleKey].name + " · 전체 지판"),
      e("div", { className: "fb-sub" },
        chord ? "▶ 재생 중 · 현재 코드 구성음(테두리 강조)이 표시됩니다 · 점을 누르면 소리납니다"
              : "재생하면 코드가 바뀔 때마다 구성음이 강조됩니다 · 점을 누르면 소리납니다"),
      e(FretboardFull, {
        scaleKey: scaleKey, labelMode: "interval", rootOverride: rootSemiE,
        onDot: function (s, f) { playNote(s, f); },
        showCaged: false, boxes: SCALES[scaleKey].boxes, highlightBox: null,
        chordTones: chord ? chord.tones : null,
        chordRootPc: chord ? chord.rootPc : null
      })
    ),
    /* 백킹 트랙 (현재 코드를 지판으로 전달) */
    e(BackingTrack, { keySemi: keyC, onChord: setChord })
  );
}

export { BackingTab };
