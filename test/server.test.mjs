import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp,authorized} from '../server.mjs';
const env={APP_USERNAME:'admin',APP_PASSWORD:'test-password'};
const auth='Basic '+Buffer.from('admin:test-password').toString('base64');
test('authentication rejects missing password and wrong credentials',()=>{
 assert.equal(authorized(auth,{}),false);assert.equal(authorized(auth,env),true);assert.equal(authorized('Basic invalid',env),false);
});
test('HTTP: health, authentication, locked AI, assets, and traversal',async()=>{
 const server=createApp(env);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  assert.equal((await fetch(base+'/health')).status,200);
  assert.equal((await fetch(base+'/')).status,401);
  const page=await fetch(base+'/',{headers:{Authorization:auth}});assert.equal(page.status,200);assert.match(await page.text(),/AdPilot/);
  const status=await fetch(base+'/api/status',{headers:{Authorization:auth}});assert.equal((await status.json()).ai,false);
  const ai=await fetch(base+'/api/chat',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body:'{"message":"hello"}'});assert.equal(ai.status,503);
  assert.equal((await fetch(base+'/%2e%2e/server.mjs',{headers:{Authorization:auth}})).status,404);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('AI integration forwards provider text without exposing key',async()=>{
 const server=createApp({...env,OPENAI_API_KEY:'test-only-key'},async(url,options)=>{
  const body=JSON.parse(options.body);assert.equal(body.store,false);assert.match(body.input,/hello/);
  return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Draft reply'}]}]}),{status:200});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const reply=await fetch('http://127.0.0.1:'+server.address().port+'/api/chat',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify({message:'hello'})});assert.deepEqual(await reply.json(),{answer:'Draft reply'});}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
