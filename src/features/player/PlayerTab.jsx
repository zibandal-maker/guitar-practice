import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { idbPut, idbGet, idbGetMeta, idbDelete, loadTrackMeta, saveTrackMeta, loadLoops, saveLoops } from '../../lib/storage.js';
import { fmtTime } from '../../lib/timer.js';
const e = React.createElement;

function PlayerTab(){
  var tk=useState([]); var tracks=tk[0]; var setTracks=tk[1]; /* {id,name,buffer,type} */
  var ci=useState(0); var curIdx=ci[0]; var setCurIdx=ci[1];
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var ct=useState(0); var curTime=ct[0]; var setCurTime=ct[1];
  var du=useState(0); var dur=du[0]; var setDur=du[1];
  var sp=useState(1); var speed=sp[0]; var setSpeed=sp[1];
  var vo=useState(1); var vol=vo[0]; var setVol=vo[1];
  var meta=useState(loadTrackMeta()); var trackMeta=meta[0]; var setTrackMeta=meta[1];
  var lp=useState(loadLoops()); var loops=lp[0]; var setLoops=lp[1];
  var dz=useState(false); var dragOver=dz[0]; var setDragOver=dz[1];
  var tagF=useState(null); var tagFilter=tagF[0]; var setTagFilter=tagF[1];
  var favOnly=useState(false); var showFavOnly=favOnly[0]; var setShowFavOnly=favOnly[1];
  var loopMemo=useState(""); var loopMemoVal=loopMemo[0]; var setLoopMemo=loopMemo[1];
  var tagInput=useState(""); var tagInputVal=tagInput[0]; var setTagInput=tagInput[1];

  var audioRef=useRef(null);
  var loopRef=useRef({inT:null, outT:null}); /* 구간반복 */
  var pendingLoopRef=useRef(null); /* 트랙 전환 후 적용할 저장 구간 */
  var lpState=useState(0); var loopStage=lpState[0]; var setLoopStage=lpState[1]; /* 0=없음,1=IN,2=반복중 */
  var urlRef=useRef(null);
  var bufCache=useRef({}); /* id → ArrayBuffer 캐시 (lazy) */
  var ld=useState(false); var loadingBuf=ld[0]; var setLoadingBuf=ld[1];

  /* 초기 로드: 메타만 빠르게 복원 (buffer는 재생 시 lazy 로드) */
  useEffect(function(){
    idbGetMeta().then(function(metas){
      if(metas.length){
        metas.sort(function(a,b){return (a.order||0)-(b.order||0);});
        setTracks(metas); /* buffer 없는 메타 목록 */
      }
    }).catch(function(e){});
  },[]);

  var curTrack=tracks[curIdx]||null;

  /* 현재 트랙 → audio src (buffer를 lazy 로드 + 캐시) */
  useEffect(function(){
    if(!curTrack){ return; }
    var id=curTrack.id;
    function setSrc(buffer,type){
      if(urlRef.current){ URL.revokeObjectURL(urlRef.current); urlRef.current=null; }
      var blob=new Blob([buffer],{type:type||"audio/mpeg"});
      var url=URL.createObjectURL(blob); urlRef.current=url;
      if(audioRef.current){ audioRef.current.src=url; audioRef.current.load(); }
      setPlaying(false); setCurTime(0); resetLoop();
    }
    if(curTrack.buffer){ setSrc(curTrack.buffer, curTrack.type); return; }
    if(bufCache.current[id]){ setSrc(bufCache.current[id], curTrack.type); return; }
    /* 캐시에 없으면 IndexedDB에서 단일 조회 */
    setLoadingBuf(true);
    idbGet(id).then(function(rec){
      setLoadingBuf(false);
      if(rec && rec.buffer){ bufCache.current[id]=rec.buffer; setSrc(rec.buffer, rec.type); }
    }).catch(function(){ setLoadingBuf(false); });
  },[curIdx, tracks.length]);

  /* audio 이벤트 */
  useEffect(function(){
    var a=audioRef.current; if(!a) return;
    function onTime(){
      setCurTime(a.currentTime);
      var lr=loopRef.current;
      if(loopStage===2 && lr.inT!==null && lr.outT!==null && a.currentTime>=lr.outT){
        a.currentTime=lr.inT;
      }
    }
    function onMeta(){
      setDur(a.duration||0);
      /* 트랙 전환으로 대기 중인 저장 구간이 있으면, 트랙 로드 완료 후 적용 */
      if(pendingLoopRef.current){
        var pl2=pendingLoopRef.current; pendingLoopRef.current=null;
        var lr2=loopRef.current; lr2.inT=pl2.inT; lr2.outT=pl2.outT; setLoopStage(2);
        try{ a.currentTime=pl2.inT; }catch(e){} setCurTime(pl2.inT);
        a.play().then(function(){ setPlaying(true); }).catch(function(){});
      }
    }
    function onEnd(){ setPlaying(false); }
    a.addEventListener("timeupdate",onTime);
    a.addEventListener("loadedmetadata",onMeta);
    a.addEventListener("ended",onEnd);
    return function(){
      a.removeEventListener("timeupdate",onTime);
      a.removeEventListener("loadedmetadata",onMeta);
      a.removeEventListener("ended",onEnd);
    };
  },[loopStage]);

  useEffect(function(){ if(audioRef.current){ audioRef.current.playbackRate=speed; audioRef.current.preservesPitch=true; audioRef.current.mozPreservesPitch=true; audioRef.current.webkitPreservesPitch=true; } },[speed, curIdx]);
  useEffect(function(){ if(audioRef.current){ audioRef.current.volume=vol; } },[vol, curIdx]);

  function togglePlay(){
    var a=audioRef.current; if(!a||!curTrack) return;
    if(playing){ a.pause(); setPlaying(false); }
    else{ a.play().then(function(){setPlaying(true);}).catch(function(){}); }
  }
  function seekTo(t){ var a=audioRef.current; if(a){ a.currentTime=t; setCurTime(t); } }
  function skip(sec){ var a=audioRef.current; if(a){ seekTo(Math.max(0,Math.min(dur,a.currentTime+sec))); } }

  /* 구간반복: IN→OUT→리셋 */
  function resetLoop(){ loopRef.current={inT:null,outT:null}; setLoopStage(0); }
  function loopButton(){
    var a=audioRef.current; if(!a) return;
    var lr=loopRef.current;
    if(loopStage===0){ lr.inT=a.currentTime; setLoopStage(1); }
    else if(loopStage===1){ lr.outT=a.currentTime; if(lr.outT<lr.inT){ var t=lr.inT; lr.inT=lr.outT; lr.outT=t; } setLoopStage(2); }
    else { resetLoop(); }
  }

  /* 파일 추가 */
  function addFiles(fileList){
    var arr=Array.prototype.slice.call(fileList);
    var startOrder=tracks.length;
    var newMetas=[];
    var done=0;
    arr.forEach(function(file,i){
      var reader=new FileReader();
      reader.onload=function(ev){
        var id="trk_"+Date.now()+"_"+i;
        var rec={id:id, name:file.name.replace(/\.[^.]+$/,""),
          buffer:ev.target.result, type:file.type||"audio/mpeg", order:startOrder+i};
        idbPut(rec).then(function(){
          bufCache.current[id]=rec.buffer; /* 방금 추가분 캐시 → 재생 빠름 */
          newMetas.push({id:id,name:rec.name,type:rec.type,order:rec.order}); done++;
          if(done===arr.length){ setTracks(function(prev){ return prev.concat(newMetas); }); }
        }).catch(function(){ done++; });
      };
      reader.readAsArrayBuffer(file);
    });
  }
  function deleteTrack(id){
    delete bufCache.current[id];
    idbDelete(id).then(function(){
      setTracks(function(prev){ var np=prev.filter(function(t){return t.id!==id;}); if(curIdx>=np.length) setCurIdx(Math.max(0,np.length-1)); return np; });
    });
  }
  function clearAll(){
    if(!confirm("플레이리스트를 전부 삭제할까요?")) return;
    bufCache.current={};
    Promise.all(tracks.map(function(t){return idbDelete(t.id);})).then(function(){ setTracks([]); setCurIdx(0); });
  }

  /* 메타: 즐겨찾기/태그 */
  function getMeta(id){ return trackMeta[id]||{fav:false,tags:[]}; }
  function toggleFav(id){
    var nm=Object.assign({},trackMeta); var m=Object.assign({fav:false,tags:[]},nm[id]);
    m.fav=!m.fav; nm[id]=m; setTrackMeta(nm); saveTrackMeta(nm);
  }
  function addTag(id,tag){
    tag=tag.trim(); if(!tag) return;
    var nm=Object.assign({},trackMeta); var m=Object.assign({fav:false,tags:[]},nm[id]);
    if(m.tags.indexOf(tag)===-1) m.tags=m.tags.concat([tag]);
    nm[id]=m; setTrackMeta(nm); saveTrackMeta(nm); setTagInput("");
  }
  function removeTag(id,tag){
    var nm=Object.assign({},trackMeta); var m=Object.assign({fav:false,tags:[]},nm[id]);
    m.tags=m.tags.filter(function(t){return t!==tag;}); nm[id]=m; setTrackMeta(nm); saveTrackMeta(nm);
  }
  function allTags(){
    var s={}; tracks.forEach(function(t){ getMeta(t.id).tags.forEach(function(tg){s[tg]=true;}); });
    return Object.keys(s);
  }

  /* 저장된 구간 */
  function saveLoopRegion(){
    var lr=loopRef.current;
    if(lr.inT===null||lr.outT===null){ alert("먼저 IN/OUT 구간을 지정하세요"); return; }
    if(loops.length>=100){ alert("저장 구간은 최대 100개입니다"); return; }
    var arr=loops.concat([{id:Date.now(),memo:loopMemoVal||"구간 "+(loops.length+1),
      inT:lr.inT, outT:lr.outT,
      trackId:curTrack?curTrack.id:null, track:curTrack?curTrack.name:""}]);
    saveLoops(arr); setLoops(arr); setLoopMemo("");
  }
  function applyLoopNow(l){
    var lr=loopRef.current; lr.inT=l.inT; lr.outT=l.outT; setLoopStage(2);
    seekTo(l.inT); if(!playing) togglePlay();
  }
  function gotoLoop(l){
    /* 저장 구간이 다른 곡의 것이면 그 곡으로 자동 전환 후 적용.
       trackId 우선, 없으면(구버전 구간) 곡 이름으로 매칭 */
    var idx=-1;
    for(var i=0;i<tracks.length;i++){
      if((l.trackId && tracks[i].id===l.trackId) || (!l.trackId && l.track && tracks[i].name===l.track)){ idx=i; break; }
    }
    if(idx>=0 && (!curTrack || tracks[idx].id!==curTrack.id)){
      pendingLoopRef.current=l; setCurIdx(idx); return;
    }
    applyLoopNow(l);
  }
  function delLoop(id){ var arr=loops.filter(function(l){return l.id!==id;}); saveLoops(arr); setLoops(arr); }

  /* 키보드 단축키 */
  useEffect(function(){
    function onKey(ev){
      if(ev.target.tagName==="INPUT") return;
      if(ev.code==="Space"){ ev.preventDefault(); togglePlay(); }
      else if(ev.code==="ArrowLeft"){ skip(-5); }
      else if(ev.code==="ArrowRight"){ skip(5); }
      else if(ev.key==="r"||ev.key==="R"){ loopButton(); }
    }
    window.addEventListener("keydown",onKey);
    return function(){ window.removeEventListener("keydown",onKey); };
  },[playing,dur,loopStage,curIdx]);

  /* 표시할 트랙 필터 */
  function visibleTracks(){
    return tracks.map(function(t,i){return {t:t,i:i};}).filter(function(o){
      var m=getMeta(o.t.id);
      if(showFavOnly && !m.fav) return false;
      if(tagFilter && m.tags.indexOf(tagFilter)===-1) return false;
      return true;
    });
  }

  var lr=loopRef.current;
  var pct=dur>0?(curTime/dur*100):0;

  return e("div",null,
    e("audio",{ref:audioRef,style:{display:"none"}}),
    /* 단축키 */
    e("div",{className:"card"},
      e("div",{className:"shortcut-bar"},
        e("span",null, e("span",{className:"kbd"},"Space"),"재생/정지"),
        e("span",null, e("span",{className:"kbd"},"\u2190 \u2192"),"\u00B15초"),
        e("span",null, e("span",{className:"kbd"},"R"),"구간 IN\u2192OUT\u2192초기화")
      )
    ),
    /* 파일 추가 */
    e("div",{className:"card"},
      e("div",{className:"sec-label"},"음악 파일 추가 (MP3 · AAC · WAV · M4A)"),
      e("div",{className:"dropzone"+(dragOver?" drag":""),
        onClick:function(){ document.getElementById("fileInput").click(); },
        onDragOver:function(ev){ ev.preventDefault(); setDragOver(true); },
        onDragLeave:function(){ setDragOver(false); },
        onDrop:function(ev){ ev.preventDefault(); setDragOver(false); if(ev.dataTransfer.files.length) addFiles(ev.dataTransfer.files); }},
        e("div",{className:"dz-t"},"\uD83D\uDCC1 클릭하거나 드래그해서 추가"),
        e("div",{style:{fontSize:"12px",marginTop:"4px"}},"여러 파일 동시 추가 가능 · IndexedDB 영구 저장")
      ),
      e("input",{id:"fileInput",type:"file",accept:"audio/*",multiple:true,style:{display:"none"},
        onChange:function(ev){ if(ev.target.files.length) addFiles(ev.target.files); ev.target.value=""; }})
    ),
    /* 플레이어 본체 */
    curTrack ? e("div",{className:"card"},
      e("div",{className:"track-head"},
        e("div",null,
          e("div",{className:"track-title"}, curTrack.name + (loadingBuf?" · 불러오는 중…":"")),
          e("div",{style:{fontSize:"12px",color:"#8a92b0"}}, (curIdx+1)+" / "+tracks.length+"곡")
        ),
        e("div",{className:"track-ctrls"},
          e("button",{className:"step-btn",onClick:function(){ setCurIdx(Math.max(0,curIdx-1)); }},"\u23EE"),
          e("button",{className:"play-btn"+(playing?" playing":""),onClick:togglePlay}, playing?"\u25A0 정지":"\u25B6 재생"),
          e("button",{className:"step-btn",onClick:function(){ setCurIdx(Math.min(tracks.length-1,curIdx+1)); }},"\u23ED")
        )
      ),
      /* 시크바 */
      e("div",{className:"seek-wrap"},
        e("div",{className:"seek-bar",onClick:function(ev){
          var rect=ev.currentTarget.getBoundingClientRect();
          var ratio=(ev.clientX-rect.left)/rect.width; seekTo(ratio*dur);
        }},
          e("div",{className:"seek-fill",style:{width:pct+"%"}}),
          (lr.inT!==null&&lr.outT!==null)?e("div",{className:"loop-region",
            style:{left:(lr.inT/dur*100)+"%",width:((lr.outT-lr.inT)/dur*100)+"%"}}):null,
          (lr.inT!==null)?e("div",{className:"loop-marker",style:{left:(lr.inT/dur*100)+"%"}}):null,
          (lr.outT!==null)?e("div",{className:"loop-marker",style:{left:(lr.outT/dur*100)+"%"}}):null,
          e("div",{className:"seek-handle",style:{left:pct+"%"}})
        ),
        e("div",{className:"time-row"},
          e("span",null, fmtTime(Math.floor(curTime))),
          e("span",null, fmtTime(Math.floor(dur)))
        )
      ),
      /* 구간반복 */
      e("div",{className:"loop-box"},
        e("div",{style:{fontWeight:"700",marginBottom:"8px"}},"\uD83D\uDD01 구간반복"),
        e("button",{className:"play-btn"+(loopStage>0?" playing":""),onClick:loopButton},
          loopStage===0?"[ IN/OUT ] 구간 찍기":loopStage===1?"OUT 지점 찍기":"\u25A0 반복 해제"),
        e("div",{style:{fontSize:"12px",color:"#8a92b0",marginTop:"6px"}},
          "버튼 1번 = IN · 재생 중 다시 = OUT → 반복 시작 (R키 단축)")
      ),
      /* 배속 */
      e("div",null,
        e("div",{style:{fontSize:"13px",fontWeight:"700",color:"#8a92b0",marginBottom:"4px"}},"배속 (음정 유지)"),
        e("div",{className:"speed-row"},
          [0.5,0.6,0.7,0.8,0.9,1,1.1,1.2,1.5].map(function(s){
            return e("button",{key:s,className:"speed-btn"+(speed===s?" on":""),
              onClick:function(){ setSpeed(s); }}, s+"x");
          })
        ),
        e("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginTop:"6px"}},
          e("span",{style:{fontSize:"18px"}},"\uD83D\uDD0A"),
          e("input",{type:"range",className:"slider",min:0,max:1,step:0.01,value:vol,
            onChange:function(ev){ setVol(parseFloat(ev.target.value)); }}),
          e("span",{style:{fontSize:"12px",color:"#8a92b0",minWidth:"40px"}}, Math.round(vol*100)+"%")
        )
      )
    ) : e("div",{className:"card"}, e("div",{className:"placeholder"},"음악 파일을 추가하면 여기에 플레이어가 표시됩니다")),
    /* 저장된 구간 */
    curTrack ? e("div",{className:"card"},
      e("div",{style:{display:"flex",justifyContent:"space-between"}},
        e("div",{className:"sec-label"},"\uD83D\uDCCC 저장된 구간"),
        e("span",{style:{fontSize:"12px",color:"#8a92b0"}}, loops.length+"/100")
      ),
      e("div",{style:{display:"flex",gap:"8px",marginBottom:"8px"}},
        e("input",{className:"memo-in",placeholder:"구간 메모 (예: 인트로, 솔로 1절...)",value:loopMemoVal,
          onChange:function(ev){ setLoopMemo(ev.target.value); }}),
        e("button",{className:"save-btn",onClick:saveLoopRegion},"\uD83D\uDCBE 저장")
      ),
      loops.map(function(l,i){
        return e("div",{key:l.id,className:"saved-loop"},
          e("div",{className:"pl-num"},i+1),
          e("div",{style:{flex:1}},
            e("div",{style:{fontWeight:"700"}},l.memo),
            e("div",{style:{fontSize:"11px",color:"#8a92b0"}}, fmtTime(Math.floor(l.inT))+" ~ "+fmtTime(Math.floor(l.outT))+" · "+l.track)
          ),
          e("button",{className:"icon-btn",onClick:function(){ gotoLoop(l); }},"\u25B6 이동"),
          e("button",{className:"icon-btn",onClick:function(){ delLoop(l.id); }},"\u00D7")
        );
      })
    ) : null,
    /* 플레이리스트 + 즐겨찾기/태그 */
    tracks.length>0 ? e("div",{className:"card"},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}},
        e("div",{className:"sec-label"},"플레이리스트 ("+tracks.length+"곡) — 앱 재시작 후에도 유지"),
        e("div",null,
          e("button",{className:"tag-filter"+(showFavOnly?" on":""),onClick:function(){ setShowFavOnly(!showFavOnly); }},"\u2605 즐겨찾기만"),
          e("button",{className:"icon-btn",style:{marginLeft:"6px",color:"var(--red)",borderColor:"var(--red)"},onClick:clearAll},"전체 삭제")
        )
      ),
      /* 태그 필터 바 */
      allTags().length>0 ? e("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",margin:"8px 0"}},
        e("button",{className:"tag-filter"+(tagFilter===null?" on":""),onClick:function(){ setTagFilter(null); }},"전체"),
        allTags().map(function(tg){
          return e("button",{key:tg,className:"tag-filter"+(tagFilter===tg?" on":""),
            onClick:function(){ setTagFilter(tagFilter===tg?null:tg); }},"\uD83C\uDFF7 "+tg);
        })
      ) : null,
      e("div",{style:{marginTop:"8px"}},
        visibleTracks().map(function(o){
          var m=getMeta(o.t.id);
          return e("div",{key:o.t.id,className:"playlist-item"+(curIdx===o.i?" cur":"")},
            e("div",{className:"pl-num",onClick:function(){ setCurIdx(o.i); }},o.i+1),
            e("div",{style:{flex:1,cursor:"pointer"},onClick:function(){ setCurIdx(o.i); }},
              e("div",{className:"pl-name"},o.t.name),
              e("div",{style:{marginTop:"2px"}},
                m.tags.map(function(tg){
                  return e("span",{key:tg,className:"tag-chip",onClick:function(){ removeTag(o.t.id,tg); }},"\uD83C\uDFF7 "+tg+" \u00D7");
                }),
                (curIdx===o.i)?e("input",{className:"tag-input",placeholder:"+태그(Enter)",
                  value:tagInputVal, onChange:function(ev){setTagInput(ev.target.value);},
                  onKeyDown:function(ev){ if(ev.key==="Enter"){ addTag(o.t.id,tagInputVal); } }}):null
              )
            ),
            e("button",{className:"star-btn",onClick:function(){ toggleFav(o.t.id); },
              style:{color:m.fav?"var(--yellow)":"#cfd6ea"}}, m.fav?"\u2605":"\u2606"),
            e("button",{className:"icon-btn",onClick:function(){ deleteTrack(o.t.id); }},"\u00D7")
          );
        })
      )
    ) : null
  );
}

/* ---------------- 나머지 탭 (플레이스홀더, 단계 구현) ---------------- */

export { PlayerTab };
