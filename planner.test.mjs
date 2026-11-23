import test from 'node:test';
import assert from 'node:assert/strict';
import {plan,formatAir} from './planner.mjs';
const facts={outing:'School pickup',source:'Incense',trips:2,km:4,combined:4};
test('two trips become one',()=>assert.match(plan(facts).impact,/4 vehicle-km avoided/));
test('a detour can add kilometres',()=>assert.match(plan({...facts,combined:9}).impact,/1 vehicle-km added/));
test('reject invalid journey inputs',()=>{for(const trips of [0,21,NaN,1.5])assert.equal(plan({...facts,trips}),null);});
test('community and candle alternatives',()=>{const p=plan({...facts,outing:'Community event',source:'Candles'});assert.match(p.outing,/neighbours/);assert.match(p.indoor,/rechargeable/);});
test('zero pollutant is valid',()=>assert.match(formatAir({current:{time:100,pm2_5:0}},100000),/PM₂.₅ 0/));
test('missing and stale readings rejected',()=>{assert.throws(()=>formatAir({}));assert.throws(()=>formatAir({current:{time:1,pm2_5:19}},86400000));});
test('equal routes report equal distance', () => {
  assert.equal(plan({...facts, combined:8}).impact, 'Both options cover the same distance.');
});
test('a detour changes the recommendation as well as the arithmetic', () => {
  assert.match(plan({...facts, combined:9}).outing, /closer meeting point/);
});

import {nextAirWindow} from './planner.mjs';
const forecast = values => ({current:{time:0}, hourly:{time:values.map((_,i)=>(i+1)*3600),pm2_5:values}});
test('lowest complete forecast hour uses its measured units', () => {
  assert.match(nextAirWindow(forecast([11,10,9,8,12,13])), /8 µg\/m³/);
});
test('flat or incomplete forecast does not invent a preferred hour', () => {
  assert.match(nextAirWindow(forecast(Array(6).fill(12))), /level/);
  assert.equal(nextAirWindow(forecast([5,4,null,6,7,8])), '');
  assert.equal(nextAirWindow(forecast([5,4])), '');
});
