import $ from 'jquery';

export default class Brush {
  constructor(){
    this.width = 50;
    this.height = 50;

    this.type = 2;

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
      case '0': //solid square
      this.ctx.fillStyle = 'rgba(256,0,0,256)';
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      break;
      case '1': //solid circle
      this.ctx.fillStyle = 'rgba(256,0,0,256)';
      this.ctx.beginPath();
      this.ctx.arc(this.width/2,this.height/2,this.width/2,0, 2 * Math.PI)
      this.ctx.fill();
      break;
      case '2': //noise
      for(let x = 0; x < this.width; x++){
        for(let y = 0; y < this.height; y++){
          let r = Math.round(Math.random());
          let color = 0;
          if(r) color = 256;
          this.ctx.fillStyle = `rgba(${color},0,0,256)`;
          this.ctx.fillRect(x,y,this.canvas.width,this.canvas.height);
        }
      }
      break;
      case '3': //eraser
      this.ctx.fillStyle = 'rgba(0,0,0,256)';
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      break;
      default:
      this.ctx.fillStyle = 'rgba(256,0,0,256)';
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    }
  }
}
