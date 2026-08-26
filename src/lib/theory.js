var NOTE_NAMES = ["E","F","F#","G","G#","A","A#","B","C","C#","D","D#"];
/* 개방현 음, 표준 튜닝. 줄 인덱스 0=6번줄(low E) ... 5=1번줄(high e) */
/* NOTE_NAMES 기준 인덱스 (E=0) */
var OPEN_STRINGS = [0,5,10,3,7,0]; /* E A D G B e (6→1번줄) */

/* 스케일 정의: root는 NOTE_NAMES(E=0) 기준 인덱스. ints는 루트로부터 반음 간격 */
/* NOTE_NAMES = E0 F1 F#2 G3 G#4 A5 A#6 B7 C8 C#9 D10 D#11 */
/* 크로마틱은 12음 전부라 루트 개념이 없음 → root:-1 (R 미표시) */
/* boxes: 각 포지션의 [최저프렛, 최고프렛] 범위. 이 범위 안의 모든 스케일 음을 표시.
   개방현(0)·시작프렛 아래 음도 범위에 들어가면 자동 포함 → 음 진행 정확 */
var SCALES = {
  chromatic:{ name:"크로마틱", desc:"반음계 반음", root:-1, ints:[0,1,2,3,4,5,6,7,8,9,10,11],
    boxes:[[0,3],[1,4],[3,6],[5,8],[7,10],[9,12],[12,15]] },
  minPenta: { name:"마이너 펜타토닉", desc:"Am: A C D E G", root:5, ints:[0,3,5,7,10],
    boxes:[[5,8],[7,11],[10,13],[0,3],[2,5],[12,15],[14,17]] },
  majPenta: { name:"메이저 펜타토닉", desc:"C: C D E G A", root:8, ints:[0,2,4,7,9],
    boxes:[[0,3],[2,5],[4,8],[7,10],[9,12],[12,15],[14,17]] },
  blues:    { name:"블루스", desc:"Am: A C D Eb E G", root:5, ints:[0,3,5,6,7,10],
    boxes:[[5,8],[7,11],[10,13],[0,3],[2,5],[12,15],[14,17]] },
  natMinor: { name:"내추럴 마이너", desc:"Am: A B C D E F G", root:5, ints:[0,2,3,5,7,8,10],
    boxes:[[0,3],[2,5],[4,7],[5,8],[7,10],[9,12],[12,15]] },
  major:    { name:"메이저", desc:"C: C D E F G A B", root:8, ints:[0,2,4,5,7,9,11],
    boxes:[[0,3],[2,5],[4,7],[7,10],[9,12],[12,15],[0,3]] }
};
var SCALE_ORDER = ["chromatic","minPenta","majPenta","blues","natMinor","major"];
var NUM_POSITIONS = 7;
/* 음표 = 한 박(4분음표)을 몇 등분해서 클릭을 울릴지. BPM은 항상 4분음표 기준 고정 */
var NOTE_VALS = [
  {id:"q",  label:"\u2669",        sub:1}, /* 4분: 한 박에 1번 */
  {id:"e8", label:"\u266A",        sub:2}, /* 8분: 한 박에 2번 */
  {id:"t3", label:"\u266A\u00B3",  sub:3}, /* 셋잇단: 한 박에 3번 */
  {id:"s16",label:"\u266C",        sub:4}  /* 16분: 한 박에 4번 */
];

/* 특정 줄/프렛이 스케일에 포함되는지 (rootOverride 주면 그 루트 기준) */
function noteIndexAt(stringIdx, fret){
  return (OPEN_STRINGS[stringIdx] + fret) % 12;
}
function effectiveRoot(scaleKey, rootOverride){
  if(rootOverride!==undefined && rootOverride!==null) return rootOverride;
  return SCALES[scaleKey].root;
}
function isInScale(scaleKey, stringIdx, fret, rootOverride){
  var sc = SCALES[scaleKey];
  var root = effectiveRoot(scaleKey, rootOverride);
  if(sc.ints.length===12) return true; /* 크로마틱 */
  var rel = ((noteIndexAt(stringIdx,fret) - root) % 12 + 12) % 12;
  return sc.ints.indexOf(rel) !== -1;
}
/* 음 이름 (NOTE_NAMES = E=0 기준 인덱스 → 표준 음이름) */
function noteNameAt(stringIdx, fret){
  return NOTE_NAMES[noteIndexAt(stringIdx, fret)];
}
/* 루트로부터의 반음 → 인터벌 라벨 */
var INTERVAL_LABELS = ["R","b2","2","b3","3","4","b5","5","b6","6","b7","7"];
/* 루트로부터의 반음 → 도수(스케일 디그리) 라벨. 스케일 ints 기준 */
function intervalLabelAt(scaleKey, stringIdx, fret, rootOverride){
  var root=effectiveRoot(scaleKey, rootOverride);
  var rel=((noteIndexAt(stringIdx,fret)-root)%12+12)%12;
  return INTERVAL_LABELS[rel];
}
function degreeLabelAt(scaleKey, stringIdx, fret, rootOverride){
  var sc=SCALES[scaleKey];
  var root=effectiveRoot(scaleKey, rootOverride);
  var rel=((noteIndexAt(stringIdx,fret)-root)%12+12)%12;
  var pos=sc.ints.indexOf(rel);
  return pos===-1 ? "" : String(pos+1); /* 스케일 내 몇 번째 음 */
}
function isRootAt(scaleKey, stringIdx, fret, rootOverride){
  var root=effectiveRoot(scaleKey, rootOverride);
  if(root<0) return false;
  return ((noteIndexAt(stringIdx,fret)-root)%12+12)%12===0;
}

export { NOTE_NAMES, OPEN_STRINGS, SCALES, SCALE_ORDER, NUM_POSITIONS, NOTE_VALS, noteIndexAt, effectiveRoot, isInScale, noteNameAt, INTERVAL_LABELS, intervalLabelAt, degreeLabelAt, isRootAt };

var KEY_SEMITONE={"C":0,"Db":1,"D":2,"Eb":3,"E":4,"F":5,"F#":6,"G":7,"Ab":8,"A":9,"Bb":10,"B":11};
var SEMITONE_KEY=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
export { KEY_SEMITONE, SEMITONE_KEY };
