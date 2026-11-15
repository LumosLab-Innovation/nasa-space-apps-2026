import {describe,it,expect} from 'vitest';
import {CreateGroundVertexData} from '@babylonjs/core/Meshes/Builders/groundBuilder';
import {heritageGroundAxis,heritageGroundHeight as height,HERITAGE_SUBDIVISIONS,sampleHeritageGround} from '../src/world/heritageGround';
describe('Eagle local terrain',()=>{
 it('keeps landing footpads supported while the walking area is uneven',()=>{
  for(const [x,z] of [[4.25,0],[-4.25,0],[0,4.25],[0,-4.25],[0,0]])expect(height(x,z)).toBeCloseTo(0,8);
  const heights=[];for(let z=-20;z<=20;z+=.5)for(let x=-20;x<=20;x+=.5)heights.push(height(x,z));
  expect(Math.max(...heights)-Math.min(...heights)).toBeGreaterThan(1);
  expect(Math.max(...heights.map(Math.abs))).toBeLessThan(1.25);
 });
 it('reserves dense triangles near the camera without a seam at the outer grid',()=>{
  expect(heritageGroundAxis(0)).toBe(0);expect(heritageGroundAxis(1)).toBeCloseTo(600);expect(heritageGroundAxis(-1)).toBeCloseTo(-600);
  expect(heritageGroundAxis(.8)).toBeCloseTo(32);
  expect(Math.abs(heritageGroundAxis(.800001)-heritageGroundAxis(.799999))).toBeLessThan(.001);
  expect(heritageGroundAxis(2/256)-heritageGroundAxis(0)).toBeLessThan(.32);
 });
 it('drapes footprints onto the actual triangles across crater slopes',()=>{
  const data=CreateGroundVertexData({width:1200,height:1200,subdivisions:HERITAGE_SUBDIVISIONS}),p=data.positions!,ids=data.indices!;
  for(let i=0;i<p.length;i+=3){p[i]=heritageGroundAxis(p[i]/600);p[i+2]=heritageGroundAxis(p[i+2]/600);p[i+1]=height(p[i],p[i+2]);}
  let checked=0;
  for(let i=0;i<ids.length;i+=93){
    const a=ids[i]*3,b=ids[i+1]*3,c=ids[i+2]*3;
    const x=(p[a]+p[b]+p[c])/3,z=(p[a+2]+p[b+2]+p[c+2])/3;
    if(Math.abs(x)>25||Math.abs(z)>25)continue;
    expect(sampleHeritageGround(p,x,z)).toBeCloseTo((p[a+1]+p[b+1]+p[c+1])/3,6);checked++;
  }
  expect(checked).toBeGreaterThan(100);
 });

});

