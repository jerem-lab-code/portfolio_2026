let offset = 7;
let segmentLength = 4;
let constrainedPos;

let KNIFE, RECT;
let GRAVITY = 0.1;

let TOP_REACHED = false;
let PEELS = [];

let soundCut;

const Y_AXIS = 1;
const X_AXIS = 2;

let scl = 1;
const VIRTUAL_SIZE = 700; // Reference size for scaling (beurre will be 250px at scale 1)

function preload() {
  // Use absolute-looking path from snippet root
  soundCut = loadSound("fini_4.mp3");
}

let isAudioEnabled = false;
let hasInteracted = false;

function setup() {
  console.log("Beurre Snippet: Setup starting...");

  soundCut.setVolume(0);
  noCursor();
  pixelDensity(1);

  createCanvas(windowWidth, windowHeight);

  // Calculate global scale
  updateScale();

  KNIFE = new Knife();
  KNIFE.len = 300;
  // Initial position in visible area
  KNIFE.pos.set((width / scl) / 2, 50);

  // Center in virtual space
  RECT = new Rect((width / scl) / 2, (height / scl) / 2, 250, 250);

  // Setup Sound Toggle
  const btn = document.getElementById('sound-toggle');
  const mutedIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
  const unmutedIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

  if (btn) {
    if (window !== window.parent) {
      btn.style.display = 'none';
    }
    btn.innerHTML = mutedIcon;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  console.log("Beurre Snippet: Setup complete.");

  // Handle messages from parent for sound toggle
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'toggle-sound') {
      const parentMuted = event.data.muted;
      if (parentMuted !== !isAudioEnabled) {
        toggleAudio();
      }
    }
  });
}

function toggleAudio() {
  isAudioEnabled = !isAudioEnabled;
  const btn = document.getElementById('sound-toggle');
  const mutedIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
  const unmutedIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

  if (isAudioEnabled) {
    userStartAudio().then(() => {
      if (soundCut && !soundCut.isPlaying()) {
        soundCut.loop();
      }
    });
    btn.innerHTML = unmutedIcon;
  } else {
    if (soundCut) soundCut.stop();
    btn.innerHTML = mutedIcon;
  }
}

function updateScale() {
  let minDim = min(windowWidth, windowHeight);
  scl = minDim / VIRTUAL_SIZE;
  if (scl === 0) scl = 1;
}

function checkIfTopCutting() {
  let { left, right, top, bottom } = RECT.getBounds();
  if (KNIFE.velocity.y > 0 &&
    KNIFE.pos.y >= top &&
    KNIFE.pos.x - KNIFE.len <= right &&
    KNIFE.pos.x >= left &&
    !TOP_REACHED) {

    addPeel();
    TOP_REACHED = true;
  }

  if (KNIFE.pos.y <= top && TOP_REACHED) {
    TOP_REACHED = false;
  }
}

function draw() {
  background(255, 216, 184);

  push();
  scale(scl);

  // Use mouse or touch
  let inputX = mouseX;
  let inputY = mouseY;

  if (touches.length > 0) {
    inputX = touches[0].x;
    inputY = touches[0].y;
    hasInteracted = true;
  } else if (mouseX !== 0 || mouseY !== 0) {
    // p5 initial mouseX/Y is often 0,0
    hasInteracted = true;
  }

  let virtualX = inputX / scl;
  let virtualY = inputY / scl;

  RECT.show();

  if (hasInteracted) {
    KNIFE.move(virtualX, virtualY);
  } else {
    // Idle movement or just stationary
    KNIFE.move((width / scl) / 2 + sin(frameCount * 0.05) * 50, 100);
  }

  checkIfTopCutting();

  constrainedPos = RECT.constrainCollision(KNIFE.pos.x, KNIFE.pos.y);
  KNIFE.show();

  let isAnyPeelCutting = false;
  for (let peel of PEELS) {
    peel.show();
    if (peel.isCutting)
      isAnyPeelCutting = true;
  }

  pop();

  if (isAudioEnabled) {
    let cutSpeed = max(KNIFE.velocity.y, 0);
    let maxSpeed = 30;
    let targetVolume = isAnyPeelCutting ? constrain(map(cutSpeed, 0, maxSpeed, .3, 1), 0, 1) : 0;
    soundCut.setVolume(targetVolume);
    let rate = constrain(map(cutSpeed, 0, maxSpeed, .5, 1.5), 0.5, 1.5);
    soundCut.rate(rate);
  }
}

function addPeel() {
  let newPeel = new Peel(function () {
    let index = PEELS.indexOf(newPeel);
    PEELS.splice(index, 1);
  });
  PEELS.unshift(newPeel);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateScale();
  RECT.setPosition((width / scl) / 2, (height / scl) / 2);
}

function touchMoved() {
  return false;
}

// Allow normal interaction
function mousePressed() {
  hasInteracted = true;
  return true;
}

