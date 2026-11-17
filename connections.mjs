import {createCipheriv,createDecipheriv,randomBytes,scryptSync} from 'node:crypto';
const providers=['openai','meta','google','seo','keywords'];
export function createConnections(env,fetcher){
 const key=scryptSync(env.APP_PASSWORD||'unconfigured','adpilot-connections-v1',32);
 function name(provider,clientId){if(!providers.includes(provider)||!/^[-a-zA-Z0-9]{1,64}$/.test(clientId||''))throw Error('Select a client before connecting.');return `adpilot_${provider}_${clientId}`;}
 function decode(req,provider,clientId){try{const n=name(provider,clientId);const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(n+'='));if(!cookie)return null;const bytes=Buffer.from(cookie.slice(n.length+1),'base64url');const decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));const data=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString());return data.expires>Date.now()?data:null;}catch{return null;}}
 function save(res,provider,clientId,data){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const encrypted=Buffer.concat([cipher.update(JSON.stringify({...data,expires:Date.now()+30*864e5})),cipher.final()]);const value=Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');if(value.length>3600)throw Error('Credentials are too long for this connection.');res.setHeader('Set-Cookie',`${name(provider,clientId)}=${value}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);}
 function remove(res,provider,clientId){res.setHeader('Set-Cookie',`${name(provider,clientId)}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);}
 const getJSON=async(url,headers)=>{const r=await fetcher(url,{headers,signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Provider rejected the connection (HTTP ${r.status}). Check the credentials, account permissions, and API access.`);return r.json();};
 async function verify(provider,data){
  if(provider==='openai'){
   if(!/^sk-[A-Za-z0-9_-]{15,}$/.test(data.apiKey||''))throw Error('Enter a valid OpenAI API key.');
   const model=data.model||env.OPENAI_MODEL||'gpt-4.1-mini';if(!/^[A-Za-z0-9._:-]{1,100}$/.test(model))throw Error('Enter a valid model ID.');
   const result=await getJSON('https://api.openai.com/v1/models/'+encodeURIComponent(model),{Authorization:`Bearer ${data.apiKey}`});
   return {apiKey:data.apiKey,model,label:result.id||model,verifiedAt:new Date().toISOString()};
  }
  if(provider==='meta'){
   const account=String(data.account||'').replace(/^act_/,'');if(!/^\d{5,30}$/.test(account))throw Error('Enter your numeric Meta ad account ID.');
   if(!data.token||data.token.length>2000)throw Error('Enter a Meta access token (up to 2,000 characters).');
   const r=await getJSON(`https://graph.facebook.com/v25.0/act_${account}?fields=id,name,account_status,currency`,{Authorization:`Bearer ${data.token}`});
   return {token:data.token,account,label:r.name||r.id,currency:r.currency,verifiedAt:new Date().toISOString()};
  }
  if(provider==='google'){
   const account=String(data.account||'').replaceAll('-','');if(!/^\d{10}$/.test(account))throw Error('Enter the 10-digit Google Ads customer ID.');
   const manager=String(data.manager||'').replaceAll('-','');if(manager&&!/^\d{10}$/.test(manager))throw Error('Manager ID must have 10 digits.');
   if(!data.token||!data.developerToken||data.token.length>2000||data.developerToken.length>200)throw Error('Enter your OAuth access token and Google Ads developer token.');
   const r=await fetcher(`https://googleads.googleapis.com/v24/customers/${account}/googleAds:search`,{method:'POST',headers:{Authorization:`Bearer ${data.token}`,'developer-token':data.developerToken,'Content-Type':'application/json',...(manager?{'login-customer-id':manager}:{})},body:JSON.stringify({query:'SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1'}),signal:AbortSignal.timeout(20000)});
   if(!r.ok)throw Error(`Google Ads rejected access (HTTP ${r.status}). Check OAuth scope, developer token, customer ID, and manager access.`);
   const body=await r.json();const customer=body.results?.[0]?.customer;if(!customer)throw Error('Google returned no matching customer.');
   return {token:data.token,developerToken:data.developerToken,account,manager,label:customer.descriptiveName||account,currency:customer.currencyCode,verifiedAt:new Date().toISOString()};
  }
  if(provider==='seo'){
   if(!data.token||data.token.length>2000||!data.property||data.property.length>300)throw Error('Enter a Google access token and Search Console property.');
   const r=await getJSON('https://www.googleapis.com/webmasters/v3/sites',{Authorization:`Bearer ${data.token}`});
   if(!r.siteEntry?.some(s=>s.siteUrl===data.property&&s.permissionLevel!=='siteUnverifiedUser'))throw Error('This token cannot access that exact verified property. Use its full URL or sc-domain:example.com.');
   return {token:data.token,property:data.property,label:data.property,verifiedAt:new Date().toISOString()};
  }
  if(provider==='keywords'){
   if(!data.login||!data.password||data.login.length>150||data.password.length>150)throw Error('Enter your DataForSEO API login and API password.');
   const r=await getJSON('https://api.dataforseo.com/v3/appendix/user_data',{Authorization:'Basic '+Buffer.from(data.login+':'+data.password).toString('base64')});
   if(r.status_code!==20000||r.tasks?.[0]?.status_code!==20000)throw Error('DataForSEO rejected these credentials. Use your API password, not your account password.');
   return {login:data.login,password:data.password,label:'DataForSEO',verifiedAt:new Date().toISOString()};
  }
  throw Error('Unknown provider.');
 }
 function status(req,clientId){return Object.fromEntries(providers.map(p=>{const c=decode(req,p,clientId);return[p,c?{connected:true,label:c.label,verifiedAt:c.verifiedAt}: {connected:false}];}));}
 return {decode,save,remove,verify,status};
}
