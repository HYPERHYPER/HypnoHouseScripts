// SETUP
precision highp float;
precision mediump int;

// INPUTS
in vec2 texCoord;
uniform sampler2D uTex0;

// SCRIPT
uniform int INSTRUCTION;
uniform float TIME;
uniform float INSTRUCTION_TIME;

// OUTPUT
out lowp vec4 outColor;

// REDEFINITIONS
#define TEXTURE uTex0 
#define UV texCoord

// PRAMATERS
#define DENSITY 0.3
#define INTENSITY 8.0
#define LENGTH 10.0
#define SPECTRUM (10.0 * sin(TIME * 10.0))
#define PI 3.14159265358979


float random (in vec2 st) { 
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43757.881);
}

vec4 rgb2hsb( in vec4 c ) {
  
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);

    vec4 p = mix(vec4(c.bg, K.wz), 
                 vec4(c.gb, K.xy), 
                 step(c.b, c.g));

    vec4 q = mix(vec4(p.xyw, c.r), 
                 vec4(c.r, p.yzx), 
                 step(p.x, c.r));

    float d = q.x - min(q.w, q.y);

    float e = 1.0e-10;

    return vec4(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x, 1.0);
}

vec4 hsb2rgb( in vec4 c ) {
  
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0, 0.0, 1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);

    return vec4(c.z * mix(vec3(1.0), rgb, c.y), 1.0);
}


float arctan(in float y, in float x) {
  return x == 0.0 ? sign(y) * PI/2.0 : atan(y, x);
}

void main() {

    vec2 uv = UV;

    // if (TIME < 0.5 ) {
    //     if( mod(float(INSTRUCTION), 2.0) == 0.0 ) {
    //         if(uv.x > 0.5) uv.x = 1.0 - uv.x;
    //     }
    //     else {
    //         if(uv.x < 0.5) uv.x = 1.0 - uv.x;
    //     }
        
    // }


 


    float d = 1.0 / 180.0;

    vec4 op = texture(TEXTURE, uv);
    vec2 rc = uv - vec2(0.5, 0.5); 
    float r = sqrt( rc.x * rc.x + rc.y * rc.y);
    float a = arctan(rc.y, rc.x);
    float h = 5.0 * TIME;

    vec4 np;
    vec2 nc;
    vec4 ghost = vec4(0.0);

    float varLength = LENGTH;
    varLength =  LENGTH * (INSTRUCTION_TIME * 0.25 + 0.75);

    float dr = r;
    for ( float i = 10.0; i < 90.0; i++) {

        if(dr < 0.0 || i >= LENGTH + 10.0 ) break;
        
            dr -= d;

            nc = vec2( cos(a) * dr, sin(a) * dr );

            np = rgb2hsb(texture( TEXTURE, nc + vec2(0.5, 0.5) ));

            if( np.z > 1.0 - DENSITY ) {
            np.x = (sin(SPECTRUM * dr - 1.5) + 0.9) / 3.0;
            np.y = 0.95;
            np.z /= 1.0 + (np.z * 0.5); 
            
            ghost += hsb2rgb(np) / ((10.2 - INTENSITY) * i);
        }

    }

    vec4 final;
    // if(INSTRUCTION == 1){
    // if(TIME > 0.5 ) {
    //     float ramp = 0.05 * (1.0 - pow(fract((TIME) * 32.0), 0.25));
    //     vec4 opR = texture(TEXTURE, uv + vec2(ramp, 0.0));
    //     vec4 opB = texture(TEXTURE, uv - vec2(ramp, 0.0));
        
    //     final = vec4(opR.r, op.g, opB.b, 1.0) + ghost;
    // }
    // }

    final = op + ghost;

    outColor = final * vec4(0.95, 0.95, 1.1, 1.0);
}





