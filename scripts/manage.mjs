import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ROOT,build,validate} from './build.mjs';
import {publishingStatus,publishSource} from './publishing.mjs';
const PORT=Number(process.env.PORT||4173),HOST='127.0.0.1',origin=`http://${HOST}:${PORT}`,token=crypto.randomBytes(32).toString('hex');
const catalogPath=path.join(ROOT,'catalog.json'),dist=path.join(ROOT,'dist');
let publishing=false;
build();
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{
 const send=(status,body,type='application/json')=>{res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));};
 try{
 if(req.headers.host!==`127.0.0.1:${PORT}`&&req.headers.host!==`localhost:${PORT}`)return send(403,{error:'Local connections only.'});
 if(req.headers.origin&&![origin,`http://localhost:${PORT}`].includes(req.headers.origin))return send(403,{error:'Cross-origin requests are not allowed.'});
 const route=new URL(req.url,origin).pathname;
 if(req.method==='GET'&&route==='/manage')return send(200,fs.readFileSync(path.join(ROOT,'templates/manage.html'),'utf8').replace('__TOKEN__',token),'text/html; charset=utf-8');
 if(req.method==='GET'&&route==='/api/catalog')return send(200,fs.readFileSync(catalogPath));
 if(req.method==='GET'&&route==='/api/publishing')return send(200,{...publishingStatus(),publishing});
 if(req.method==='POST'&&route==='/api/publish'){
   if(req.headers['x-catalog-token']!==token)return send(403,{error:'Refresh the manager and try again.'});
   if(publishing)return send(409,{error:'A publish is already running. Please wait.'});
   publishing=true;
   try{build();return send(200,await publishSource());}finally{publishing=false;}
 }
 if(req.method==='GET'&&route==='/api/export'){
   build();const file=path.join(ROOT,'storefront.zip');fs.rmSync(file,{force:true});execFileSync('/usr/bin/zip',['-q','-r',file,'.'],{cwd:dist});res.setHeader('Content-Disposition','attachment; filename="storefront.zip"');return send(200,fs.readFileSync(file),'application/zip');
 }
 if(req.method==='POST'&&['/api/catalog','/api/upload'].includes(route)){
   if(req.headers['x-catalog-token']!==token)return send(403,{error:'Refresh the manager and try again.'});
   if(publishing)return send(409,{error:'Wait for publishing to finish before saving another change.'});
   if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON is required.'});
   let parts=[],size=0;for await(const part of req){size+=part.length;if(size>12_000_000)return send(413,{error:'File too large; use an image smaller than 8 MB.'});parts.push(part);}const input=JSON.parse(Buffer.concat(parts));
   if(route==='/api/upload'){
     const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(input.data||'');if(!match)throw Error('Upload a JPG, PNG, or WebP image.');
     const bytes=Buffer.from(match[2],'base64');if(bytes.length>8_000_000)throw Error('Use an image smaller than 8 MB.');
     const valid=match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216:match[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)throw Error('The image content does not match its file type.');
     const name=`upload-${crypto.randomUUID()}.${match[1]==='jpeg'?'jpg':match[1]}`;fs.writeFileSync(path.join(ROOT,'assets',name),bytes);return send(200,{image:'/assets/'+name});
   }
   validate(input);const prev=JSON.parse(fs.readFileSync(catalogPath));
   for(const p of prev.products)if(!input.products.some(x=>x.slug===p.slug))throw Error('Archive products instead of deleting their old URLs.');
   const backup=fs.readFileSync(catalogPath);try{build(input);fs.writeFileSync(catalogPath+'.tmp',JSON.stringify(input,null,2)+'\n');fs.renameSync(catalogPath+'.tmp',catalogPath);}catch(error){fs.writeFileSync(catalogPath,backup);build(prev);throw error;}
   return send(200,{ok:true});
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Method not allowed.'});
 if(route.startsWith('/api/'))return send(404,{error:'Unknown action.'});
 let file=path.resolve(dist,'.'+decodeURIComponent(route));if(!file.startsWith(dist+path.sep)&&file!==dist)return send(403,{error:'Forbidden'});
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)&&/^\/assets\/[a-zA-Z0-9_.-]+$/.test(route))file=path.join(ROOT,route);
 if(!fs.existsSync(file))return send(404,fs.readFileSync(path.join(dist,'404.html')),'text/html; charset=utf-8');
 return send(200,fs.readFileSync(file),types[path.extname(file)]||'application/octet-stream');
 }catch(error){send(400,{error:error.message});}
});
server.listen(PORT,HOST,()=>console.log(`Storefront: ${origin}\nCatalog manager: ${origin}/manage\nSave changes, then choose Publish updates after connecting GitHub. ZIP export is also available.`));
