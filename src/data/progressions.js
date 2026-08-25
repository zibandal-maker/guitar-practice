var BK_CHORD_IVS = {
  "maj":   [0,4,7],        "min":   [0,3,7],
  "dom7":  [0,4,7,10],     "maj7":  [0,4,7,11],   "min7":  [0,3,7,10],
  "m7b5":  [0,3,6,10],     "dim7":  [0,3,6,9],    "6":     [0,4,7,9],
  "min6":  [0,3,7,9],      "dom9":  [0,4,7,10,14],"maj9":  [0,4,7,11,14],
  "min9":  [0,3,7,10,14],  "sus7":  [0,5,7,10],   "aug":   [0,4,8]
};
/* 코드 타입 표기(화면) */
var CHORD_LABEL = {maj:"",min:"m",dom7:"7",maj7:"maj7",min7:"m7",m7b5:"m7♭5",
  dim7:"°7",6:"6",min6:"m6",dom9:"9",maj9:"maj9",min9:"m9",sus7:"7sus",aug:"+"};

/* 진행 헬퍼: 도수문자열 → 반음. (장음계 기준 I ii iii IV V vi vii) */
var DEG_SEMI = {I:0,bII:1,II:2,bIII:3,III:4,IV:5,bV:6,V:7,bVI:8,VI:9,bVII:10,VII:11};

/* 에디터용: 코드 타입 선택 순서 */
var CHORD_TYPE_ORDER = ["maj","min","dom7","maj7","min7","m7b5","dim7","6","min6","dom9","maj9","min9","sus7","aug"];
/* 그루브 옵션 (id → 라벨) */
var GROOVE_OPTS = [["shuffle","셔플"],["swing","스윙"],["slowblues","슬로"],["straight","스트레이트"],["funk","펑크"]];

/* b()=bar 생성 단축 */
function BK(d,t){ return {d:d, t:t}; }

