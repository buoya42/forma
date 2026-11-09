const VISIBILITY_THRESHOLD=0.5;
const COUNT_COOLDOWN_MS=450;
export const POSE_EXERCISES=Object.freeze({
  squat:{label:'Sentadilla',labelEn:'Squat',joints:[[23,25,27],[24,26,28]],low:105,high:155,countAt:'high',view:'De lado o en tres cuartos',viewEn:'Side or three-quarter view'},
  lunge:{label:'Zancada',labelEn:'Lunge',joints:[[23,25,27],[24,26,28]],low:105,high:155,countAt:'high',view:'De lado o en tres cuartos',viewEn:'Side or three-quarter view'},
  'push-up':{label:'Flexión',labelEn:'Push-up',joints:[[11,13,15],[12,14,16]],low:88,high:155,countAt:'high',view:'De lado, con el cuerpo completo visible',viewEn:'Side view, with the full body visible'},
  'wall-pushup':{label:'Flexión contra pared',labelEn:'Wall push-up',joints:[[11,13,15],[12,14,16]],low:88,high:155,countAt:'high',view:'De lado, con hombro, codo y muñeca visibles',viewEn:'Side view, with shoulder, elbow and wrist visible'},
  'db-bench':{label:'Press de pecho',labelEn:'Dumbbell bench press',joints:[[11,13,15],[12,14,16]],low:88,high:155,countAt:'high',view:'De lado, con brazo y hombro visibles',viewEn:'Side view, with arm and shoulder visible'},
  curl:{label:'Curl de bíceps',labelEn:'Biceps curl',joints:[[11,13,15],[12,14,16]],low:55,high:145,countAt:'high',view:'De frente o en tres cuartos',viewEn:'Front or three-quarter view'},
  'hammer-curl':{label:'Curl martillo',labelEn:'Hammer curl',joints:[[11,13,15],[12,14,16]],low:55,high:145,countAt:'high',view:'De frente o en tres cuartos',viewEn:'Front or three-quarter view'},
  row:{label:'Remo con mancuerna',labelEn:'Dumbbell row',joints:[[11,13,15],[12,14,16]],low:72,high:145,countAt:'high',view:'De lado, mostrando el brazo que trabaja',viewEn:'Side view, showing the working arm'},
  'shoulder-press':{label:'Press de hombros',labelEn:'Shoulder press',joints:[[11,13,15],[12,14,16]],low:90,high:155,countAt:'low',view:'De frente o en tres cuartos',viewEn:'Front or three-quarter view'},
  'lateral-raise':{label:'Elevación lateral',labelEn:'Lateral raise',joints:[[23,11,13],[24,12,14]],low:35,high:78,countAt:'low',view:'De frente, con brazos y caderas visibles',viewEn:'Front view, with arms and hips visible'},
  'triceps-extension':{label:'Extensión de tríceps',labelEn:'Triceps extension',joints:[[11,13,15],[12,14,16]],low:60,high:150,countAt:'high',view:'De lado, con hombro, codo y muñeca visibles',viewEn:'Side view, with shoulder, elbow and wrist visible'}
});
export const POSE_CONNECTIONS=Object.freeze([[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[17,19],[12,14],[14,16],[16,18],[16,20],[16,22],[18,20],[11,23],[12,24],[23,24],[23,25],[25,27],[27,29],[29,31],[27,31],[24,26],[26,28],[28,30],[30,32],[28,32]]);
function confidence(point){if(!point)return 0;const values=[point.visibility,point.presence].filter(value=>Number.isFinite(Number(value)));return values.length?Math.max(...values):1;}
export function calculateJointAngle(a,b,c){
  if(![a,b,c].every(point=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y)))return null;
  const abx=a.x-b.x,aby=a.y-b.y,cbx=c.x-b.x,cby=c.y-b.y,denominator=Math.hypot(abx,aby)*Math.hypot(cbx,cby);
  if(!denominator)return null;
  return Math.round(Math.acos(Math.max(-1,Math.min(1,(abx*cbx+aby*cby)/denominator)))*180/Math.PI);
}
export function createRepCounter(){return {count:0,phase:null,angle:null,lastCountAt:0};}
export function analyzePose(landmarks,exerciseId,tracker=createRepCounter(),now=Date.now()){
  const config=POSE_EXERCISES[exerciseId];
  if(!config)return {supported:false,visible:false,count:tracker.count,angle:null,phase:tracker.phase,confidence:0,feedback:'Este movimiento no tiene contador automático.'};
  if(!Array.isArray(landmarks)||landmarks.length<29)return {supported:true,visible:false,count:tracker.count,angle:null,phase:tracker.phase,confidence:0,feedback:'Colócate a una distancia que permita ver las articulaciones.'};
  const candidates=config.joints.map(indices=>{const points=indices.map(index=>landmarks[index]);return {points,score:points.reduce((sum,point)=>sum+confidence(point),0)/points.length};}).sort((a,b)=>b.score-a.score);
  const selected=candidates[0];
  if(!selected||selected.score<VISIBILITY_THRESHOLD)return {supported:true,visible:false,count:tracker.count,angle:null,phase:tracker.phase,confidence:selected?.score||0,feedback:'No se ven bien las articulaciones. Mejora la luz o ajusta el encuadre.'};
  const rawAngle=calculateJointAngle(...selected.points);
  if(rawAngle===null)return {supported:true,visible:false,count:tracker.count,angle:null,phase:tracker.phase,confidence:selected.score,feedback:'No se ha podido estimar el ángulo del movimiento.'};
  tracker.angle=tracker.angle===null?rawAngle:tracker.angle*.68+rawAngle*.32;
  const angle=Math.round(tracker.angle),nextPhase=angle<=config.low?'low':angle>=config.high?'high':null;
  if(nextPhase){
    if(tracker.phase&&tracker.phase!==nextPhase&&nextPhase===config.countAt&&now-tracker.lastCountAt>=COUNT_COOLDOWN_MS){tracker.count+=1;tracker.lastCountAt=now;}
    tracker.phase=nextPhase;
  }
  return {supported:true,visible:true,count:tracker.count,angle,phase:tracker.phase,confidence:selected.score,feedback:tracker.phase==='low'?'Completa el recorrido con control.':tracker.phase==='high'?'Vuelve de forma controlada a la posición inicial.':'Sigue moviéndote hasta completar el recorrido.'};
}
