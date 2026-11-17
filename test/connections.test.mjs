import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConnections} from '../connections.mjs';
import {createApp} from '../server.mjs';
const env={APP_PASSWORD:'private-test-password',APP_USERNAME:'admin'};
const auth='Basic '+Buffer.from('admin:'+env.APP_PASSWORD).toString('base64');
const apiKey='sk-test_not_a_real_key_12345';
test('connection cookies are encrypted, scoped, and invalidated by password changes',async()=>{
 const c=createConnections(env,async()=>new Response(JSON.stringify({id:'gpt-4.1-mini'})));
 const verified=await c.verify('openai',{apiKey});let cookie;
 c.save({setHeader:(_k,v)=>cookie=v},'openai','client-a',verified);
 assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);assert.ok(!cookie.includes(apiKey));
 const req={headers:{cookie:cookie.split(';')[0]}};
 assert.equal(c.decode(req,'openai','client-a').apiKey,apiKey);
 assert.equal(c.decode(req,'openai','client-b'),null);
 assert.equal(createConnections({...env,APP_PASSWORD:'changed'},fetch).decode(req,'openai','client-a'),null);
 assert.ok(!JSON.stringify(c.status(req,'client-a')).includes(apiKey));
 c.remove({setHeader:(_k,v)=>cookie=v},'openai','client-a');assert.match(cookie,/Max-Age=0/);
});
test('provider rejection never saves credentials; verified cookie enables chat',async()=>{
 const server=createApp(env,async(url)=>url.includes('/models/')?new Response(JSON.stringify({id:'gpt-4.1-mini'})):new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Connected reply'}]}]})));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const headers={Authorization:auth,'Content-Type':'application/json'};
 try{
  const bad=await fetch(base+'/api/connections',{method:'POST',headers,body:JSON.stringify({provider:'openai',clientId:'client-a',credentials:{apiKey:'bad'}})});assert.equal(bad.status,400);assert.equal(bad.headers.get('set-cookie'),null);
  const cross=await fetch(base+'/api/connections',{method:'POST',headers:{...headers,'Sec-Fetch-Site':'cross-site'},body:'{}'});assert.equal(cross.status,403);
  const good=await fetch(base+'/api/connections',{method:'POST',headers,body:JSON.stringify({provider:'openai',clientId:'client-a',credentials:{apiKey}})});assert.equal(good.status,200);const cookie=good.headers.get('set-cookie').split(';')[0];assert.ok(!(await good.text()).includes(apiKey));
  const status=await fetch(base+'/api/status?clientId=client-a',{headers:{...headers,Cookie:cookie}});assert.equal((await status.json()).ai,true);
  const other=await fetch(base+'/api/status?clientId=client-b',{headers:{...headers,Cookie:cookie}});assert.equal((await other.json()).ai,false);
  const chat=await fetch(base+'/api/chat',{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify({message:'Create copy',context:{client:{id:'client-a'}}})});assert.equal((await chat.json()).answer,'Connected reply');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('external provider denial is rejected without retaining credentials',async()=>{
 const c=createConnections(env,async()=>new Response('{}',{status:401}));
 await assert.rejects(c.verify('openai',{apiKey}),/rejected/);
 await assert.rejects(c.verify('meta',{account:'1234567890',token:'not-a-real-token'}),/rejected/);
 await assert.rejects(c.verify('google',{account:'1234567890',token:'not-a-real-token',developerToken:'fake'}),/rejected/);
 await assert.rejects(c.verify('seo',{property:'sc-domain:example.com',token:'fake'}),/rejected/);
 await assert.rejects(c.verify('keywords',{login:'test',password:'fake'}),/rejected/);
});
