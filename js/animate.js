//======== TP Web, exercise 3 - Lylia Mesa (IGR 2025)========

let intervalID;
let playState = 0; //0 when stopped, 1 when playing

//MOVEMENT VARIABLES
let xSpeed = 5; //default
let xDirection = 1;
let baseY = 0;

//SHOOTING
let aiming = false;
let aimAngle = 0;
let aimInterval = null;
let aimLine = null;

//SCORE
let destroyed = 0;
let highscore = 0;
let highscoreEl; 

//ASTEROIDS
const asteroids = []; 
let asteroidSpawnTimeout = null; //timeout ID for asteroid spawn function, used to cancel spawn if game is paused (clear(id))

let spaceship, canvas, button, speedSlider, scoreEl;

//========functions========

//starts animation and loads elements automatically when page loads
window.addEventListener("DOMContentLoaded", () => {
  spaceship = document.getElementById("spaceship");
  canvas = document.getElementById("canvas");
  button = document.getElementById("playButton");
  speedSlider = document.getElementById("speed");
  scoreEl = document.getElementById("score");
  highscoreEl = document.getElementById("highscore");

  startAnim();
  spawnAsteroid();
});

//direction switch when d is pressed and start aiming when space pressed, shoot when released
document.addEventListener("keydown", (event) => {
  if (event.key === "d") {
    xDirection *= -1;
  }
  //start aiming on Space key down (only once at a time)
  if (event.key === " " && !aiming) {
    startAiming();
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === " ") {
    stopAimingAndShoot();
  }
});

function toggleAnim() {
  if (playState === 0) {
    startAnim();
  } else {
    stopAnim();
  }
}

function startAnim() {
  if (playState === 1) return;

  const start = Date.now(); 
  destroyed = 0;

  //initialize position at center
  if (!spaceship.style.left || !spaceship.style.top) { //position undefined
    const centerX = (canvas.offsetWidth - spaceship.offsetWidth) / 2;
    const centerY = (canvas.offsetHeight - spaceship.offsetHeight) / 2;
    spaceship.style.left = centerX + "px";
    spaceship.style.top = centerY + "px";
    baseY = centerY; //y coordinate to oscillate around
  } else {
    baseY = parseInt(spaceship.style.top);
  }

  clearInterval(intervalID);

  intervalID = setInterval(() => {
    
    let x = parseInt(spaceship.style.left);
    xSpeed = Number(speedSlider.value);

    const maxX = canvas.offsetWidth - spaceship.offsetWidth;
    x += xSpeed * xDirection;

    if (x >= maxX || x <= 0) {
      xDirection *= -1; //bounce back when reaching edges
    }

    const jitterComponent = (Math.random() - 0.5) * 8; //vertical jitter 

    const y = baseY + jitterComponent;

    spaceship.style.left = x + "px";
    spaceship.style.top = y + "px";

    moveAsteroids();

    //SCORING
    const end = Date.now();
    const timescore = end - start;

    const scoreValue = xSpeed * Math.trunc(timescore / 500) + 1000 * destroyed; //1pt per frame was way too high (hence the /500), and made it proportional to difficulty (speed)
    scoreEl.textContent = "Score : " + scoreValue;

    if (scoreValue > highscore) {
      highscore = scoreValue;
      highscoreEl.textContent = "Highscore : "+highscore;
    }

  }, 50);

  playState = 1;
  if (button) button.textContent = "Pause";

  if (!asteroidSpawnTimeout) {
    //schedule next spawn
    asteroidSpawnTimeout = setTimeout(spawnAsteroid, 500 + Math.random() * 2000); //random waiting time to spawn next asteroid
  }
}

