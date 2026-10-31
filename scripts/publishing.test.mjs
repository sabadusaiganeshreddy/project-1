import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {githubRepository,setupPublishing,publishSource,publishingStatus} from './publishing.mjs';

function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'daily-edit-publishing-'));fs.writeFileSync(path.join(root,'catalog.json'),'{"test":true}');fs.mkdirSync(path.join(root,'assets'));fs.writeFileSync(path.join(root,'assets','image.jpg'),'sample-image');fs.writeFileSync(path.join(root,'.env'),'SECRET=never-publish');fs.mkdirSync(path.join(root,'.openai'));fs.writeFileSync(path.join(root,'.openai','hosting.json'),'private');fs.mkdirSync(path.join(root,'dist'));fs.writeFileSync(path.join(root,'dist','index.html'),'generated');return root;}
function gitMock({root,rejectPush=false,remoteMain=false}={}){const calls=[];const git=async(args,{cwd})=>{calls.push(args);if(args[0]==='init')fs.mkdirSync(path.join(cwd,'.git'),{recursive:true});let output='';if(args[0]==='ls-remote'&&remoteMain)output='existing-main';if(args[0]==='remote'&&args[1]==='get-url')output='https://github.com/example/store.git';if(args[0]==='branch')output='main';if(args[0]==='rev-parse')output='abc123';if(args[0]==='push'&&rejectPush)throw Error('Simulated rejected push');return {code:args[0]==='diff'?1:0,output};};return {git,calls};}

test('repository inputs reject embedded credentials and non-GitHub destinations',()=>{
 assert.equal(githubRepository('https://github.com/example/store.git').url,'https://github.com/example/store');
 for(const value of ['https://token@github.com/example/store','https://other.example/example/store','https://github.com/example/..','javascript:alert(1)','https://github.com/example/store?token=secret'])assert.throws(()=>githubRepository(value));
});
test('publisher uses a separate checkout and sends only the application source',async()=>{
 const root=fixture();try{const {git,calls}=gitMock({root});await setupPublishing('https://github.com/example/store',{root,git});assert.equal(publishingStatus(root).configured,true);const result=await publishSource({root,git});assert.equal(result.commit,'abc123');const mirror=path.join(root,'.publishing','checkout');assert.ok(fs.existsSync(path.join(mirror,'catalog.json')));assert.ok(fs.existsSync(path.join(mirror,'assets','image.jpg')));for(const excluded of ['.env','.openai','dist','.publishing'])assert.ok(!fs.existsSync(path.join(mirror,excluded)),excluded);assert.ok(calls.some(args=>JSON.stringify(args)===JSON.stringify(['push','origin','HEAD:refs/heads/main'])));assert.ok(!fs.existsSync(path.join(root,'.git')));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('existing repository content is rejected during first setup without copying files',async()=>{
 const root=fixture();try{const {git}=gitMock({root,remoteMain:true});await assert.rejects(()=>setupPublishing('https://github.com/example/store',{root,git}),/empty GitHub repository/);assert.equal(publishingStatus(root).configured,false);assert.ok(!fs.existsSync(path.join(root,'.publishing','checkout','catalog.json')));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('failed publishing preserves the saved catalog and never force-pushes',async()=>{
 const root=fixture();try{const {git}=gitMock({root});await setupPublishing('https://github.com/example/store',{root,git});const bad=gitMock({root,rejectPush:true});const before=fs.readFileSync(path.join(root,'catalog.json'),'utf8');await assert.rejects(()=>publishSource({root,git:bad.git}),/Simulated rejected push/);assert.equal(fs.readFileSync(path.join(root,'catalog.json'),'utf8'),before);assert.ok(bad.calls.every(args=>!args.includes('--force')&&!args.includes('--force-with-lease')));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
