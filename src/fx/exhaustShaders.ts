export const exhaustVertex=`precision highp float;
attribute vec3 position;attribute vec2 uv;uniform mat4 worldViewProjection;uniform mat4 world;
varying vec2 vUV;varying vec3 vWorld;
void main(){vUV=uv;vWorld=(world*vec4(position,1.)).xyz;gl_Position=worldViewProjection*vec4(position,1.);}`;
export const exhaustFragment=`precision highp float;
varying vec2 vUV;varying vec3 vWorld;
uniform float clock;uniform float seed;uniform float power;uniform float brightness;uniform float coreBoost;uniform float coreWidthBoost;uniform vec4 groundPlane;uniform float groundClip;
uniform sampler2D wispTex;uniform sampler2D glowTex;uniform sampler2D grainTex;
void main(){
 float clearance=dot(groundPlane,vec4(vWorld,1.));
 if(groundClip>.5&&clearance<0.)discard;
 float p=vUV.y,x=vUV.x*2.-1.;
 float wave=sin(p*19.-clock*16.+seed)*.055+sin(p*37.-clock*24.+seed*2.)*.025;
 float spread=.22+.65*p;
 float radial=(x+wave*p)/spread;
 // Widen only the near-nozzle core; retain the original envelope and tail.
 float coreRadius=1.+coreWidthBoost*exp(-p*6.);
 float core=exp(-radial*radial*5./(coreRadius*coreRadius));
 float flow=texture2D(wispTex,vec2(.5+x*.43,fract(p*.75-clock*1.8+seed))).a;
 float streak=texture2D(grainTex,vec2(vUV.x,fract(p-clock*2.6+seed))).a;
 float body=core*(.59+.35*flow+.06*streak)*pow(1.-p,1.65);
 body*=1.+coreBoost*exp(-p*4.);
 float halo=texture2D(glowTex,vec2(vUV.x,p*.7+.22)).a*.10;
 float alpha=(body+halo)*power*(1.-smoothstep(.86,1.,p))*(1.-smoothstep(.8,1.,abs(x)));
 if(groundClip>.5)alpha*=smoothstep(0.,.12,clearance);
 vec3 color=mix(vec3(.38,.53,.85),vec3(.86,.95,1.),exp(-p*8.));
 color=mix(color,vec3(.95,.98,1.),coreBoost*core*exp(-p*4.));
 gl_FragColor=vec4(color,alpha*.72*brightness);
}`;

/** Radially advected turbulent gas: no stationary spokes or hard circular outline. */
export const surfaceExhaustFragment=`precision highp float;
varying vec2 vUV;
uniform float clock;uniform float power;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 float r=vUV.y,a=vUV.x*6.28318530718;
 vec2 direction=vec2(cos(a),sin(a));
 float rim=.69+.16*noise(direction*3.1+clock*.11)+.09*noise(direction*7.3-clock*.08);
 float dissolve=1.-smoothstep(.25,rim,r);
 // Time translates the radial coordinate only. Multiplying direction by time
 // would steadily increase angular frequency and turn the sheet into hairline spokes.
 float broad=noise(direction*3.3+vec2(r*6.-clock*1.5,4.));
 float fine=noise(direction*7.+vec2(r*14.-clock*3.1,9.));
 float strands=noise(direction*4.5+vec2(r*5.-clock*1.3,13.));
 float density=pow(max(0.,broad*.75+fine*.25),1.65)*(.6+.4*strands);
 float source=exp(-r*8.)*.26;
 float alpha=(density*.85+source)*dissolve*smoothstep(.025,.11,r)*power;
 vec3 color=mix(vec3(.76,.83,.89),vec3(.48,.57,.64),smoothstep(.1,.7,r));
 gl_FragColor=vec4(color,alpha);
}`;
