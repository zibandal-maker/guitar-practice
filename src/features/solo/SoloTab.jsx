import React from 'react';
import { useState } from 'react';
import { SCALES, SEMITONE_KEY } from '../../lib/theory.js';
import { playNote } from '../../lib/audio.js';
import { FretboardFull } from '../scales/Fretboard.jsx';
import { JamSolo } from './JamSolo.jsx';
const e = React.createElement;

/* 솔로 연습 전용 탭: 키/스케일을 고르고 → 그 위에서 솔로(잼 프레이즈)를 재생.
   지판은 재생 중인 음을 짚어준다. 백킹은 '백킹' 탭에서 같은 키로 깔면 됨.
   키 변환: keyC(C=0) → rootSemiE(E=0) = (keyC-4+12)%12 */
var SOLO_SCALES = ["minPenta", "blues", "natMinor", "majPenta", "major"];

function SoloTab() {
  var ks = useState(9); var keyC = ks[0]; var setKeyC = ks[1];           /* 기본 A */
  var sc = useState("minPenta"); var scaleKey = sc[0]; var setScaleKey = sc[1];
  var jh = useState(null); var jamHL = jh[0]; var setJamHL = jh[1];       /* 재생 중 음 위치 */

  var rootSemiE = (keyC - 4 + 12) % 12;
  var keyName = SEMITONE_KEY[keyC];

  return e("div", null,
    /* 키 + 스케일 선택 */
    e("div", { className: "card" },
      e("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" } },
        e("span", { className: "sec-label", style: { marginBottom: 0 } }, "키"),
        SEMITONE_KEY.map(function (k, ki) {
          return e("button", {
            key: k, className: "mini-btn" + (keyC === ki ? " on" : ""),
            onClick: function () { setKeyC(ki); }
          }, k);
        })
      ),
      e("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" } },
        e("span", { className: "sec-label", style: { marginBottom: 0 } }, "스케일"),
        SOLO_SCALES.map(function (key) {
          return e("button", {
            key: key, className: "mini-btn" + (scaleKey === key ? " on" : ""),
            onClick: function () { setScaleKey(key); }
          }, SCALES[key].name);
        })
      ),
      e("div", { className: "hint", style: { marginTop: "8px" } },
        "지판에 " + keyName + " " + SCALES[scaleKey].name + " 음이 표시됩니다. 잼 연습은 '백킹' 탭에서 같은 키(" + keyName + ")로 백킹을 켠 뒤 함께 하세요.")
    ),
    /* 지판 — 솔로 재생 중 음 하이라이트 */
    e("div", { className: "card sel" },
      e("div", { className: "fb-title" }, keyName + " " + SCALES[scaleKey].name + " · 전체 지판"),
      e("div", { className: "fb-sub" }, "솔로 재생 중 짚는 음이 표시됩니다 · 점을 누르면 소리납니다"),
      e(FretboardFull, {
        scaleKey: scaleKey, labelMode: "interval", rootOverride: rootSemiE,
        onDot: function (s, f) { playNote(s, f); },
        showCaged: false, boxes: SCALES[scaleKey].boxes, highlightBox: null, current: jamHL
      })
    ),
    /* 솔로 (잼 프레이즈) */
    e(JamSolo, {
      rootSemiE: rootSemiE,
      keySemiC: keyC,
      keyName: keyName,
      onHighlight: setJamHL
    })
  );
}

export { SoloTab };
