
// by Qian Li, ludwig.peking@gmail.com, 10/7/2022, all rights reserved
let currentAge = "";
let fadeCounter = 0;
let tiles;
let resourceTrend, populationTrend, population;
let isPaused = false;
let restartButton, pauseButton, resumeButton, speedSlider;
const cols = 40;
const rows = 20;
const totalTerritory = cols * rows;
const resolution = 40;
const noiseScale = 0.2;
const frameRateSetting = 10;
let bands = [];
let nr = 0;
let topLayer, figureLayer;
const spawningRate = 0.001;

function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}
function preload() {
  tomb = loadImage("tomb2.png");
  camp = loadImage("camp.png");
}

function setup() {
    //clear the tiles and bands
    bands = [];
    nr = 0;
    tiles = [];
    tiles = make2DArray(cols, rows);

    restartButton = createButton('Restart');
    restartButton.position(10, 10);
    restartButton.mousePressed(restartSimulation);

    pauseResumeButton = createButton('Pause');
    pauseResumeButton.position(77, 10);
    pauseResumeButton.mousePressed(togglePauseResume);

    // Create speed slider and its callback
    speedSlider = createSlider(1, 60, frameRateSetting);
    speedSlider.position(210, 10);
    speedSlider.style('width', '80px');
    speedSlider.input(function() {
        frameRate(speedSlider.value());
    });
    let speedLabel = createSpan('Speed');
    speedLabel.position(300, 10); 


    createCanvas(cols * resolution, rows * resolution);
    topLayer = createGraphics(cols * resolution, rows * resolution);
    figureLayer = createGraphics(cols * resolution, rows * resolution);
    frameRate(frameRateSetting);
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        tiles[i][j] = new Tile(i, j, 200 * noise(i * noiseScale, j * noiseScale));
        tiles[i][j].occupy = false;

        if (spawningRate > random()) {
          bands[nr] = new Band(i ,j ,ceil(random(4, 20)));
          bands[nr].show();
          nr += 1;
          tiles[(i, j)].occupy = true;
        }
      }
    }
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        tiles[i][j].defineNeighbors();
      }
    }
    if (bands.length == 0) {
      bands[0] = new Band(ceil(random(cols)), ceil(random(rows)), ceil(random(4, 20)));}

    
  populationTrend = [];
  resourceTrend = [];
}

function draw() {
  if (isPaused) {
    return;  // Exit the draw function early if the simulation is paused
}
  figureLayer.clear();
  topLayer.clear();
  let averageRichness = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      tiles[i][j].grow();
      tiles[i][j].show();
      averageRichness += tiles[i][j].rich;
    }
  }
  averageRichness = averageRichness / (cols * rows);
  let population = 0;
  let count = 0;
  for (var band of bands) {
    band.die();
    if (band.dead == true) {
    }
    if (!band.dead) {
      if(!band.spawning)band.spawn();
      if(!band.moving)band.move();
      if(!band.hunting)band.hunt();
      band.show();
      count = count + 1;
      population += band.size;
    }
  }

  if (populationTrend.length > 20) {populationTrend.shift();} 
  populationTrend.push(population);
  //derivative of populationTrend
  let derivative = [];
  for (let i = 0; i < populationTrend.length - 1; i++) {
    derivative[i] = populationTrend[i + 1] - populationTrend[i];
  }
  let populationAverageDerivative = 0;
  for (let i = 0; i < derivative.length; i++) {
    populationAverageDerivative += derivative[i];
  }
  populationAverageDerivative = populationAverageDerivative / derivative.length;

  if (resourceTrend.length && resourceTrend.length > 20) {resourceTrend.shift();} 
  resourceTrend.push(averageRichness);
  //derivative of resourceTrend
  let resourceDerivative = [];
  for (let i = 0; i < resourceTrend.length - 1; i++) {
    resourceDerivative[i] = resourceTrend[i + 1] - resourceTrend[i];
  }
  let resourceAverageDerivative = 0;
  for (let i = 0; i < resourceDerivative.length; i++) {
    resourceAverageDerivative += resourceDerivative[i];
  }
  resourceAverageDerivative = resourceAverageDerivative / resourceDerivative.length;
 
  let newAge = getAge(populationAverageDerivative, population, averageRichness);
  if (newAge !== currentAge) {
      currentAge = newAge;
      fadeCounter = 255; // Reset fade counter
  }
  
  if (fadeCounter > 0 ) {
    fadeCounter -= 12; 
    displayAgeText(currentAge, fadeCounter+20);
  }

  // console.log('population ',round(population),'  population derivative',round(populationAverageDerivative), '  averageRichness:',round(averageRichness), newAge);

  image(topLayer, 0, 0);
  image(figureLayer, 0, 0)
  
  topLayer.textSize(25);
  topLayer.colorMode(RGB);
  topLayer.textAlign(RIGHT, TOP);
  topLayer.textFont("sans-serif");
  topLayer.fill(255, 200);
  topLayer.text("surviving band(s) =" + count, width - 20, 20);
  topLayer.textSize(15);
  topLayer.text("by Qian Li, ludwig.peking@gmail.com, ", width - 100, height - 20);
  topLayer.fill(255, 10, 200);
  topLayer.text(" with: p5*js", width - 20, height - 20);
  topLayer.fill(255, 200);
  topLayer.textSize(30);
  topLayer.text("a_Malthusian_World@urban_banal.GENESIS(0)", width - 20, height - 50);
  image(topLayer,0,0)
}

function getAge(populationAverageDerivative, population, averageRichness) {
    if (population == 0) { noLoop(); return "We Extincted. " + bands.length + " bands lived here.";
  }
    if (populationAverageDerivative <= -10) return "Age of the Collapse";
    if (population > totalTerritory*2 && populationAverageDerivative >= 20) return "Age of the Exploitation";
    if (population <= totalTerritory && populationAverageDerivative < -5) return "Death Match";
    if (population >= totalTerritory*2) return "Age of the Stagnation";
    if (population <= totalTerritory/5 && averageRichness > 50) return "Age of Eden";
    if (populationAverageDerivative > 10) return "Age of Pioneer";
    return "Dark Age Balance";        
}

function displayAgeText(age, alphaValue) {
  topLayer.textSize(90);
  topLayer.textFont("Cormorant");
  topLayer.textAlign(CENTER, CENTER);
  topLayer.colorMode(RGB);
  topLayer.fill(255, alphaValue);
  topLayer.text(age, width / 2, height / 2);
}

function restartSimulation() {
  let currentSpeed = speedSlider.value();
  restartButton.remove();
  pauseButton.remove();
  resumeButton.remove();
  speedSlider.remove();
  setup();
  speedSlider.value(currentSpeed);
  loop();  
}

function togglePauseResume() {
  isPaused = !isPaused;  // Toggle the isPaused variable

  if (isPaused) {
      pauseResumeButton.html('Resume');  // Update button label to "Resume"
  } else {
      pauseResumeButton.html('Pause');  // Update button label to "Pause"
      loop();  // Restart the draw loop if it was stopped
  }
}

