class Peel {
  constructor(selfDestruct) {
    this.orig = createVector(constrainedPos.x, constrainedPos.y);
    this.end = createVector(constrainedPos.x, constrainedPos.y);

    this.selfDestruct = selfDestruct;

    this.state = "cutting"; //"freezed", "falling"

    this.color1 = color(255 ,  239 , 150);
    this.color2 = color(255, 250, 207);//255, 250, 207

    this.velY = 0;
    this.accY = 0;
    this.posY = 0;
    this.isCutting = false;
    this.overlapLength = this.calcOverlap();
  }

  calcOverlap() {
    let kp = KNIFE.pos;
    let { right, left } = RECT.getBounds();
    let startX = min(kp.x, right);
    let endX = max(kp.x - KNIFE.len, left);
    return abs(endX - startX);
  }

  show() {
    let { orig, end } = this;

    if (this.state === "cutting") {
      this.cut();
      this.checkIfDone();
      
    } else if (this.state === "falling") {
        this.accY += GRAVITY;
        this.velY += this.accY;
        this.posY += this.velY;

        if(this.posY > window.innerHeight) {
            this.selfDestruct();
        }
    }

    push();

    strokeWeight(offset);

    translate(0, this.posY);
    translate(orig.x + offset, orig.y);

    let repeats = this.overlapLength / offset;

    for (let i = 0; i <= repeats; i++) {
      translate(-offset, 0);

      let col = lerpColor(this.color2, this.color1, i / repeats);

      this.drawSpiral(end.y - orig.y, col);
    }

    pop();
  }

  checkIfDone() {
    let { bottom } = RECT.getBounds();

    if (this.end.y >= bottom) {
      this.state = "falling";
      this.velY = KNIFE.velocity.y;
    }
  }

  freeze() {
    if (this.state === "cutting") {
      this.state = "freezed";
      console.log("hey");
    }
  }

  cut() {
    let { orig, end } = this; //== object destructuring let orig = this.orig;let end = this.end;
    
    
   /// orig.y = min(constrainedPos.y, orig.y);
    let oldY = end.y;
    end.y = max(constrainedPos.y, end.y);
    this.isCutting = oldY != end.y;
  }

  drawSpiral(totalLength, col) {
    push();

    let remainingSegmentLength = totalLength - (totalLength % segmentLength);
    translate(0, remainingSegmentLength);
    let currIndex = 0;

    stroke(col);

    for (let i = 0; i < totalLength - segmentLength; i += segmentLength) {
      translate(0, -segmentLength);
      line(0, 0, 0, segmentLength);
      rotate(totalLength / 4000 + 0.0020 * currIndex);

      currIndex++;
    }

    pop();
  }
}
