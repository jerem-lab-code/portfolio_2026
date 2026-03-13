class Rect {
  constructor(x, y, width, height) {
    this.width = width;
    this.height = height;
    this.setPosition(x, y);
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.calcBounds();
  }

  getBounds() {
    return this.bounds;
  }

  calcBounds() {
    this.bounds = {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    };
  }

  constrainCollision(px, py) {
    let { left, right, top, bottom } = this.getBounds();

    let x = constrain(px, left, right);
    let y = constrain(py, top, bottom);
    return { x, y };
  }

  show() {
    
    push();
    
    translate(this.x, this.y);
    translate(offset / 2, 0);

    var ctx = drawingContext;
   
   // Create gradient
   var grd = ctx.createLinearGradient(-this.width/2, 0, this.width/2, 0);
   grd.addColorStop(0, "rgb(255,239,165)");
   grd.addColorStop(1, "rgb(255, 250, 207)");
   // Fill with gradient
   this.shadow();
   
    push();
    // translate(-10, 0);
    fill(250,234,162);
    stroke(250,234,162);
    /* ctx.fillStyle = grd;
    ctx.strokeStyle = grd; */
    beginShape();
    vertex(-125, -125);
    vertex(-125, 125);
    vertex(-325, -30);
    vertex(-325, -225);
    vertex(-125, -125);
    endShape(CLOSE);

    fill(255, 255, 215);
    stroke(255, 255, 230);
    beginShape();
    vertex(-125, -125);
    vertex(-325, -225);
    vertex(-90, -225);
    vertex(125, -125);
    vertex(-125, -125);
    endShape(CLOSE);

    pop();

    rectMode(CENTER);
    noStroke();
    ctx.fillStyle = grd;
    ctx.strokeStyle = grd;
    rect(0, 0, this.width, this.height);

    
    pop();
  }
  shadow() {
    //translate(this.x, this.y);
    translate(offset / 2, 0);
    push();

    /*  fill(255, 255, 255,50);
   stroke(255, 255, 255,50); */

   let ctx = drawingContext;
   
   // Create gradient
   let grd = ctx.createLinearGradient(50, 30,-100, 210);
   255,216,184
   grd.addColorStop(0, "rgba(194,95,2,0.6)");
   grd.addColorStop(1, "rgba(194,95,2,0.005)");
   
   // Fill with gradient
   ctx.fillStyle = grd;
noStroke();
    beginShape();
    // fill(255);
    vertex(-125, 125);
    vertex(-420, 60);
    vertex(-550, -80);
    vertex(-150, -100);
    vertex(-125, 125);
    endShape(CLOSE);

    pop();
  }


}
