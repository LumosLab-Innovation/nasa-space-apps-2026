import { it,expect } from 'vitest';
import { flightScale, hullClearanceLift, flightWarp, continueTerrainHeight, flightNearPlaneKm } from '../src/landing/descentGeometry';
import {brakeTravel,brakeStep,brakeBand,BRAKE_START} from '../src/landing/descent';
it('preserves hatch depth precision at burn entry and opens the near view safely on approach',()=>{
 expect(flightNearPlaneKm(8,14)).toBe(.85);
 expect(flightNearPlaneKm(.10,.30)).toBeCloseTo(.02);
 expect(flightNearPlaneKm(.10,.01)).toBeCloseTo(.002);
 expect(flightNearPlaneKm(-.01,.30)).toBe(.0005);
 expect(Math.abs(flightNearPlaneKm(.1001,.30)-flightNearPlaneKm(.10,.30))).toBeLessThan(.0001);
});
it('prepares the destination ahead of the physical low-approach track',()=>{
 let state={...BRAKE_START,h:1000},distance=0;
 while(state.h>500){const band=brakeBand(state.h);distance+=(band.lo+band.hi)/2*.001;state=brakeStep(state,0,.001);}
 expect(brakeTravel(1000,500)).toBeCloseTo(distance,0);
});
it('continues the boundary slope instead of mirroring a square ridge',()=>{
 const height=(x:number,z:number)=>.2*x-.1*z,far=()=>-10;
 for(const [x,z,dx,dz] of [[750,100,1,0],[-750,100,-1,0],[100,750,0,1],[100,-750,0,-1]]){
  const epsilon=.001,edge=height(x,z),outside=continueTerrainHeight(x+dx*epsilon,z+dz*epsilon,height,far);
  expect((outside-edge)/epsilon).toBeCloseTo(.2*dx-.1*dz,4);
 }
 expect(continueTerrainHeight(4000,200,height,far)).toBe(-10);
});
it('uses physical ship size before the 500–300 m approach',()=>{
 expect(flightScale(500)).toBe(.001);expect(flightScale(300)).toBe(.001);expect(flightScale(15000)).toBe(.1);
});
it('places the hull at the indicated altitude over its actual ground track',()=>{
 const lift=hullClearanceLift(500,120,50,4.5,0,.001);
 expect(120+lift-4.5).toBe(500);
 expect(hullClearanceLift(300,800,50,4.5,1,.001)).toBe(-475);
});
it('ramps acceleration and returns to realtime before 500 m',()=>{
 expect(flightWarp(0,15000)).toBe(1);expect(flightWarp(5,15000)).toBe(10);expect(flightWarp(30,1200)).toBe(1);
 expect(Math.abs(flightWarp(1.001,15000)-flightWarp(1,15000))).toBeLessThan(.02);
});
