<<<<<<< HEAD
/* 영속화: localStorage + IndexedDB */
function loadJamFavs(){ try{ var r=localStorage.getItem("gtr_jam_fav"); return r?JSON.parse(r):[]; }catch(e){ return []; } }
function saveJamFavs(arr){ try{ localStorage.setItem("gtr_jam_fav", JSON.stringify(arr.slice(-30))); }catch(e){} }
function loadSessions(){
  try{ var r=localStorage.getItem("gtr5"); return r?JSON.parse(r):[]; }catch(e){ return []; }
}
function saveSessions(arr){
  try{ localStorage.setItem("gtr5", JSON.stringify(arr.slice(-100))); }catch(e){}
}

function loadCustomPatterns(){ try{var r=localStorage.getItem("gtr_custpat"); return r?JSON.parse(r):[];}catch(e){return [];} }
function saveCustomPatterns(arr){ try{localStorage.setItem("gtr_custpat",JSON.stringify(arr.slice(0,8)));}catch(e){} }
var GDB={ name:"GuitarTrackerDB", store:"tracks", db:null };
function idbOpen(){
  return new Promise(function(resolve,reject){
    if(GDB.db){ resolve(GDB.db); return; }
    var req=indexedDB.open(GDB.name,1);
    req.onupgradeneeded=function(ev){
      var db=ev.target.result;
      if(!db.objectStoreNames.contains(GDB.store)) db.createObjectStore(GDB.store,{keyPath:"id"});
    };
    req.onsuccess=function(ev){ GDB.db=ev.target.result; resolve(GDB.db); };
    req.onerror=function(){ reject(req.error); };
  });
}
function idbPut(rec){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readwrite");
      tx.objectStore(GDB.store).put(rec);
      tx.oncomplete=function(){res();}; tx.onerror=function(){rej(tx.error);};
    });
  });
}
function idbGetAll(){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readonly");
      var rq=tx.objectStore(GDB.store).getAll();
      rq.onsuccess=function(){ res(rq.result||[]); }; rq.onerror=function(){rej(rq.error);};
    });
  });
}
/* 단일 트랙(buffer 포함) 조회 — 재생 시 lazy 로드용 */
function idbGet(id){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readonly");
      var rq=tx.objectStore(GDB.store).get(id);
      rq.onsuccess=function(){ res(rq.result||null); }; rq.onerror=function(){rej(rq.error);};
    });
  });
}
/* 메타만(buffer 제외) 조회 — 커서로 가벼운 필드만 추출 */
function idbGetMeta(){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readonly");
      var rq=tx.objectStore(GDB.store).openCursor();
      var out=[];
      rq.onsuccess=function(ev){
        var cur=ev.target.result;
        if(cur){ var v=cur.value; out.push({id:v.id,name:v.name,type:v.type,order:v.order||0}); cur.continue(); }
        else res(out);
      };
      rq.onerror=function(){rej(rq.error);};
    });
  });
}
function idbDelete(id){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readwrite");
      tx.objectStore(GDB.store).delete(id);
      tx.oncomplete=function(){res();}; tx.onerror=function(){rej(tx.error);};
    });
  });
}
/* 트랙 메타(즐겨찾기/태그) + 구간 저장 (localStorage) */
function loadTrackMeta(){ try{var r=localStorage.getItem("gtr_trackmeta");return r?JSON.parse(r):{};}catch(e){return {};} }
function saveTrackMeta(o){ try{localStorage.setItem("gtr_trackmeta",JSON.stringify(o));}catch(e){} }
function loadLoops(){ try{var r=localStorage.getItem("gtr_loops");return r?JSON.parse(r):[];}catch(e){return [];} }
function saveLoops(a){ try{localStorage.setItem("gtr_loops",JSON.stringify(a.slice(0,100)));}catch(e){} }

/* 백킹 커스텀 코드진행 */
function loadBkCustom(){ try{var r=localStorage.getItem("gtr_bk_custom"); return r?JSON.parse(r):[];}catch(e){return [];} }
function saveBkCustom(arr){ try{localStorage.setItem("gtr_bk_custom", JSON.stringify(arr.slice(0,50)));}catch(e){} }

