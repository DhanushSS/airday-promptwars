export const cities = { Bengaluru:[12.97,77.59], Delhi:[28.61,77.21], Mumbai:[19.08,72.88] };
const routines = {
  'School pickup':'Coordinate pickup with another caregiver on the same route. Switch off the engine while waiting at the gate.',
  'Grocery collection':'Pool nearby orders into one collection. Confirm pickup times before leaving to avoid a second journey.',
  'Community event':'Ask neighbours which stops overlap and agree on one shared pickup point before the event.'
};
export function plan({outing,source,trips,km,combined}) {
  if (!Object.hasOwn(routines,outing) || !Number.isInteger(trips) || trips<1 || trips>20 ||
      !Number.isFinite(km) || km<0.1 || km>500 || !Number.isFinite(combined) || combined<0.1 || combined>1000) return null;
  const delta = Math.round((trips*km-combined)*10)/10;
  const indoor = {Incense:'Try an unlit floral arrangement in place of burning incense. This removes one indoor smoke source.',
    Candles:'Use a rechargeable light for the evening. Skipping the flame avoids smoke from that candle.'};
  return {outing:routines[outing],indoor:indoor[source] ?? 'Keep shared indoor spaces smoke-free and ask guests to follow the same routine.',
    impact: Math.abs(delta)+' vehicle-km '+(delta<0?'added':'avoided')+' compared with separate trips.', calculation:trips+' × '+km+' km compared with '+combined+' km on the combined route.'};
}
export function formatAir(data,now=Date.now()){
  const reading=data?.current;
  if(!Number.isFinite(reading?.pm2_5)||reading.pm2_5<0||!Number.isFinite(reading.time)) throw Error('missing');
  const age=now-reading.time*1000;
  if(age>3*3600000||age< -3600000) throw Error('stale');
  const when=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(reading.time*1000);
  return 'Model estimate: PM₂.₅ '+reading.pm2_5+' µg/m³ · '+when+' IST.';
}
