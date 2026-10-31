import readline from 'node:readline/promises';
import {setupPublishing} from './publishing.mjs';
const terminal=readline.createInterface({input:process.stdin,output:process.stdout});
try{
 console.log('Connect an empty GitHub repository. Sign in to GitHub locally first; no passwords or Cloudflare tokens are stored by this script.');
 const repository=process.argv[2]||await terminal.question('GitHub repository URL: ');
 const result=await setupPublishing(repository);
 console.log(`Connected: ${result.repository}\nAdd your Cloudflare secrets to GitHub, then open the catalog manager and choose Publish updates.`);
}catch(error){console.error(error.message);process.exitCode=1;}finally{terminal.close();}
