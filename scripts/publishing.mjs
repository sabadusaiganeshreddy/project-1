import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ROOT} from './build.mjs';

// A separate checkout leaves the original project's Git history and staged edits alone.
export const SOURCE_PATHS=['.github','assets','scripts','templates','catalog.json','package.json','README.md','PUBLISHING.md','Start Store.command','.gitignore'];
export function githubRepository(input){
 const value=String(input||'').trim();
 const match=/^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(value);
 if(!match||['.','..'].includes(match[2]))throw Error('Use a GitHub repository URL such as https://github.com/yourname/the-daily-edit.');
 return {remote:`https://github.com/${match[1]}/${match[2]}.git`,url:`https://github.com/${match[1]}/${match[2]}`};
}
function locations(root){const folder=path.join(root,'.publishing');return {folder,checkout:path.join(folder,'checkout'),config:path.join(folder,'config.json')};}
export function publishingStatus(root=ROOT){
 try{const p=locations(root),config=JSON.parse(fs.readFileSync(p.config,'utf8')),repo=githubRepository(config.repository);return {configured:fs.existsSync(path.join(p.checkout,'.git')),repository:repo.url,actionsUrl:repo.url+'/actions',siteUrl:'https://the-daily-edit-finds.pages.dev'};}
 catch{return {configured:false,siteUrl:'https://the-daily-edit-finds.pages.dev'};}
}
export function runGit(args,{cwd,allowFailure=false}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn('git',args,{cwd,env:{...process.env,GIT_TERMINAL_PROMPT:'0'},stdio:['ignore','pipe','pipe']});let output='',settled=false;
  const timer=setTimeout(()=>{child.kill('SIGTERM');finish(Error('GitHub did not respond in time. Your saved products are safe; try publishing again.'));},45000);
  function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);}
  child.stdout.on('data',b=>{if(output.length<100000)output+=b.toString();});
  // Consume stderr without returning credential-helper output to the browser.
  child.stderr.on('data',()=>{});
  child.on('error',()=>finish(Error('Git is unavailable. Install Git and authenticate with GitHub before setting up publishing.')));
  child.on('close',code=>code===0||allowFailure?finish(null,{code,output:output.trim()}):finish(Error(args[0]==='push'?'GitHub did not accept the update. Check your GitHub sign-in and whether the repository changed elsewhere. Your saved products and local commit are safe.':'GitHub setup could not finish. Check the repository address, your access, and GitHub authentication.')));
 });
}
export async function setupPublishing(repository,{root=ROOT,git=runGit}={}){
 const repo=githubRepository(repository),p=locations(root);
 if(fs.existsSync(p.config)){
  const existing=JSON.parse(fs.readFileSync(p.config,'utf8'));
  if(existing.repository!==repo.url)throw Error('Publishing is already assigned to another repository. Keep its checkout and review the connection before changing it.');
  return publishingStatus(root);
 }
 fs.mkdirSync(p.checkout,{recursive:true});
 if(!fs.existsSync(path.join(p.checkout,'.git')))await git(['init','--initial-branch=main'],{cwd:p.checkout});
 await git(['remote','remove','origin'],{cwd:p.checkout,allowFailure:true});
 await git(['remote','add','origin',repo.remote],{cwd:p.checkout});
 const advertised=await git(['ls-remote','--heads','origin','refs/heads/main'],{cwd:p.checkout});
 if(advertised.output)throw Error('Use a new, empty GitHub repository for initial setup. Existing repository content has been left untouched.');
 await git(['config','user.name','Daily Edit Publisher'],{cwd:p.checkout});
 await git(['config','user.email','publisher@users.noreply.github.com'],{cwd:p.checkout});
 fs.writeFileSync(p.config,JSON.stringify({repository:repo.url},null,2)+'\n');return publishingStatus(root);
}
export function syncPublishingSource(root,checkout){
 if(!fs.existsSync(path.join(checkout,'.git')))throw Error('The publishing checkout is not initialized.');
 for(const name of SOURCE_PATHS){const source=path.join(root,name),target=path.join(checkout,name);if(fs.existsSync(source)){fs.rmSync(target,{recursive:true,force:true});fs.cpSync(source,target,{recursive:true});}}
}
export async function publishSource({root=ROOT,git=runGit}={}){
 const status=publishingStatus(root);if(!status.configured)throw Error('GitHub publishing is not connected yet. Complete the setup in PUBLISHING.md first.');
 const p=locations(root),repo=githubRepository(status.repository);
 const remote=await git(['remote','get-url','origin'],{cwd:p.checkout});
 if(remote.output!==repo.remote)throw Error('The publishing repository changed. Review the GitHub connection before publishing.');
 const branch=await git(['branch','--show-current'],{cwd:p.checkout});if(branch.output!=='main')throw Error('Publishing must use the main branch.');
 syncPublishingSource(root,p.checkout);
 const paths=SOURCE_PATHS.filter(name=>fs.existsSync(path.join(p.checkout,name)));
 await git(['add','--all','--',...paths],{cwd:p.checkout});
 const diff=await git(['diff','--cached','--quiet'],{cwd:p.checkout,allowFailure:true});if(![0,1].includes(diff.code))throw Error('Unable to inspect the publishing changes.');
 if(diff.code===1)await git(['commit','-m','Update storefront'],{cwd:p.checkout});
 await git(['push','origin','HEAD:refs/heads/main'],{cwd:p.checkout});
 const head=await git(['rev-parse','HEAD'],{cwd:p.checkout});
 return {queued:true,changed:diff.code===1,commit:head.output,actionsUrl:status.actionsUrl,siteUrl:status.siteUrl};
}
