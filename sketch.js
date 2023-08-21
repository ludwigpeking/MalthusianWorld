
// by Qian Li, ludwig.peking@gmail.com, 10/7/2022, all rights reserved
let tiles;
let countMemo, stagnationTime, resourceTrend, populationTrend, population;
let isPaused = false;
let restartButton, pauseButton, resumeButton;
const cols = 30;
const rows = 20;
const totalTerritory = cols * rows;
const resolution = 40;
const noiseScale = 0.2;
const frameRateSetting = 5;
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
    restartButton = createButton('Restart');
    restartButton.position(10, 10);
    restartButton.mousePressed(restartSimulation);

    // Create pause button and its callback
    pauseButton = createButton('Pause');
    pauseButton.position(100, 10);
    pauseButton.mousePressed(pauseSimulation);

    // Create resume button and its callback
    resumeButton = createButton('Resume');
    resumeButton.position(170, 10);
    resumeButton.mousePressed(resumeSimulation);
  while(bands.length<2){
    createCanvas(cols * resolution, rows * resolution);
    topLayer = createGraphics(cols * resolution, rows * resolution);
    figureLayer = createGraphics(cols * resolution, rows * resolution);
    frameRate(frameRateSetting);
    tiles = make2DArray(cols, rows);
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
  }
  countMemo = bands.length;
  populationTrend = [];
  resourceTrend = [];
  stagnationTime = 0;
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

  if (populationTrend.length > 10) {populationTrend.shift();} 
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


  if (resourceTrend.length && resourceTrend.length > 10) {resourceTrend.shift();} 
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

  

  if (countMemo === count) {
    stagnationTime += 1;
  } else {
    stagnationTime = 0; 
    countMemo = count;
  }
  
  let testFill = "";
  if (populationAverageDerivative < - 10) { testFill = "Age of the Collapse"; }
  if (populationAverageDerivative >= -10 &&  population >= totalTerritory) { testFill = "Age of the Stagnation"; }
  if (population > totalTerritory && populationAverageDerivative >= 5) { testFill = "Age of the Exploitation"; }
  if (population > totalTerritory && populationAverageDerivative < 0 && populationAverageDerivative >= -10) { testFill = "Death Match"; }
  if (population < totalTerritory && populationAverageDerivative > -2 && averageRichness >=20) { testFill = "Dark Age Balance"; }
  if (population > totalTerritory && populationAverageDerivative > 10 ) { testFill = "Age of Pioneer"; }
  if (population < totalTerritory/5 && populationAverageDerivative > 0 &&  averageRichness >= 30) { testFill = "Age of Eden"; }
  if (population == 0) { testFill = "We Extincted"; noLoop ();}
  console.log('population ',round(population),'  population derivative',round(populationAverageDerivative), '  averageRichness:',round(averageRichness), testFill);


  topLayer.textSize(50);
  topLayer.textAlign(CENTER);
  topLayer.colorMode(RGB);
  topLayer.fill(255);
  topLayer.text(testFill, width / 2, height / 2);
  image(topLayer, 0, 0);
  image(figureLayer, 0, 0)
  
  topLayer.textSize(25);
  topLayer.colorMode(RGB);
  topLayer.fill(0);
  topLayer.text("surviving band(s) =" + count, 10, 33);
  topLayer.textSize(15);
  topLayer.text("by Qian Li, ludwig.peking@gmail.com, ", width - 400, height - 20);
  topLayer.fill(255, 10, 200);
  topLayer.text(" with: p5*js", width - 115, height - 20);
  topLayer.fill(255, 200);
  topLayer.textSize(30);
  topLayer.text("banalSmasher.GENESIS(0)", width - 400, height - 50);
  image(topLayer,0,0)
}

function restartSimulation() {
  setup();  // Restart the simulation by calling setup again
}

function pauseSimulation() {
  isPaused = true;
}

function resumeSimulation() {
  isPaused = false;
}
