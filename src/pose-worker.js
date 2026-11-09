import { createPoseLandmarker } from './pose-runtime.js';

let landmarker=null;
let closing=false;

self.addEventListener('message',async event=>{
  const data=event.data||{};
  if(data.type==='init'){
    if(landmarker)return;
    try{
      landmarker=await createPoseLandmarker();
      if(closing){landmarker.close();landmarker=null;return;}
      self.postMessage({type:'ready'});
    }catch(error){
      self.postMessage({type:'error',stage:'init',message:error?.message||String(error)});
    }
    return;
  }
  if(data.type==='close'){
    closing=true;
    if(landmarker){try{landmarker.close();}catch(error){console.warn('Pose model close failed',error);}landmarker=null;}
    self.close();
    return;
  }
  if(data.type==='frame'&&landmarker&&!closing){
    const bitmap=data.bitmap;
    try{
      landmarker.detectForVideo(bitmap,data.timestamp,result=>{
        self.postMessage({type:'pose',width:data.width,height:data.height,landmarks:result.landmarks?.[0]||null,worldLandmarks:result.worldLandmarks?.[0]||null});
      });
    }catch(error){
      self.postMessage({type:'error',stage:'frame',message:error?.message||String(error)});
    }finally{bitmap?.close?.();}
  }
});
