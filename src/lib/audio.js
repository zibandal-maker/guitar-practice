var _fbCtx=null;
function playNote(stringIdx, fret){
  try{
    if(!_fbCtx) _fbCtx=new (window.AudioContext||window.webkitAudioContext)();
    var ctx=_fbCtx; if(ctx.state==="suspended") ctx.resume();
    /* 개방현 주파수(낮은E~높은e). 6번줄 low E=82.41Hz */
    var openFreq=[82.41,110.00,146.83,196.00,246.94,329.63]; /* 6→1번줄 */
    var f=openFreq[stringIdx]*Math.pow(2, fret/12);
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type="triangle"; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3,ctx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.6);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.65);
  }catch(e){}
}


export { playNote };
