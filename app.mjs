import {cities, plan, formatAir} from './planner.mjs';
const el=id=>document.getElementById(id);
const form=el('plan');
let version=0, readingRequest=0, currentPlan;
function render(){
  version++;
  currentPlan=plan({outing:el('outing').value,source:el('source').value,trips:el('trips').valueAsNumber,km:el('km').valueAsNumber,combined:el('combined').valueAsNumber});
  const target=el('result');
  target.replaceChildren();
  el('brief').textContent='Generate an explanation using the current routine and air context.';
  if(!form.checkValidity() || !currentPlan){currentPlan=null;target.textContent='Check the trip count and distances above.';return;}
  const dl=document.createElement('dl');
  for(const [label,value] of [['Shared outing',currentPlan.outing],['At home',currentPlan.indoor],['Travel impact',currentPlan.impact+' '+currentPlan.calculation]]){
    const dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=label;dd.textContent=value;dl.append(dt,dd);
  }
  target.append(dl);
}
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',e=>{
  if(e.target===el('city')){readingRequest++;el('air').textContent='No reading loaded for '+el('city').value+'.';}
  render();
});
el('refresh').onclick=async()=>{
  const request=++readingRequest;
  const [latitude,longitude]=cities[el('city').value];
  el('air').textContent='Retrieving city estimate…';render();
  try{
    const params=new URLSearchParams({latitude,longitude,current:'pm2_5',timeformat:'unixtime'});
    const response=await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?'+params,{signal:AbortSignal.timeout(9000)});
    if(!response.ok)throw Error('provider');
    const text=formatAir(await response.json());if(request===readingRequest)el('air').textContent=text;
  }catch{if(request===readingRequest)el('air').textContent='A recent estimate is unavailable. Check the official AQI dashboard below.';}
  if(request===readingRequest)render();
};
el('generate').onclick=async()=>{
  if(!currentPlan){form.reportValidity();return;}
  const revision=version,button=el('generate'), status=el('brief');
  let session;
  button.disabled=true;
  try{
    const model=globalThis.LanguageModel;
    const options={expectedInputs:[{type:'text',languages:['en']}],expectedOutputs:[{type:'text',languages:['en']}]};
    if(!model || await model.availability(options)==='unavailable')throw Error('unavailable');
    status.textContent='Preparing the on-device model…';
    session=await model.create(options);
    const prompt='Write a three-sentence English briefing for a family using only the supplied plan. Label model estimates and missing readings accurately. Explain one feasible swap and its direct impact. Preserve the trip arithmetic. Avoid medical advice, emissions conversions or invented readings. Facts: ';
    const text=await session.prompt(prompt+JSON.stringify({city:el('city').value,air:el('air').textContent,plan:currentPlan}));
    if(revision===version)status.textContent='Gemini Nano · '+text;
  }catch{if(revision===version)status.textContent='On-device AI is unavailable in this browser. Your calculated household plan is ready above.';}
  finally{session?.destroy();button.disabled=false;}
};
render();
