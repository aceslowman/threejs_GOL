/*
  Alan Zucconi describes a technique that doesn't require if statements, by
  storing an array of all rules, and accessing the rules using the sum of the
  component. This does not work with OpenGL ES, as you cannot access an array
  element using a non-constant index value.

  https://www.alanzucconi.com/2016/03/16/cellular-automata-with-shaders/
*/

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
    if(sum.r == 3 && sum.g < 3 && sum.b < 3){ // survival
      r = 1.0;
    } else if (sum.r == 2 && sum.g < 3 && sum.b < 3){ // survival
      r = float(get(0,0).r);
    } else { // death
      r = 0.0;
    }

    // BASIC G SPECIES RULES
    if(sum.g == 3 && sum.r < 3 && sum.b < 3){
      g = 1.0;
    } else if (sum.g == 2 && sum.r < 3 && sum.b < 3){
      g = float(get(0,0).g);
    } else {
      g = 0.0;
    }

    // BASIC B SPECIES RULES
    if(sum.b == 3 && sum.r < 3 && sum.g < 3){
      b = 1.0;
    } else if (sum.b == 2 && sum.r < 3 && sum.g < 3){
      b = float(get(0,0).b);
    } else {
      b = 0.0;
    }

    /*
      ideas

      use 0-1 in each channel to represent lifespan,
      with the color fading out to black over time?

      or even fade to white, with white being unmoveable
    */

    gl_FragColor = vec4(r,g,b,1.0);
  }
`;

export { frag };
