const fs=require('fs'),{spawnSync}=require('child_process');const q=require('../docs/screens/descent-bridge-final-qa.json');
const ff='C:/Users/ADMIN/AppData/Local/ms-playwright/ffmpeg-1013/ffmpeg-win64.exe';
for(const f of q.flows){const target=`docs/screens/descent-${f.mode}-transition.webm`;const r=spawnSync(ff,['-y','-ss',String(Math.max(0,f.clipStart-1.0)),'-i',f.video,'-t','16','-an','-c:v','libvpx-vp9','-b:v','2200k',target],{encoding:'utf8'});console.log(f.mode,r.status,r.stderr.slice(-300));}

