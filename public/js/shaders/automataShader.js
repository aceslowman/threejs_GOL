const frag = `
  uniform sampler2D state;

  int get(int x, int y) {
    return int(texture2D(state, (gl_FragCoord.xy + vec2(x, y)) / resolution.xy).r);
  }

  void main() {
    int sum = get(-1, -1) +
              get(-1,  0) +
              get(-1,  1) +
              get( 0, -1) +
              get( 0,  1) +
              get( 1, -1) +
              get( 1,  0) +
              get( 1,  1);
    if (sum == 3) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else if (sum == 2) {
        float current = float(get(0, 0));
        gl_FragColor = vec4(current, current, current, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
`;

const multi_channel_frag = `
  uniform sampler2D state;

  vec4 get(int x, int y) {
    return texture2D(state, (gl_FragCoord.xy + vec2(x, y)) / resolution.xy);
  }

  void main() {
    vec4 color = vec4(0.0);

    vec4 sum = get(-1, -1) +
              get(-1,  0) +
              get(-1,  1) +
              get( 0, -1) +
              get( 0,  1) +
              get( 1, -1) +
              get( 1,  0) +
              get( 1,  1);

    if (int(sum.r) == 3) {
        color.r = 1.0;
    } else if (int(sum.r) == 2) {
        float current = get(0, 0).r;
        color.r = current;
    } else {
        color.r = 0.0;
    }

    if (int(sum.g) == 3) {
        color.g = 1.0;
    } else if (int(sum.g) == 2) {
        float current = get(0, 0).g;
        color.g = current;
    } else {
        color.g = 0.0;
    }

    if (int(sum.b) == 3) {
        color.b = 1.0;
    } else if (int(sum.b) == 2) {
        float current = get(0, 0).b;
        color.b = current;
    } else {
        color.b = 0.0;
    }


    gl_FragColor = vec4(color.rgb,1.0);
  }
`;

export { frag, multi_channel_frag };
