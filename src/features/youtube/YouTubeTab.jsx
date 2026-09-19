import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { loadYT, parseVideoId } from '../../lib/youtube.js';
import { fmtTime } from '../../lib/timer.js';
import { loadYtVideos, saveYtVideos, loadYtLoops, saveYtLoops } from '../../lib/storage.js';
const e = React.createElement;

var SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

function YouTubeTab(){
  var vd=useState(loadYtVideos()); var videos=vd[0]; var setVideos=vd[1];
  var ci=useState(0); var curIdx=ci[0]; var setCurIdx=ci[1];
  var rd=useState(false); var ready=rd[0]; var setReady=rd[1];
  var pl=useState(false); var playing=pl[0]; var setPlaying=pl[1];
  var ct=useState(0); var curTime=ct[0]; var setCurTime=ct[1];
  var du=useState(0); var dur=du[0]; var setDur=du[1];
  var sp=useState(1); var speed=sp[0]; var setSpeed=sp[1];
  var lp=useState(loadYtLoops()); var loops=lp[0]; var setLoops=lp[1];
  var ls=useState(0); var loopStage=ls[0]; var setLoopStage=ls[1]; /* 0=없음,1=IN,2=반복 */
  var ui=useState(""); var urlInput=ui[0]; var setUrlInput=ui[1];
  var lm=useState(""); var loopMemo=lm[0]; var setLoopMemo=lm[1];

  var wrapRef=useRef(null);       /* iframe이 들어갈 컨테이너 */
  var playerRef=useRef(null);     /* YT.Player 인스턴스 */
  var loopRef=useRef({inT:null,outT:null});
  var pendingLoopRef=useRef(null);
  var curIdxRef=useRef(0); curIdxRef.current=curIdx;
  var loopStageRef=useRef(0); loopStageRef.current=loopStage;

  var curVideo = videos[curIdx] || null;

  /* 플레이어 1회 생성 (React 트리 밖 노드에 마운트) */
  useEffect(function(){
    var mount=document.createElement("div");
    if(wrapRef.current) wrapRef.current.appendChild(mount);
    var destroyed=false;
    loadYT().then(function(YT){
      if(destroyed) return;
      playerRef.current=new YT.Player(mount,{
        height:"100%", width:"100%",
        playerVars:{ rel:0, modestbranding:1, playsinline:1 },
        events:{
          onReady:function(){ setReady(true); },
          onStateChange:function(ev){ setPlaying(ev.data===1); } /* 1=PLAYING */
        }
      });
    });
    return function(){ destroyed=true; try{ playerRef.current&&playerRef.current.destroy&&playerRef.current.destroy(); }catch(e){} };
  },[]);

  /* 현재 영상 로드 */
  useEffect(function(){
    if(!ready || !playerRef.current || !curVideo) return;
    try{ playerRef.current.loadVideoById(curVideo.id); }catch(e){}
    resetLoop(); setCurTime(0);
    try{ playerRef.current.setPlaybackRate(speed); }catch(e){}
  },[curIdx, ready]);

  /* 폴링: 시간/구간반복/제목 */
  useEffect(function(){
    var iv=setInterval(function(){
      var p=playerRef.current; if(!p||!p.getCurrentTime) return;
      var t=0, d=0;
      try{ t=p.getCurrentTime()||0; d=(p.getDuration&&p.getDuration())||0; }catch(e){ return; }
      setCurTime(t);
      if(d && Math.abs(d-dur)>0.5) setDur(d);
      /* 대기 중 저장구간(다른 영상 전환 후) 적용 */
      if(pendingLoopRef.current && d>0){
        var lpd=pendingLoopRef.current; pendingLoopRef.current=null;
        loopRef.current={inT:lpd.inT,outT:lpd.outT}; setLoopStage(2);
        try{ p.seekTo(lpd.inT,true); p.playVideo(); }catch(e){}
      }
      /* 구간반복 */
      var lr=loopRef.current;
      if(loopStageRef.current===2 && lr.inT!=null && lr.outT!=null && t>=lr.outT){
        try{ p.seekTo(lr.inT,true); }catch(e){}
      }
      /* 제목 자동 채우기 */
      var cv=videos[curIdxRef.current];
      if(cv && !cv.name && p.getVideoData){
        try{ var vdata=p.getVideoData(); if(vdata && vdata.title){ updateName(cv.id, vdata.title); } }catch(e){}
      }
    },200);
    return function(){ clearInterval(iv); };
  },[dur, videos]);

  function updateName(id, title){
    setVideos(function(prev){
      var nv=prev.map(function(v){ return v.id===id ? Object.assign({},v,{name:title}) : v; });
      saveYtVideos(nv); return nv;
    });
  }
  function resetLoop(){ loopRef.current={inT:null,outT:null}; setLoopStage(0); }
  function loopButton(){
    var p=playerRef.current; if(!p) return;
    var lr=loopRef.current; var t=0; try{ t=p.getCurrentTime()||0; }catch(e){}
    if(loopStage===0){ lr.inT=t; setLoopStage(1); }
    else if(loopStage===1){ lr.outT=t; if(lr.outT<lr.inT){ var x=lr.inT; lr.inT=lr.outT; lr.outT=x; } setLoopStage(2); }
    else { resetLoop(); }
  }
  function togglePlay(){ var p=playerRef.current; if(!p) return; try{ if(playing) p.pauseVideo(); else p.playVideo(); }catch(e){} }
  function seekTo(t){ var p=playerRef.current; if(!p) return; try{ p.seekTo(Math.max(0,Math.min(dur||1e9,t)),true); setCurTime(t); }catch(e){} }
  function skip(s){ seekTo(curTime+s); }
  function setSpd(r){ setSpeed(r); try{ playerRef.current.setPlaybackRate(r); }catch(e){} }

  function addVideo(){
    var id=parseVideoId(urlInput);
    if(!id){ alert("유튜브 링크를 인식할 수 없어요. 주소(youtube.com/watch?v=… 또는 youtu.be/…)를 확인해주세요."); return; }
    var exist=-1; for(var i=0;i<videos.length;i++){ if(videos[i].id===id){ exist=i; break; } }
    if(exist>=0){ setCurIdx(exist); setUrlInput(""); return; }
    var nv=videos.concat([{ id:id, name:"", url:urlInput.trim(), added:Date.now() }]);
    setVideos(nv); saveYtVideos(nv); setUrlInput(""); setCurIdx(nv.length-1);
  }
  function deleteVideo(id){
    var nv=videos.filter(function(v){return v.id!==id;});
    setVideos(nv); saveYtVideos(nv);
    if(curVideo && curVideo.id===id) setCurIdx(0);
  }
  function saveLoopRegion(){
    var lr=loopRef.current;
    if(lr.inT==null||lr.outT==null){ alert("먼저 IN/OUT 구간을 지정하세요"); return; }
    if(loops.length>=100){ alert("저장 구간은 최대 100개입니다"); return; }
    var arr=loops.concat([{ id:Date.now(), memo:loopMemo||"구간 "+(loops.length+1),
      inT:lr.inT, outT:lr.outT, videoId:curVideo?curVideo.id:null, video:curVideo?(curVideo.name||curVideo.url):"" }]);
    saveYtLoops(arr); setLoops(arr); setLoopMemo("");
  }
  function gotoLoop(l){
    var idx=-1; for(var i=0;i<videos.length;i++){ if(videos[i].id===l.videoId){ idx=i; break; } }
    if(idx>=0 && (!curVideo || curVideo.id!==l.videoId)){ pendingLoopRef.current=l; setCurIdx(idx); return; }
    loopRef.current={inT:l.inT,outT:l.outT}; setLoopStage(2);
    try{ playerRef.current.seekTo(l.inT,true); playerRef.current.playVideo(); }catch(e){}
  }
  function delLoop(id){ var arr=loops.filter(function(l){return l.id!==id;}); saveYtLoops(arr); setLoops(arr); }

  var lr=loopRef.current;
  var pct=dur>0?(curTime/dur*100):0;

  return e("div",null,
    /* 링크 추가 */
    e("div",{className:"card"},
      e("div",{className:"sec-label"},"🎬 유튜브 링크 추가"),
      e("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap"}},
        e("input",{className:"memo-in", placeholder:"유튜브 링크 붙여넣기 (youtube.com/watch?v=… · youtu.be/…)",
          value:urlInput, onChange:function(ev){ setUrlInput(ev.target.value); },
          onKeyDown:function(ev){ if(ev.key==="Enter") addVideo(); }}),
        e("button",{className:"save-btn", onClick:addVideo},"＋ 추가")
      ),
      e("div",{className:"shortcut-bar",style:{marginTop:"10px"}},
        e("span",null, e("span",{className:"kbd"},"IN/OUT"),"구간 반복"),
        e("span",null, e("span",{className:"kbd"},"← →"),"±5초"),
        e("span",null, e("span",{className:"kbd"},"배속"),"0.25~2배")
      )
    ),
    /* 플레이어 프레임 */
    e("div",{className:"card"},
      curVideo ? e("div",{className:"track-title",style:{marginBottom:"10px"}}, curVideo.name || "(제목 불러오는 중…)") : null,
      e("div",{className:"yt-frame"}, e("div",{ref:wrapRef, style:{position:"absolute",inset:0}})),
      !curVideo ? e("div",{style:{textAlign:"center",color:"#8a92b0",padding:"20px 0"}},"위에 유튜브 링크를 추가하면 여기에서 재생됩니다") : null,
      /* 컨트롤 */
      curVideo ? e("div",null,
        e("div",{className:"seek-wrap"},
          e("div",{className:"seek-bar",onClick:function(ev){
            var rect=ev.currentTarget.getBoundingClientRect();
            seekTo((ev.clientX-rect.left)/rect.width*dur);
          }},
            e("div",{className:"seek-fill",style:{width:pct+"%"}}),
            (lr.inT!=null&&lr.outT!=null&&dur>0)?e("div",{className:"loop-region",
              style:{left:(lr.inT/dur*100)+"%",width:((lr.outT-lr.inT)/dur*100)+"%"}}):null,
            (lr.inT!=null&&dur>0)?e("div",{className:"loop-marker",style:{left:(lr.inT/dur*100)+"%"}}):null,
            (lr.outT!=null&&dur>0)?e("div",{className:"loop-marker",style:{left:(lr.outT/dur*100)+"%"}}):null,
            e("div",{className:"seek-handle",style:{left:pct+"%"}})
          ),
          e("div",{className:"time-row"},
            e("span",null, fmtTime(Math.floor(curTime))),
            e("span",null, fmtTime(Math.floor(dur)))
          )
        ),
        e("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center",marginBottom:"8px"}},
          e("button",{className:"play-btn"+(playing?" playing":""),onClick:togglePlay}, playing?"⏸ 일시정지":"▶ 재생"),
          e("button",{className:"icon-btn",onClick:function(){ skip(-5); }},"⏪ 5초"),
          e("button",{className:"icon-btn",onClick:function(){ skip(5); }},"5초 ⏩")
        ),
        /* 배속 */
        e("div",{className:"speed-row"},
          e("span",{style:{fontSize:"12px",color:"#8a92b0",fontWeight:"700",alignSelf:"center",marginRight:"2px"}},"배속"),
          SPEEDS.map(function(r){
            return e("button",{key:r,className:"speed-btn"+(speed===r?" on":""),onClick:function(){ setSpd(r); }}, r+"×");
          })
        ),
        /* 구간반복 */
        e("div",{className:"loop-box"},
          e("div",{style:{fontWeight:"700",marginBottom:"8px"}},"🔁 구간반복"),
          e("button",{className:"play-btn"+(loopStage>0?" playing":""),onClick:loopButton},
            loopStage===0?"[ IN/OUT ] 구간 찍기":loopStage===1?"OUT 지점 찍기":"■ 반복 해제"),
          e("div",{style:{fontSize:"12px",color:"#8a92b0",marginTop:"6px"}},
            loopStage===0?"재생 중 원하는 시작점에서 누르고, 끝점에서 한 번 더 누르세요."
              :loopStage===1?"이제 끝(OUT) 지점에서 누르세요.":"구간을 반복 재생 중입니다. 저장해두면 다음에 바로 불러올 수 있어요.")
        )
      ) : null
    ),
    /* 저장된 구간 */
    curVideo ? e("div",{className:"card"},
      e("div",{style:{display:"flex",justifyContent:"space-between"}},
        e("div",{className:"sec-label"},"📌 저장된 구간"),
        e("span",{style:{fontSize:"12px",color:"#8a92b0"}}, loops.length+"/100")
      ),
      e("div",{style:{display:"flex",gap:"8px",marginBottom:"8px"}},
        e("input",{className:"memo-in",placeholder:"구간 메모 (예: 솔로 1절, 인트로 리프…)",value:loopMemo,
          onChange:function(ev){ setLoopMemo(ev.target.value); }}),
        e("button",{className:"save-btn",onClick:saveLoopRegion},"💾 저장")
      ),
      loops.map(function(l){
        return e("div",{key:l.id,className:"saved-loop"},
          e("div",{style:{flex:1}},
            e("div",{style:{fontWeight:"700"}}, l.memo),
            e("div",{style:{fontSize:"11px",color:"#8a92b0"}},
              fmtTime(Math.floor(l.inT))+" ~ "+fmtTime(Math.floor(l.outT))+" · "+(l.video||""))
          ),
          e("button",{className:"icon-btn",onClick:function(){ gotoLoop(l); }},"▶ 이동"),
          e("button",{className:"icon-btn",onClick:function(){ delLoop(l.id); }},"×")
        );
      })
    ) : null,
    /* 영상 목록 */
    videos.length>0 ? e("div",{className:"card"},
      e("div",{className:"sec-label"},"🎬 내 영상 ("+videos.length+")"),
      videos.map(function(v,i){
        return e("div",{key:v.id,className:"playlist-item"+(curIdx===i?" cur":"")},
          e("div",{className:"pl-num",onClick:function(){ setCurIdx(i); }}, i+1),
          e("div",{className:"pl-name",onClick:function(){ setCurIdx(i); }}, v.name || v.url || v.id),
          e("button",{className:"icon-btn",onClick:function(){ deleteVideo(v.id); }},"×")
        );
      })
    ) : null
  );
}

export { YouTubeTab };
