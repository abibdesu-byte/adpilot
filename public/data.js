export const fields=['date','channel','campaign','impressions','clicks','spend','calls','qualified_calls','position'];
export function parseCSV(input){
  const rows=[];let row=[],cell='',quoted=false;
  const source=input.replace(/^\uFEFF/,'');
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else if(quoted){quoted=false;}else if(cell===''){quoted=true;}else throw new Error('Unexpected quote in CSV.');}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('Unclosed quote in CSV.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length<2)throw new Error('CSV must include a header and at least one data row.');
  const headers=rows.shift().map(x=>x.trim().toLowerCase());
  if(fields.some(x=>!headers.includes(x)))throw new Error('Missing columns. Download the CSV template for the required format.');
  if(new Set(headers).size!==headers.length)throw new Error('Duplicate CSV headers.');
  if(rows.length>10000)throw new Error('Import up to 10,000 rows at a time.');
  return rows.map((cells,index)=>{
    if(cells.length!==headers.length)throw new Error(`Row ${index+2} has the wrong number of columns.`);
    const r=Object.fromEntries(headers.map((key,i)=>[key,cells[i].trim()]));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date)throw new Error(`Row ${index+2}: use a valid YYYY-MM-DD date.`);
    r.channel=r.channel.toLowerCase();if(!['meta','google','seo'].includes(r.channel))throw new Error(`Row ${index+2}: channel must be meta, google, or seo.`);
    if(!r.campaign)throw new Error(`Row ${index+2}: campaign or keyword is required.`);
    for(const f of fields.slice(3)){if(r[f]===''){r[f]=null;continue;}const n=Number(r[f]);if(!Number.isFinite(n)||n<0)throw new Error(`Row ${index+2}: ${f} must be non-negative or blank.`);if(f!=='spend'&&f!=='position'&&!Number.isInteger(n))throw new Error(`Row ${index+2}: ${f} must be a whole number.`);r[f]=n;}
    if(r.clicks!==null&&r.impressions!==null&&r.clicks>r.impressions)throw new Error(`Row ${index+2}: clicks exceed impressions.`);
    if(r.qualified_calls!==null&&r.calls!==null&&r.qualified_calls>r.calls)throw new Error(`Row ${index+2}: qualified calls exceed calls.`);
    if(r.channel==='seo'&&r.spend>0)throw new Error(`Row ${index+2}: SEO rows cannot contain ad spend.`);
    if(r.position!==null&&(r.channel!=='seo'||r.position<1))throw new Error(`Row ${index+2}: position is for SEO and must be at least 1.`);
    return Object.fromEntries(fields.map(f=>[f,r[f]]));
  });
}
export function aggregate(rows){
  const completeSum=key=>rows.length&&rows.every(r=>r[key]!==null&&r[key]!==undefined)?rows.reduce((n,r)=>n+r[key],0):null;
  const result=Object.fromEntries(['impressions','clicks','spend','calls','qualified_calls'].map(k=>[k,completeSum(k)]));
  result.ctr=result.impressions>0&&result.clicks!==null?100*result.clicks/result.impressions:null;
  result.cpc=result.clicks>0&&result.spend!==null?result.spend/result.clicks:null;
  result.costPerCall=result.calls>0&&result.spend!==null?result.spend/result.calls:null;
  result.position=rows.length&&rows.every(r=>r.position!==null&&r.position!==undefined&&r.impressions!==null)&&result.impressions>0?rows.reduce((n,r)=>n+r.position*r.impressions,0)/result.impressions:null;
  return result;
}
export const csvCell=v=>{const s=String(v??'');const safe=/^[=+@\-\t\r]/.test(s)?`'${s}`:s;return '"'+safe.replaceAll('"','""')+'"';};
export const toCSV=rows=>[fields.join(','),...rows.map(r=>fields.map(k=>csvCell(r[k])).join(','))].join('\r\n');
export function demoRows(){
  const rows=[];const date=new Date();date.setUTCHours(0,0,0,0);
  for(let i=13;i>=0;i--){const d=new Date(date);d.setUTCDate(d.getUTCDate()-i);const day=d.toISOString().slice(0,10);
    rows.push({date:day,channel:'meta',campaign:'Local service · Call enquiries',impressions:1840+(i%5)*127,clicks:46+(i%4)*9,spend:45+(i%4)*7,calls:5+(i%3),qualified_calls:3+(i%3),position:null},
      {date:day,channel:'google',campaign:'Search · High-intent calls',impressions:610+(i%5)*81,clicks:33+(i%4)*4,spend:62+(i%5)*6,calls:8+(i%3),qualified_calls:5+(i%3),position:null},
      {date:day,channel:'seo',campaign:'local service near me',impressions:1150+(i%6)*125,clicks:63+(i%5)*8,spend:0,calls:null,qualified_calls:null,position:9+(i%4)*.4});
  }return rows;
}