function stopAnim() {
  const button = document.getElementById("playButton");
  clearInterval(intervalID);
  intervalID = null;
  playState = 0;
  if (button) button.textContent = "Play";

  if (asteroidSpawnTimeout) {
    clearTimeout(asteroidSpawnTimeout);  //stop planned asteroid spawns
    asteroidSpawnTimeout = null;
  }
  if (aimLine) {
    aimLine.remove();//clean up aim line if it exists
    aimLine = null;
  }
  if (aimInterval) {
    clearInterval(aimInterval);
    aimInterval = null;
  }
  aiming = false;
}

function reset() {
  const canvas = document.getElementById("canvas");
  stopAnim();
  const centerX = (canvas.offsetWidth - spaceship.offsetWidth) / 2;
  const centerY = (canvas.offsetHeight - spaceship.offsetHeight) / 2;
  spaceship.style.left = centerX + "px";
  spaceship.style.top = centerY + "px";
  xDirection = 1;
  baseY = centerY;
  scoreEl.textContent = "Score : 0"; 

  for (let a of asteroids) {
    a.el.remove();
  }
  asteroids.length = 0;

  //clean up aim line completely
  if (aimLine) {
    aimLine.remove();
    aimLine = null;
  }
  if (aimInterval) {
    clearInterval(aimInterval);
    aimInterval = null;
  }
  aiming = false;
  aimAngle = 0;
}

function spawnAsteroid() {
  //if game is paused, don't spawn 
  if (playState === 0) {
    asteroidSpawnTimeout = null;
    return;
  }

  const asteroid = document.createElement("img");
  asteroid.src = "media/asteroid.png";
  asteroid.className = "asteroid";
  asteroid.style.position = "absolute";
  asteroid.style.width = "60px";

  const side = Math.floor(Math.random() * 4); //picking a random side of the screen to spawn asteroid
  const canvasW = canvas.offsetWidth;
  const canvasH = canvas.offsetHeight;

  let x, y, dx, dy;

  switch (side) { //asteroids can spawn from any side of the screen
    case 0: //left
      x = -60; 
      y = Math.random() * canvasH; //(x,y) is the start point
      dx = 2 + Math.random() * 2; //horizontal speed (between 2 and 4)
      dy = (Math.random() - 0.5) * 2; //vertical speed (between -1and 1)
      break;
    case 1: //right
      x = canvasW + 60;
      y = Math.random() * canvasH;
      dx = -(2 + Math.random() * 2);
      dy = (Math.random() - 0.5) * 2;
      break;
    case 2: //top
      x = Math.random() * canvasW;
      y = -60;
      dx = (Math.random() - 0.5) * 2;
      dy = 2 + Math.random() * 2;
      break;
    default: //bottom
      x = Math.random() * canvasW;
      y = canvasH + 60;
      dx = (Math.random() - 0.5) * 2;
      dy = -(2 + Math.random() * 2);
      break;
  }

  asteroid.style.left = x + "px";
  asteroid.style.top = y + "px";

  canvas.appendChild(asteroid); 
  asteroids.push({ el: asteroid, x, y, dx, dy });

  //schedule next asteroid (if still playing)
  asteroidSpawnTimeout = setTimeout(() => {spawnAsteroid();}, 500 + Math.random() * 2000);
}

