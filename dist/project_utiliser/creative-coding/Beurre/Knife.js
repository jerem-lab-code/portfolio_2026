class Knife {
  constructor() {
    this.len = 300;
    this.pos = createVector(width/2, 0);
    this.oldPos = this.pos.copy()
    this.velocity = createVector(0,0);
  }

  move(posX, posY) {

    // x =  ? null : x;

    this.oldPos.set(this.pos);

    this.pos.set(posX,posY)
    this.velocity = p5.Vector.sub(this.pos,this.oldPos);

  }

  show() {
    let h = 50;
    let len = this.len;

    push();
    
    translate(this.pos.x, this.pos.y);
    scale(-1, -1);
    fill("white");
    noStroke();
    rect(0, 0, len, h);
    translate(len, h);
    rotate(-HALF_PI);
    arc(0, 0, h * 2, h * 2, 0, HALF_PI, PIE);
    rotate(HALF_PI);
    fill("black");
    rect(len - 3 * len, -h, len+17, h,20);
    translate(len, h);
    fill("white");
    ellipse(len - 3 * len - 103, -h - 25, 20, 20);
    ellipse(len - 3 * len - 183, -h - 25, 20, 20);
    ellipse(len - 3 * len - 25, -h - 25, 20, 20);
    ellipse(len - 3 * len - 261, -h - 25, 20, 20);
    

    pop();
  }
}
