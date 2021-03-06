import * as THREE from 'three';
import GPUComputationRenderer from '../utilities/GPUComputationRenderer';
import * as automataShader from '../shaders/automataShader';
import Brush from './Brush';
import $ from 'jquery';

const nextPof2 = (v)=>{
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  return v++;
}

export default class GOL {
  constructor(manager){
    this.manager = manager;

    // this.aspect = this.manager.width / this.manager.height;

    this.resolution = [1024,1024];

    this.aspect = this.resolution[0] / this.resolution[1];

    this.GPUWIDTH = this.resolution[0];
    this.GPUHEIGHT = this.resolution[1] / this.aspect;

    this.last = 0;

    this.manager.addEntity(this);

    this.setupInitialState();
    this.initComputeRenderer();
    this.setupDebug();

    this.raycaster = new THREE.Raycaster();

    this.brush = new Brush();

    this.manager.renderer.domElement.addEventListener('click', (e)=>this.onClick(e), false);
    this.manager.renderer.domElement.addEventListener('mousemove', (e)=>this.onDrag(e), false);
    window.addEventListener('resize',(e)=>this.onResize(e), false);

    this.playing = false;
  }

  setupDebug(){
    let geometry = new THREE.PlaneBufferGeometry(this.manager.width, this.manager.height, 1, 1);

    this.automata_debug_material = new THREE.MeshBasicMaterial({color: 'green'});

    this.displayUniforms = {
      'automataTexture': { value: null },
      'lookup_r': { value: new THREE.Color('white') },
      'lookup_g': { value: new THREE.Color('orange') },
      'lookup_b': { value: new THREE.Color('pink') },
    };

    this.automata_display_shader = new THREE.ShaderMaterial({
      vertexShader: automataShader.displayVert,
      fragmentShader: automataShader.displayFrag,
      uniforms: this.displayUniforms
    });

    this.mesh = new THREE.Mesh(geometry, this.automata_display_shader);
    this.manager.scene.add(this.mesh);

    // define toggleable gridHelper for placement.
    this.grid = new THREE.GridHelper(this.manager.width, this.GPUWIDTH,'#353535','#353535');
    this.grid.rotation.x = Math.PI / 2;
    this.grid.visible = false;
    this.manager.scene.add(this.grid);
  }

  setupInitialState(state){
    this.initialState = new Float32Array((this.GPUWIDTH * this.GPUHEIGHT)*4);

    let width = this.GPUWIDTH;
    let height = this.GPUHEIGHT;

    switch (state) {
      case 'clear':
        for (let k = 0, kl = this.initialState.length; k < kl; k += 4) {
          let x = 0;

          if(k % width > ~~(k/width) && k % height < ~~(k/height)){
            x = 1;
          }

          this.initialState[k + 0] = 0;
          this.initialState[k + 1] = 0;
          this.initialState[k + 2] = 0;
          this.initialState[k + 3] = 1;
        }

        break;
      default:
        let k = 0;
        for(let y = 0, k = 0; y < height; y++){
          for(let x = 0; x < width; x++){
            let v = 0;
            let padding = width / 10;

            let xcheck = x > (width/2) - padding && x < (width/2) + padding;
            let ycheck = y > (height/2) - padding && y < (height/2) + padding;

            if(xcheck && ycheck){
              v = 1;
            }

            this.initialState[k + 0] = v;
            this.initialState[k + 1] = v;
            this.initialState[k + 2] = v;
            this.initialState[k + 3] = 1;

            k += 4;
          }
        }
    }
  }

