import * as THREE from "three";
import $ from 'jquery';

import StandardManager from "./system/StandardManager";
import OrthographicCamera from './entities/OrthographicCamera';
import Capture from "./utilities/Capture";
import Debug from "./utilities/Debug";
import Box from "./entities/Box";
import Capsule from "./entities/Capsule";
import PointLight from "./entities/PointLight";
import GOL from "./entities/GOL";

let manager, debug, capturer, box, camera, capsule, light;

let gol;

let framerate = 30;

let recording = false;

let timeout;

const setup = () => {
  manager = new StandardManager();

  manager.setCamera(new OrthographicCamera(manager));
  manager.gui.__proto__.constructor.toggleHide();

  gol = new GOL(manager);

  if(process.env.DEVELOPMENT){
    debug = new Debug(manager, {
      stats: true,
      grid: false
    });
  }

  capturer = new Capture(manager, {
    framerate: framerate,
    verbose: true,
    display: true,
    format: 'png',
    workersPath: 'js/utils/'
  });

  // LISTENERS ------------------------------------------

  $('#clearbutton').click(()=>{
    gol.clear();
  });

  $('#togglepause').click(()=>{
    if(gol.playing){
      gol.pause();
      $('#togglepause').html('play');
    }else{
      gol.resume();
      $('#togglepause').html('pause');
    }
  });

  $('#sizerange').on('input', (e)=>{
    let v = $('#sizerange').val();
    gol.brush.width = v;
    gol.brush.height = v;

    gol.brush.setup();
  });

  $('#speedrange').on('input', ()=>{
    let v = $('#speedrange').val();
    capturer.capturer.framerate = v; // TODO: this might help with some bugs in safari and firefox.
    framerate = v;
  });

  $('#typeselect').on('change', ()=>{
    gol.brush.type = $('#typeselect').val();
    gol.brush.setup();
  });

  $('#resolutionselect').on('change', ()=>{
    let v = $('#resolutionselect').val();
    gol.setResolution(v);
  });

  $('#outputselect').on('change', ()=>{
    let v = $('#outputselect').val();

    if(v == 'reset'){
      manager.onWindowResize();
    }else{
      manager.width = v;
      manager.height = v;
      manager.camera.getCamera().aspect = manager.width / manager.height;
      manager.camera.getCamera().updateProjectionMatrix();
      manager.renderer.setSize(v,v);
    }
  });

  $('#togglegrid').click(()=>{
    if(gol.grid.visible){
      gol.grid.visible = false;
      $('#togglegrid').html('show grid');
    }else{
      gol.grid.visible = true;
      $('#togglegrid').html('hide grid');
    }
  });

  $('#togglerecord').click(()=>{
    if(recording){
      recording = false;
      capturer.capturer.stop();
      $('#togglerecord').html('record');
    }else{
      capturer.capturer.framerate = framerate;
      recording = true;
      capturer.capturer.start();
      $('#togglerecord').html('STOP');
    }
  });

  $('#savebutton').click(()=>{
    capturer.capturer.save();
  });
}


let now, delta, then = Date.now();

const render = () => {
  requestAnimationFrame(render);

  now = Date.now();
  delta = now - then;

  if(delta > (1000/framerate)){
    if(process.env.DEVELOPMENT) debug.stats.begin();
    manager.update();
    manager.render();
    then = now - (delta % (1000/framerate));
    if(process.env.DEVELOPMENT) debug.stats.end();
  }

  capturer.capture( manager.canvas );
}

const bindEventListeners = () => {
  window.addEventListener(
    'resize',
    manager.onWindowResize.bind(manager),
    false
  );
}

setup();
bindEventListeners();
render();
