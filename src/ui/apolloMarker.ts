import { Matrix, Vector3, type Scene } from '@babylonjs/core';
import { Container, Control, Line, type AdvancedDynamicTexture } from '@babylonjs/gui';
import { hudText } from './hudWidgets';
import { tr } from '../i18n/i18n';
import { markerVisible } from '../landing/apolloHeritageShot';

export function createApolloMarker(ui:AdvancedDynamicTexture,scene:Scene,site:Vector3) {
  const root=new Container('apolloLocator');root.isHitTestVisible=false;root.zIndex=5;ui.addControl(root);
  const stroke=(name:string,color='#a4e4ed')=>{const l=new Line(name);l.color=color;l.lineWidth=1.3;l.isHitTestVisible=false;root.addControl(l);return l;};
  const corners=Array.from({length:8},(_,i)=>stroke('apolloCorner'+i,'#e7fcff'));
  const leader=stroke('apolloLeader'),underline=stroke('apolloUnderline');
  const title=hudText('APOLLO 11',17,'#ffffff'),sub=hudText('TRANQUILITY BASE',12,'#c7e6ee'),coords=hudText('0.674° N · 23.473° E',12,'#b7d4df');
  title.fontWeight='700';
  for(const text of [title,sub,coords]){text.width='225px';text.height='22px';text.horizontalAlignment=Control.HORIZONTAL_ALIGNMENT_LEFT;text.verticalAlignment=Control.VERTICAL_ALIGNMENT_TOP;text.textHorizontalAlignment=Control.HORIZONTAL_ALIGNMENT_LEFT;root.addControl(text);}
  const close=new Container('apolloReconstructionLabels');close.isHitTestVisible=false;close.zIndex=5;ui.addControl(close);
  const heading=hudText('TRANQUILITY BASE',18,'#ffffff');heading.fontWeight='700';
  const caption=hudText('',12,'#9bdded'),note=hudText('',12,'#bac9d0');
  for(const text of [heading,caption,note]){text.height='24px';text.horizontalAlignment=Control.HORIZONTAL_ALIGNMENT_LEFT;text.verticalAlignment=Control.VERTICAL_ALIGNMENT_TOP;text.textHorizontalAlignment=Control.HORIZONTAL_ALIGNMENT_LEFT;text.left='22px';close.addControl(text);}
  heading.top='23px';caption.top='49px';note.top='75px';note.textWrapping=true;note.height='38px';
  const segment=(l:Line,x1:number,y1:number,x2:number,y2:number)=>{l.x1=x1;l.y1=y1;l.x2=x2;l.y2=y2;};
  root.isVisible=close.isVisible=false;
  return {
    update(visible:boolean,local:boolean,alpha=1){
      const {width:w,height:h}=ui.getSize();
      close.isVisible=local;
      if(local){
        heading.fontSize=w<550?14:18;
        heading.width=caption.width=Math.max(180,w-155)+'px';note.width=Math.min(480,w-44)+'px';
        caption.text=tr('HISTORICAL RECONSTRUCTION');note.text=tr('Flag and footprints recreated for illustration.');
      }
      const cam=scene.activeCamera;
      if(!visible||local||!cam){root.isVisible=false;return;}
      scene.updateTransformMatrix();
      const p=Vector3.Project(site,Matrix.Identity(),scene.getTransformMatrix(),cam.viewport.toGlobal(w,h));
      const horizon=Vector3.Dot(site.normalizeToNew(),cam.position.subtract(site));
      const forward=Vector3.Dot(cam.getForwardRay().direction,site.subtract(cam.position));
      root.isVisible=forward>0&&markerVisible(p.x,p.y,p.z,w,h,horizon);root.alpha=alpha;
      if(!root.isVisible)return;
      const x=p.x,y=p.y,r=13,s=6;
      let i=0;for(const sx of [-1,1])for(const sy of [-1,1]){
        segment(corners[i++],x+sx*r,y+sy*r,x+sx*(r-s),y+sy*r);
        segment(corners[i++],x+sx*r,y+sy*r,x+sx*r,y+sy*(r-s));
      }
      const labelX=Math.max(20,Math.min(w-235,x+42)),labelY=Math.max(86,y-115);
      segment(leader,x,y,labelX,labelY+69);segment(underline,labelX,labelY+69,labelX+210,labelY+69);
      [title,sub,coords].forEach((text,j)=>{text.left=labelX+'px';text.top=(labelY+j*22)+'px';});
    },
  };
}
