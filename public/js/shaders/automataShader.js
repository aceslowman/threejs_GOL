const frag = `
  uniform sampler2D state;

  ivec3 get(int x, int y) {
    vec3 tex = texture2D(state, (gl_FragCoord.xy + vec2(x, y)) / resolution.xy).rgb;

    return ivec3(int(tex.r),int(tex.g),int(tex.b));
  }

  void main() {
    ivec3 sum = get(-1, -1) +
              get(-1,  0) +
              get(-1,  1) +
              get( 0, -1) +
              get( 0,  1) +
              get( 1, -1) +
              get( 1,  0) +
              get( 1,  1);

    float r = 0.0;
    float g = 0.0;
    float b = 0.0;

    // BASIC R SPECIES RULES
    if(sum.r == 3){
      r = 1.0;
    } else if (sum.r == 2){
      r = float(get(0,0).r);
    } else {
      r = 0.0;
    }

    // BASIC G SPECIES RULES
    if(sum.g == 3){
      g = 1.0;
    } else if (sum.g == 2){
      g = float(get(0,0).g);
    } else {
      g = 0.0;
    }

    gl_FragColor = vec4(r,g,b,1.0);
  }
`;

export { frag };
