function synthTone(ctx, t, freq, dur, type, peak, dest){
  var o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type||"triangle"; o.frequency.value=freq;
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(peak,t+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(dest||ctx.destination); o.start(t); o.stop(t+dur+0.02);
}
function synthKick(ctx,t,dest){
  var o=ctx.createOscillator(), g=ctx.createGain();
  o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12);
  g.gain.setValueAtTime(0.9,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
  o.connect(g); g.connect(dest||ctx.destination); o.start(t); o.stop(t+0.2);
}
function synthSnare(ctx,t,dest){
  var bs=ctx.sampleRate*0.12, buf=ctx.createBuffer(1,bs,ctx.sampleRate), d=buf.getChannelData(0);
  for(var i=0;i<bs;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/bs,1.5);
  var src=ctx.createBufferSource(); src.buffer=buf;
  var bp=ctx.createBiquadFilter(); bp.type="highpass"; bp.frequency.value=1200;
  var g=ctx.createGain(); g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
  src.connect(bp); bp.connect(g); g.connect(dest||ctx.destination); src.start(t); src.stop(t+0.13);
}
function synthHat(ctx,t,open,dest){
  var dur=open?0.12:0.04;
  var bs=ctx.sampleRate*dur, buf=ctx.createBuffer(1,bs,ctx.sampleRate), d=buf.getChannelData(0);
  for(var i=0;i<bs;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/bs,2);
  var src=ctx.createBufferSource(); src.buffer=buf;
  var hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=7000;
  var g=ctx.createGain(); g.gain.setValueAtTime(open?0.22:0.18,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(hp); hp.connect(g); g.connect(dest||ctx.destination); src.start(t); src.stop(t+dur+0.02);
}
/* 합성 폴백 코드: 주어진 인터벌 배열 */
function chordFreqsType(rootSemi, ivs){
  var base=130.81; /* C3 */
  return ivs.map(function(iv){ return base*Math.pow(2,((rootSemi+iv))/12); });
}
function bassFreq(rootSemi, scaleStep){
  var base=65.41; /* C2 */
  return base*Math.pow(2,((rootSemi+scaleStep))/12);
}

export { synthTone, synthKick, synthSnare, synthHat, chordFreqsType, bassFreq };