export { loadJamFavs, saveJamFavs, loadSessions, saveSessions, loadCustomPatterns, saveCustomPatterns, GDB, idbOpen, idbPut, idbGetAll, idbGet, idbGetMeta, idbDelete, loadTrackMeta, saveTrackMeta, loadLoops, saveLoops, loadBkCustom, saveBkCustom };
=======
/* 영속화: localStorage + IndexedDB */
function loadJamFavs(){ try{ var r=localStorage.getItem("gtr_jam_fav"); return r?JSON.parse(r):[]; }catch(e){ return []; } }
function saveJamFavs(arr){ try{ localStorage.setItem("gtr_jam_fav", JSON.stringify(arr.slice(-30))); }catch(e){} }
function loadSessions(){
  try{ var r=localStorage.getItem("gtr5"); return r?JSON.parse(r):[]; }catch(e){ return []; }
}
function saveSessions(arr){
  try{ localStorage.setItem("gtr5", JSON.stringify(arr.slice(-100))); }catch(e){}
}

function loadCustomPatterns(){ try{var r=localStorage.getItem("gtr_custpat"); return r?JSON.parse(r):[];}catch(e){return [];} }
function saveCustomPatterns(arr){ try{localStorage.setItem("gtr_custpat",JSON.stringify(arr.slice(0,8)));}catch(e){} }
var GDB={ name:"GuitarTrackerDB", store:"tracks", db:null };
function idbOpen(){
  return new Promise(function(resolve,reject){
    if(GDB.db){ resolve(GDB.db); return; }
    var req=indexedDB.open(GDB.name,1);
    req.onupgradeneeded=function(ev){
      var db=ev.target.result;
      if(!db.objectStoreNames.contains(GDB.store)) db.createObjectStore(GDB.store,{keyPath:"id"});
    };
    req.onsuccess=function(ev){ GDB.db=ev.target.result; resolve(GDB.db); };
    req.onerror=function(){ reject(req.error); };
  });
}
function idbPut(rec){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readwrite");
      tx.objectStore(GDB.store).put(rec);
      tx.oncomplete=function(){res();}; tx.onerror=function(){rej(tx.error);};
    });
  });
}
function idbGetAll(){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readonly");
      var rq=tx.objectStore(GDB.store).getAll();
      rq.onsuccess=function(){ res(rq.result||[]); }; rq.onerror=function(){rej(rq.error);};
    });
  });
}
/* 단일 트랙(buffer 포함) 조회 — 재생 시 lazy 로드용 */
function idbGet(id){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readonly");
      var rq=tx.objectStore(GDB.store).get(id);
      rq.onsuccess=function(){ res(rq.result||null); }; rq.onerror=function(){rej(rq.error);};
    });
  });
}
/* 메타만(buffer 제외) 조회 — 커서로 가벼운 필드만 추출 */
function idbGetMeta(){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readonly");
      var rq=tx.objectStore(GDB.store).openCursor();
      var out=[];
      rq.onsuccess=function(ev){
        var cur=ev.target.result;
        if(cur){ var v=cur.value; out.push({id:v.id,name:v.name,type:v.type,order:v.order||0}); cur.continue(); }
        else res(out);
      };
      rq.onerror=function(){rej(rq.error);};
    });
  });
}
function idbDelete(id){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(GDB.store,"readwrite");
      tx.objectStore(GDB.store).delete(id);
      tx.oncomplete=function(){res();}; tx.onerror=function(){rej(tx.error);};
    });
  });
}
/* 트랙 메타(즐겨찾기/태그) + 구간 저장 (localStorage) */
function loadTrackMeta(){ try{var r=localStorage.getItem("gtr_trackmeta");return r?JSON.parse(r):{};}catch(e){return {};} }
function saveTrackMeta(o){ try{localStorage.setItem("gtr_trackmeta",JSON.stringify(o));}catch(e){} }
function loadLoops(){ try{var r=localStorage.getItem("gtr_loops");return r?JSON.parse(r):[];}catch(e){return [];} }
function saveLoops(a){ try{localStorage.setItem("gtr_loops",JSON.stringify(a.slice(0,100)));}catch(e){} }

/* 백킹 커스텀 코드진행 */
function loadBkCustom(){ try{var r=localStorage.getItem("gtr_bk_custom"); return r?JSON.parse(r):[];}catch(e){return [];} }
function saveBkCustom(arr){ try{localStorage.setItem("gtr_bk_custom", JSON.stringify(arr.slice(0,50)));}catch(e){} }

export { loadJamFavs, saveJamFavs, loadSessions, saveSessions, loadCustomPatterns, saveCustomPatterns, GDB, idbOpen, idbPut, idbGetAll, idbGet, idbGetMeta, idbDelete, loadTrackMeta, saveTrackMeta, loadLoops, saveLoops, loadBkCustom, saveBkCustom };
>>>>>>> 2f92f95a7b5d5397a1a4ef0d21b28402df7da544