function moveAsteroids() {
  const hitboxPaddingX = 8; //pixels to remove from left/right because otherwise the collision does not happen visually 
  const hitboxPaddingY = 8;  //top/bottom

  const shipRect = {left: spaceship.offsetLeft + hitboxPaddingX, right: spaceship.offsetLeft + spaceship.offsetWidth - hitboxPaddingX,top: spaceship.offsetTop + hitboxPaddingY,bottom: spaceship.offsetTop + spaceship.offsetHeight - hitboxPaddingY};

  for (let i = asteroids.length - 1; i >= 0; i--) { //backwards loop to avoid skipping/crashing loop (esp. when splicing)
    const a = asteroids[i];
    a.x += a.dx; //"incrément" 
    a.y += a.dy;
    a.el.style.left = a.x + "px"; //.el = image of the asteroid
    a.el.style.top = a.y + "px";

    //collisions
    const asteroidRect = {left: a.x,right: a.x + a.el.offsetWidth,top: a.y,bottom: a.y + a.el.offsetHeight};
    if (asteroidRect.left < shipRect.right && asteroidRect.right > shipRect.left && asteroidRect.top < shipRect.bottom &&asteroidRect.bottom > shipRect.top) {
      a.el.remove();
      asteroids.splice(i, 1); //removing the i th asteroid = a (because it hit the vessel)
      alert("You crashed :( GAME OVER");
      reset();
    }

    // remove off-screen asteroids
    if (a.x < -100 || a.x > canvas.offsetWidth + 100 || a.y < -100 || a.y > canvas.offsetHeight + 100) { //i delete asteroids that are far out of the screen
      a.el.remove();
      asteroids.splice(i, 1); //removing a = ith asteroid bc it is out of the screen
    }
  }
}

//========aiming, shooting========
function startAiming() {
  aiming = true;

  if (aimLine) {
    aimLine.remove();
    aimLine = null;
  }

  //new red aim line
  aimLine = document.createElement("div");
  aimLine.id = "aimLine";
  aimLine.style.position = "absolute";
  aimLine.style.width = "2px";
  aimLine.style.height = "100px";
  aimLine.style.background = "red";
  aimLine.style.transformOrigin = "bottom center";
  canvas.appendChild(aimLine);//the line belongs to the canvas (tree idea of html)

  aimInterval = setInterval(() => {
    if (!aiming || !aimLine) return; //only updates if still aiming and line exists 
    
    const shipX = parseInt(spaceship.style.left) + spaceship.offsetWidth / 2;
    const shipY = parseInt(spaceship.style.top) + spaceship.offsetHeight / 2;

    aimAngle = (aimAngle + 5) % 360;

    //position line so its bottom (transform-origin) is at ship center
    aimLine.style.left = (shipX - 1) + "px";
    aimLine.style.top = (shipY - 100) + "px"; //subtracting line height so bottom is at shipY
    aimLine.style.transform = `rotate(${aimAngle}deg)`;
  }, 30);
}

function stopAimingAndShoot() {
  if (!aiming) return;
  aiming = false;
  
  const shootAngle = aimAngle; // Store the current angle before cleanup (to continue from the same point when aiming again)
  clearInterval(aimInterval);
  aimInterval = null;

  if (aimLine) { //removing line after shooting
    aimLine.remove();
    aimLine = null;
  }
  shootInDirection(shootAngle);
}

function shootInDirection(angleDeg) {
  const shipX = parseInt(spaceship.style.left) + spaceship.offsetWidth / 2;
  const shipY = parseInt(spaceship.style.top) + spaceship.offsetHeight / 2;

  //in CSS, 0° is up, so i need to convert to "standard" math angles (also to rad) so that 0° points right
  const adjustedAngle = angleDeg - 90; 
  const angleRad = (adjustedAngle * Math.PI) / 180;

  //Hit detection
  for (let i = asteroids.length - 1; i >= 0; i--) { 
    const a = asteroids[i];
    const dx = a.x + a.el.offsetWidth / 2 - shipX; //practically dx = asteroidCenterX - shipCenterX because offsetWidth measures the asteroid (el) size
    const dy = a.y + a.el.offsetHeight / 2 - shipY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const asteroidAngle = Math.atan2(dy, dx); //angle with asteroid
    const asteroidAngleDeg = (asteroidAngle * 180) / Math.PI;
    
    let angleDiff = Math.abs(asteroidAngleDeg - adjustedAngle);
    angleDiff = Math.min(angleDiff, 360 - angleDiff);

    if (angleDiff < 12 && dist < 1200) { //chose a 12° cone around the aim and a 1200 px distance ; checking if any asteroids fill that criteria
      a.el.remove();
      asteroids.splice(i, 1);
      destroyed += 1;
    }
  }
}