var BK_PROGRESSIONS = [
  /* ---- 블루스 ---- */
  { id:"blues_std", name:"블루스 (표준 12바)", style:"블루스", groove:"shuffle", bpm:80,
    bars:[BK(0,"dom7"),BK(0,"dom7"),BK(0,"dom7"),BK(0,"dom7"),BK(5,"dom7"),BK(5,"dom7"),
          BK(0,"dom7"),BK(0,"dom7"),BK(7,"dom7"),BK(5,"dom7"),BK(0,"dom7"),BK(7,"dom7")] },
  { id:"blues_qc", name:"블루스 (퀵체인지)", style:"블루스", groove:"shuffle", bpm:80,
    bars:[BK(0,"dom7"),BK(5,"dom7"),BK(0,"dom7"),BK(0,"dom7"),BK(5,"dom7"),BK(5,"dom7"),
          BK(0,"dom7"),BK(0,"dom7"),BK(7,"dom7"),BK(5,"dom7"),BK(0,"dom7"),BK(7,"dom7")] },
  { id:"blues_jazz", name:"재즈 블루스 (12바)", style:"블루스", groove:"swing", bpm:120,
    bars:[BK(0,"dom7"),BK(5,"dom7"),BK(0,"dom7"),BK(7,"min7"),BK(5,"dom7"),BK(5,"dom7"),
          BK(0,"dom7"),BK(9,"dom7"),BK(2,"min7"),BK(7,"dom7"),BK(0,"dom7"),BK(7,"dom7")] },
  { id:"blues_minor", name:"마이너 블루스 (12바)", style:"블루스", groove:"slowblues", bpm:70,
    bars:[BK(0,"min7"),BK(0,"min7"),BK(0,"min7"),BK(0,"min7"),BK(5,"min7"),BK(5,"min7"),
          BK(0,"min7"),BK(0,"min7"),BK(8,"dom7"),BK(7,"dom7"),BK(0,"min7"),BK(7,"dom7")] },
  { id:"blues_slow", name:"슬로 블루스 (12바)", style:"블루스", groove:"slowblues", bpm:60,
    bars:[BK(0,"dom9"),BK(5,"dom9"),BK(0,"dom7"),BK(0,"dom7"),BK(5,"dom9"),BK(5,"dom9"),
          BK(0,"dom7"),BK(0,"dom7"),BK(7,"dom9"),BK(5,"dom9"),BK(0,"dom7"),BK(7,"dom7")] },
  /* ---- 재즈 ---- */
  { id:"jazz_ii_v_i", name:"ii–V–I (장조)", style:"재즈", groove:"swing", bpm:130,
    bars:[BK(2,"min7"),BK(7,"dom7"),BK(0,"maj7"),BK(0,"maj7")] },
  { id:"jazz_ii_v_i_min", name:"ii–V–i (단조)", style:"재즈", groove:"swing", bpm:120,
    bars:[BK(2,"m7b5"),BK(7,"dom7"),BK(0,"min7"),BK(0,"min7")] },
  { id:"jazz_autumn", name:"오텀 리브즈류 (8바)", style:"재즈", groove:"swing", bpm:120,
    bars:[BK(2,"min7"),BK(7,"dom7"),BK(0,"maj7"),BK(5,"maj7"),
          BK(9,"m7b5"),BK(2,"dom7"),BK(7,"min7"),BK(7,"min7")] },
  { id:"jazz_rhythm", name:"리듬 체인지 A (8바)", style:"재즈", groove:"swing", bpm:160,
    bars:[BK(0,"maj7"),BK(9,"min7"),BK(2,"min7"),BK(7,"dom7"),
          BK(0,"maj7"),BK(5,"dom7"),BK(0,"maj7"),BK(7,"dom7")] },
  /* F 재즈 블루스 (키를 F로 두면 F7 Bb7 …). 도수 기준이라 다른 키로도 이조됨 */
  { id:"jazz_blues_f", name:"F 재즈 블루스", style:"재즈", groove:"swing", bpm:120,
    bars:[BK(0,"dom7"),BK(5,"dom7"),BK(0,"dom7"),BK(7,"min7"),
          BK(5,"dom7"),BK(6,"dim7"),BK(0,"dom7"),BK(9,"dom7"),
          BK(2,"min7"),BK(7,"dom7"),BK(0,"dom7"),BK(7,"dom7")] },
  /* ---- 팝 / 락 ---- */
  { id:"pop_1546", name:"I–V–vi–IV (팝)", style:"팝/락", groove:"straight", bpm:100,
    bars:[BK(0,"maj"),BK(7,"maj"),BK(9,"min"),BK(5,"maj")] },
  { id:"pop_50s", name:"50s (I–vi–IV–V)", style:"팝/락", groove:"straight", bpm:90,
    bars:[BK(0,"maj"),BK(9,"min"),BK(5,"maj"),BK(7,"maj")] },
  { id:"pop_6415", name:"vi–IV–I–V", style:"팝/락", groove:"straight", bpm:100,
    bars:[BK(9,"min"),BK(5,"maj"),BK(0,"maj"),BK(7,"maj")] },
  { id:"pop_canon", name:"카논 진행 (8바)", style:"팝/락", groove:"straight", bpm:90,
    bars:[BK(0,"maj"),BK(7,"maj"),BK(9,"min"),BK(4,"min"),
          BK(5,"maj"),BK(0,"maj"),BK(5,"maj"),BK(7,"maj")] },
  { id:"rock_i_bVII_IV", name:"I–♭VII–IV (락)", style:"팝/락", groove:"straight", bpm:115,
    bars:[BK(0,"maj"),BK(10,"maj"),BK(5,"maj"),BK(5,"maj")] },
  /* ---- 펑크 / 소울 ---- */
  { id:"funk_1chord", name:"1코드 vamp (도리안)", style:"펑크/소울", groove:"funk", bpm:105,
    bars:[BK(0,"min9"),BK(0,"min9")] },
  { id:"funk_ii_v", name:"ii–V vamp", style:"펑크/소울", groove:"funk", bpm:100,
    bars:[BK(2,"min9"),BK(7,"dom9")] },
  { id:"soul_1645", name:"소울 I–vi–IV–V", style:"펑크/소울", groove:"funk", bpm:95,
    bars:[BK(0,"maj7"),BK(9,"min7"),BK(5,"maj7"),BK(7,"dom7")] }
];
function progById(id){ for(var i=0;i<BK_PROGRESSIONS.length;i++){ if(BK_PROGRESSIONS[i].id===id) return BK_PROGRESSIONS[i]; } return BK_PROGRESSIONS[0]; }

/* 하위호환: 기존 참조 (혹시 남아있을 경우 대비) */
var BLUES_DEG_SEMI = {I:0, IV:5, V:7};


export { BK_CHORD_IVS, CHORD_LABEL, DEG_SEMI, BK, BK_PROGRESSIONS, progById, BLUES_DEG_SEMI, CHORD_TYPE_ORDER, GROOVE_OPTS };
