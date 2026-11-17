import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,aggregate,toCSV,fields,csvCell} from '../public/data.js';
const header=fields.join(',');
test('CSV supports quoted campaign names and missing call counts',()=>{
 const rows=parseCSV(header+'\r\n2026-11-18,meta,"Calls, local",100,10,25,,,\r\n');
 assert.equal(rows[0].campaign,'Calls, local');assert.equal(rows[0].calls,null);
 assert.equal(aggregate(rows).costPerCall,null);assert.equal(aggregate(rows).ctr,10);
 assert.deepEqual(parseCSV(toCSV(rows)),rows);
});
test('cost per call uses calls, not clicks; partial counts stay unknown',()=>{
 const a={impressions:100,clicks:10,spend:40,calls:2,qualified_calls:1,position:null};
 assert.equal(aggregate([a]).costPerCall,20);
 assert.equal(aggregate([a,{...a,calls:null}]).calls,null);
 assert.equal(aggregate([]).spend,null);
});
test('rejects impossible dates, negative spend, and invalid channels',()=>{
 for(const row of ['2026-02-30,meta,Test,100,10,2,1,1,','2026-11-18,meta,Test,100,10,-2,1,1,','2026-11-18,bad,Test,100,10,2,1,1,','2026-11-18,seo,Test,100,10,2,,,2'])assert.throws(()=>parseCSV(header+'\n'+row));
});
test('SEO position is impression-weighted',()=>{
 assert.equal(aggregate([{impressions:100,position:2},{impressions:300,position:6}]).position,5);
});
test('CSV neutralizes spreadsheet formulas',()=>{
 assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('normal'),'"normal"');
});