  initComputeRenderer(){
    this.gpuCompute = new GPUComputationRenderer(this.GPUWIDTH, this.GPUHEIGHT,
      this.manager.renderer);

    this.dtautomata = this.gpuCompute.createTexture();
    this.dtautomata.image.data = this.initialState;

    this.automataVariable = this.gpuCompute.addVariable('textureautomata',
      automataShader.frag, this.dtautomata);

    this.automataUniforms = this.automataVariable.material.uniforms;

    this.automataUniforms['time'] = { value: 0.0 };
    this.automataUniforms['delta'] = { value: 0.0 };
    this.automataUniforms['state'] = { value: null };

    this.automataVariable.wrapS = THREE.ClampToEdgeWrapping;
    this.automataVariable.wrapT = THREE.ClampToEdgeWrapping;

    let error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  update(){
    let now = performance.now();
    let delta = (now - this.last) / 1000;

    if(delta > 1) delta = 1;
    this.last = now;

    this.automata_texture = this.gpuCompute.getCurrentRenderTarget(
      this.automataVariable).texture;

    this.automata_alt_texture = this.gpuCompute.getAlternateRenderTarget(
      this.automataVariable).texture;

    // this.automata_debug_material.map = this.automata_texture;

    // this.displayUniforms['resolution'].value = [this.manager.width, this.manager.height];
    this.displayUniforms['automataTexture'].value = this.automata_texture;

    this.automataUniforms['time'].value = now;
    this.automataUniforms['delta'].value = delta;
    this.automataUniforms['state'].value = this.automata_texture;

    if(this.playing){
      this.gpuCompute.compute();
    }
  }

  //----------------------------------------------------------------------------

  poke(canvas,x,y){
    this.gl = this.manager.renderer.getContext();
    this.gl.globalCompositeOperation = 'destination-in';

    // first, draw to the alt texture
    let textureProperties = this.manager.renderer.properties.get(this.automata_alt_texture);
    if(!textureProperties.__webglTexture) console.error('failed to get texture properties');

    let activeTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
    this.gl.bindTexture(this.gl.TEXTURE_2D, textureProperties.__webglTexture);
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D,
      0,
      x - (canvas.width/2.0),
      y - (canvas.height/2.0),
      this.gl.RGBA,
      this.gl.FLOAT,
      canvas
    );

    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    this.gl.bindTexture(this.gl.TEXTURE_2D, activeTexture);

    // then, draw to primary. this is so that we can poke while paused.
    textureProperties = this.manager.renderer.properties.get(this.automata_texture);
    if(!textureProperties.__webglTexture) console.error('failed to get texture properties');

    activeTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
    this.gl.bindTexture(this.gl.TEXTURE_2D, textureProperties.__webglTexture);
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D,
      0,
      x - (canvas.width/2.0),
      y - (canvas.height/2.0),
      this.gl.RGBA,
      this.gl.FLOAT,
      canvas
    );

    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    this.gl.bindTexture(this.gl.TEXTURE_2D, activeTexture);
  }

  //----------------------------------------------------------------------------

  clear(){
    this.setupInitialState('clear');
    this.initComputeRenderer();
  }

  pause(){
    this.playing = false;
  }

  resume(){
    this.playing = true;
  }

  setResolution(w,h){
    this.aspect = this.manager.width / this.manager.height;

    this.resolution = [Number(w),Number(h)];

    this.GPUWIDTH = this.resolution[0];
    this.GPUHEIGHT = this.resolution[1] / this.aspect;

    this.setupInitialState();
    this.initComputeRenderer();

    let vis = this.grid.visible;

    this.manager.scene.remove(this.grid);
    this.grid = new THREE.GridHelper(this.GPUWIDTH, this.GPUHEIGHT,'#353535','#353535');
    this.grid.rotation.x = Math.PI / 2;
    this.grid.visible = vis;
    this.manager.scene.add(this.grid);
  }

  //----------------------------------------------------------------------------
  onClick(e){
    e.preventDefault();
    let camera = this.manager.camera.getCamera();
    let mouse = new THREE.Vector2();

    let off_x = $('#APPCANVAS').offset().left;
    let off_y = $('#APPCANVAS').offset().top;

    mouse.x = ( (e.clientX - off_x) / this.manager.width ) * 2 - 1;
    mouse.y = - ( (e.clientY - off_y) / this.manager.height ) * 2 + 1;

    // regenerate noise brush
    this.brush.setup();

    this.raycaster.setFromCamera(mouse, camera);

    let intersects = this.raycaster.intersectObject(this.mesh);

    if(Array.isArray(intersects) && intersects.length){
      let v = intersects[0].uv;
      v.multiply(new THREE.Vector2(this.GPUWIDTH, this.GPUHEIGHT));

      this.poke(this.brush.canvas,v.x,v.y);
    }
  }

  onDrag(e){
    if (e.which == 1) {
      e.preventDefault();
      let camera = this.manager.camera.getCamera();
      let mouse = new THREE.Vector2();

      let off_x = $('#APPCANVAS').offset().left;
      let off_y = $('#APPCANVAS').offset().top;

      mouse.x = ( (e.clientX - off_x) / this.manager.width ) * 2 - 1;
      mouse.y = - ( (e.clientY - off_y) / this.manager.height ) * 2 + 1;

      this.raycaster.setFromCamera(mouse, camera);

      let intersects = this.raycaster.intersectObject(this.mesh);

      if(Array.isArray(intersects) && intersects.length){
        let v = intersects[0].uv;
        v.multiply(new THREE.Vector2(this.GPUWIDTH, this.GPUHEIGHT));

        this.poke(this.brush.canvas,v.x,v.y);
      }
    }
  }

  onResize(e){
    // TODO: not sure how I want to go about this, but likely necessary

  }
}
