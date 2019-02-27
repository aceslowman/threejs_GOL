import * as THREE from "three";
import Camera from "../entities/PerspectiveCamera";
import EventBus from "../utilities/EventBus";
import dat from "dat.gui";

/*
  The StandardTemplate is responsible for maintaining some core elements of
  Three.

  These include:

  gui
  eventbus
  clock
  scene
  camera
    default camera is used, unless separate camera is passed using setCamera()
  renderer
  entities
*/

export default class StandardManager {
  constructor({
    scene = {
      background: 'black'
    },
    renderer = {
      antialias: true,
      alpha: true
    }
  } = {}) {
    this.width  = window.innerHeight - 30;
    this.height = window.innerHeight - 30;

    this.entities = [];

    this.gui      = new dat.GUI();
    this.eventBus = new EventBus();
    this.clock    = new THREE.Clock();

    let canvas = document.getElementById('APPCANVAS');

    /*
      setup renderer
    */
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      preserveDrawingBuffer: true // TEMP
    });

    this.renderer.setSize(this.width, this.height);
    // this.renderer.autoClear = false; // for overlay
    document.getElementById('APP').appendChild(this.renderer.domElement);

    /*
      the main assumed scene for anything other than ui or debug
    */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(scene.background);

    /*
      the scene for debug information to be drawn on top of the main scene
    */
    this.overScene = new THREE.Scene();

    this.camera = new Camera(this);

    // for debug/over scene
    this.ortho = new THREE.OrthographicCamera(
      this.width / -2,
      this.width / 2,
      this.height / 2,
      this.height / -2,
      1,
      1000
    );

    this.ortho.position.z = 1.0;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  updateEntities() {
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].update();
    }
  }

  render() {
    /*
      render both the main scene, and the debug/ui over scene
    */
    // this.renderer.clear(); //FIXME
    this.renderer.render(this.scene, this.camera.getCamera());
    // this.renderer.clearDepth(); //FIXME
    // this.renderer.render(this.overScene, this.ortho);
  }

  update() {
    this.updateEntities();
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  onWindowResize() {
    this.width = window.innerHeight - 30;
    this.height = window.innerHeight - 30;

    this.camera.getCamera().aspect = this.width / this.height;
    this.camera.getCamera().updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);

    // for (let i = 0; i < this.entities.length; i++) {
    //   this.entities[i].onResize();
    // }
  }

  get canvas() {
    return this.renderer.domElement;
  }
}
