/* smplr 샘플 악기 로더 — 준비되면 window.__smplr 에 연결.
   백킹 트랙이 이걸 폴링해서 있으면 실제 샘플, 없으면 합성음 폴백. */
window.__smplrStatus = "idle"; /* idle / loading / ready / error */
window.__smplr = null;
window.__smplrDrumKit = "TR-808"; /* 현재 드럼머신 */
window.__smplrDrumNames = ["TR-808","TR-909","LM-2","MFB-512","Roland CR-78","Casio RZ-1","Acetone"];

/* 드럼 그룹 이름 → kick/snare/hat 매핑 (정확일치 → 부분일치 → 순서추정) */
window.mapDrumGroups = function(groups){
  groups = groups || [];
  function find(exact, parts){
    var i;
    for(i=0;i<exact.length;i++){ if(groups.indexOf(exact[i])!==-1) return exact[i]; }
    for(i=0;i<groups.length;i++){ var g=(groups[i]||"").toLowerCase();
      for(var j=0;j<parts.length;j++){ if(g.indexOf(parts[j])!==-1) return groups[i]; } }
    return null;
  }
  var kick=find(["kick","bass-drum","bassdrum","bd"],["kick","bass","bd"]);
  var snare=find(["snare","snare-drum","sd"],["snare","snr","sd"]);
  var hat=find(["hi-hat","hihat","closed-hat","closed-hi-hat","hat","ch"],["hat","hh"]);
  if(!kick && groups.length>0) kick=groups[0];
  if(!snare && groups.length>1) snare=groups[1];
  if(!hat && groups.length>2) hat=groups[2];
  return {kick:kick||"kick", snare:snare||"snare", hat:hat||"hi-hat"};
};

window.loadSmplr = async function(){
  if(window.__smplrStatus==="loading"||window.__smplrStatus==="ready") return;
  window.__smplrStatus="loading";
  try{
    var mod = await import("smplr");
    window.__smplrMod = mod;
    var ctx = window.__bkCtx || new (window.AudioContext||window.webkitAudioContext)();
    window.__bkCtx = ctx;
    /* 가용 드럼머신 목록 (런타임) */
    try{ if(mod.getDrumMachineNames){ var names=mod.getDrumMachineNames(); if(names&&names.length) window.__smplrDrumNames=names; } }catch(e){}
    /* 드럼머신: 현재 선택된 킷 */
    var kit = window.__smplrDrumKit;
    if(window.__smplrDrumNames.indexOf(kit)===-1) kit=window.__smplrDrumNames[0];
    window.__smplrDrumKit=kit;
    var drums = new mod.DrumMachine(ctx, { instrument: kit, volume: 110 });
    var piano = new mod.SplendidGrandPiano(ctx, { volume: 88 });
    /* 베이스: 어쿠스틱 베이스 (블루스 워킹 정석) */
    var bass  = new mod.Soundfont(ctx, { instrument: "acoustic_bass", volume: 115 });
    await Promise.all([drums.load, piano.load, bass.load]);
    /* 리버브: 피아노에만 살짝 (드럼은 메인 출력 유지) */
    var reverb=null;
    try{
      if(mod.Reverb){
        reverb=new mod.Reverb(ctx);
        piano.output.addEffect("reverb", reverb, 0.16);
      }
    }catch(e){ console.warn("리버브 생략:", e); }
    /* 드럼 그룹 이름을 런타임에 매핑 (머신마다 'hi-hat'/'hihat'/'closed-hat' 등 다름) */
    var groups=[]; try{ groups=drums.getGroupNames()||[]; }catch(e){}
    var drumMap=window.mapDrumGroups(groups);
    window.__drumGroups=groups;
    window.__drumMap=drumMap;
    window.__smplr = { ctx:ctx, drums:drums, piano:piano, bass:bass, mod:mod, reverb:reverb, drumMap:drumMap };
    window.__smplrStatus = "ready";
  }catch(err){
    console.warn("smplr 로드 실패, 합성음으로 폴백:", err);
    window.__smplrStatus = "error";
  }
};

/* 드럼머신 교체 (재생 중에도 가능) */
window.changeDrumKit = async function(kit){
  window.__smplrDrumKit = kit;
  if(window.__smplrStatus!=="ready" || !window.__smplr) return;
  try{
    var mod=window.__smplrMod, ctx=window.__bkCtx;
    var nd=new mod.DrumMachine(ctx, { instrument: kit, volume: 110 });
    await nd.load;
    var groups=[]; try{ groups=nd.getGroupNames()||[]; }catch(e){}
    var drumMap=window.mapDrumGroups(groups);
    window.__drumGroups=groups;
    window.__drumMap=drumMap;
    window.__smplr.drumMap=drumMap;
    window.__smplr.drums = nd;
  }catch(e){ console.warn("드럼킷 교체 실패:", e); }
};
