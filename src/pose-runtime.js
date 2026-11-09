const PACKAGE='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2';
const MODEL='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
let sdkPromise;
export async function createPoseLandmarker(){
  if(!sdkPromise)sdkPromise=import(`${PACKAGE}/vision_bundle.mjs`);
  const sdk=await sdkPromise,vision=await sdk.FilesetResolver.forVisionTasks(`${PACKAGE}/wasm`);
  const options={baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55};
  try{return await sdk.PoseLandmarker.createFromOptions(vision,options);}
  catch(error){console.warn('MediaPipe GPU delegate unavailable; retrying on CPU.',error);return sdk.PoseLandmarker.createFromOptions(vision,{...options,baseOptions:{modelAssetPath:MODEL,delegate:'CPU'}});}
}
