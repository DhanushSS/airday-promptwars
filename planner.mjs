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
  return {outing:delta < 0 ? 'The combined route adds driving. Keep the separate trips or try a closer meeting point and compare again.' : routines[outing],indoor:indoor[source] ?? 'Keep shared indoor spaces smoke-free and ask guests to follow the same routine.',
    impact: delta===0 ? 'Both options cover the same distance.' : Math.abs(delta)+' vehicle-km '+(delta<0?'added':'avoided')+' compared with separate trips.', calculation:trips+' × '+km+' km compared with '+combined+' km on the combined route.'};
}
export function formatAir(data,now=Date.now()){
  const reading=data?.current;
  if(!Number.isFinite(reading?.pm2_5)||reading.pm2_5<0||!Number.isFinite(reading.time)) throw Error('missing');
  const age=now-reading.time*1000;
  if(age>3*3600000||age< -3600000) throw Error('stale');
  const when=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(reading.time*1000);
  return 'Model estimate: PM₂.₅ '+reading.pm2_5+' µg/m³ · '+when+' IST.';
}

/** Find the lowest hourly estimate over the next six hours of model coverage. */
export function nextAirWindow(data) {
  const {current, hourly} = data ?? {};
  if (!Number.isFinite(current?.time) || !Array.isArray(hourly?.time) ||
      !Array.isArray(hourly.pm2_5)) return '';
  const start = current.time;
  const hours = hourly.time.map((time, i) => ({time, value: hourly.pm2_5[i]}))
    .filter(row => row.time > start && row.time <= start + 6 * 3600);
  if (hours.length !== 6 || hours.some((row, i) => !Number.isFinite(row.value) ||
      row.value < 0 || (i > 0 && row.time - hours[i - 1].time !== 3600))) return '';
  const values = hours.map(row => row.value);
  if (Math.max(...values) === Math.min(...values)) return 'The next six hourly estimates are level.';
  const low = hours.find(row => row.value === Math.min(...values));
  const time = new Intl.DateTimeFormat('en-IN', {hour:'numeric', minute:'2-digit', timeZone:'Asia/Kolkata'}).format(low.time * 1000);
  return 'Lowest modelled PM₂.₅ in the next six hours: '+low.value+' µg/m³ at '+time+' IST.';
}
