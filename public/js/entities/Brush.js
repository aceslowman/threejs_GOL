import $ from 'jquery';

export default class Brush {
  constructor(){
    this.width = 50;
    this.height = 50;

    this.type = 'square';

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'BRUSH';
    document.getElementById('canvasThumb').appendChild(this.canvas);

    this.setup();
  }

  setup(){
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = 'rgba(0,0,0,256)';
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    // TODO: allow for transparency... somehow
    switch (this.type) {
      case 'square': //solid square
        this.ctx.fillStyle = 'rgba(256,0,0,256)';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        break;
      case 'circle': //solid circle
        this.ctx.fillStyle = 'rgba(256,0,0,256)';
        this.ctx.beginPath();
        this.ctx.arc(this.width/2,this.height/2,this.width/2,0, 2 * Math.PI)
        this.ctx.fill();
        break;
      case 'noise': //noise
        for(let x = 0; x < this.width; x++){
          for(let y = 0; y < this.height; y++){
            let rgb = [
              `rgba(255,0,0,255)`,
              `rgba(0,255,0,255)`,
              `rgba(0,0,255,255)`,
              `rgba(0,0,0,255)`
            ];

            this.ctx.fillStyle = rgb[Math.floor(Math.random()*4)];

            this.ctx.fillRect(x,y,this.canvas.width,this.canvas.height);
          }
        }
        break;
      case 'eraser': //eraser
        this.ctx.fillStyle = 'rgba(0,0,0,256)';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        break;
      default:
        this.ctx.fillStyle = 'rgba(256,0,0,256)';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    }
  }
}
