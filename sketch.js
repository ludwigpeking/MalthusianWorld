
// by Qian Li, ludwig.peking@gmail.com, 10/7/2022, all rights reserved
let currentAge = "";
let fadeCounter = 0;
let tiles;
let resourceTrend, populationTrend, growthRateTrend, population;
let secondDerivative = [];
let history = [];
let ageSustain = 0;
let isPaused = false;
let restartButton, pauseButton, resumeButton, speedSlider;
let frame = 0;
const cols = 40;
const rows = 30;
const totalTerritory = cols * rows;
const resolution = 40;
const noiseScale = 0.2;
const frameRateSetting = 8;
let bands = [];
let nr = 0;
let topLayer, figureLayer;
let graphLayer;
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
    history = [[],[],[],[],[]]; //population, growth, richness, growthRateChange, age
    frame = 0;
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
    speedSlider.position(150, 10);
    speedSlider.style('width', '120px');
    speedSlider.input(function() {
        frameRate(speedSlider.value());
    });
    let speedLabel = createSpan('Speed');
    speedLabel.position(300, 10); 


    createCanvas(cols * resolution, rows * resolution);
    topLayer = createGraphics(cols * resolution, rows * resolution);
    figureLayer = createGraphics(cols * resolution, rows * resolution);
    graphLayer = createGraphics(cols * resolution, rows * resolution); 
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
  growthRateTrend = [];
  resourceTrend = [];
  population = 0;
  for (let band of bands) {
    population += band.size;
  }
  let totalRichness = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++){
      totalRichness += tiles[i][j].rich;
    }
  }
  let averageRichness = totalRichness / (cols * rows);

  history[0].push(population);
  history[1].push(0);
  history[2].push(averageRichness);
  history[3].push(0);
  history[4].push("");
  ageSustain = 0;

}

function draw() {
  if (isPaused) {
    noLoop ();
}
  figureLayer.clear();
  topLayer.clear();
  let totalRichness = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      tiles[i][j].grow();
      tiles[i][j].show();
      totalRichness += tiles[i][j].rich;
    }
  }
  let averageRichness = totalRichness / (cols * rows);
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
  frame += 1;
  history[0].push(population);
  let historyLength = 1;
  let growth = 0;
  for (let historyPopluations = max(1, frame - 10); historyPopluations <= frame; historyPopluations++) {
    growth += history[0][historyPopluations] - history[0][historyPopluations-1];
    historyLength += 1;
  }
  growth = growth / historyLength;

  let growthRateChange = growth - history[1][history[1].length - 1];
  let newAge = getAge(growth, population, averageRichness,growthRateChange);
  if (newAge === "We Extincted. " + bands.length + " bands lived here.") {
    currentAge = newAge;
    noLoop();
    displayAgeText(currentAge, 255);
  }
  
 
  if ( newAge == currentAge) {
    ageSustain =0;
  } else if (newAge !== currentAge) {
      ageSustain += 1;
      if (ageSustain > 5) {
          ageSustain = 0;
          currentAge = newAge;
          console.log('new age: ', currentAge, "growth:",round (growth,1), "population:",round (population), "averageRichness:",round (averageRichness), "growthRateChange:",round(growthRateChange,2));
          fadeCounter = 355; // Reset fade counter
      }
      
  }
  history[1].push(growth);
  history[2].push(averageRichness);
  history[3].push(growthRateChange);
  history[4].push(currentAge);
  if (fadeCounter > 0 ) {
    fadeCounter -= 8; 
    displayAgeText(currentAge, fadeCounter);
  }
  updateGraph(population, growth);

  image(topLayer, 0, 0);
  image(graphLayer, 0, 0);
  image(figureLayer, 0, 0)
  
  topLayer.textSize(25);
  topLayer.colorMode(RGB);
  topLayer.textAlign(RIGHT, TOP);
  topLayer.textFont("sans-serif");
  topLayer.fill(255, 200);
  topLayer.text("growthRateChange = "+round(growthRateChange,1)+", "+currentAge +", richness = " + round(averageRichness)+ ", surviving band(s) =" + count + ";  population = "+ round(population) + "; growth =  "+ round(growth), width - 20, 20);
  topLayer.textSize(15);
  topLayer.text("by Qian Li, ludwig.peking@gmail.com, ", width - 100, height - 20);
  topLayer.fill(255, 10, 200);
  topLayer.text(" with: p5*js", width - 20, height - 20);
  topLayer.fill(255, 200);
  topLayer.textSize(30);
  topLayer.text("a_Malthusian_World@urban_banal.GENESIS(0)", width - 20, height - 50);

  topLayer.stroke(255);
  topLayer.strokeWeight(2);
  topLayer.noFill();
  
  // Draw axes
  topLayer.line(10, graphLayer.height -160, graphLayer.width / 4+10, graphLayer.height -160);  // X-axis
  topLayer.line(10, graphLayer.height - 10, 10, graphLayer.height-310);  // Y-axis
  topLayer.rect(10, graphLayer.height - 310, graphLayer.width / 4, 300);  // Graph area

  image(topLayer,0,0)
}

function updateGraph(population, growth) {
  // graphLayer.clear();  // Clear the previous frame's graph
  
  // Map the population and growth to the graph's coordinates
  let x = map(population, 0, cols * rows * 4, 10, graphLayer.width / 4+10);  // Adjust the divisor to fit the graph on the screen
  let y = map(growth, -200, 200, graphLayer.height -10, graphLayer.height -310);  // Adjust the divisor and invert y-axis
  // graphLayer.blendMode(SCREEN );  // Use LIGHTEST if your background is light
    graphLayer.fill(0, 50);  // Adjust the alpha value as needed
    graphLayer.noStroke();
    // graphLayer.rect(0, graphLayer.height - 310, graphLayer.width / 4 + 10, 300);  // Adjust the coordinates and dimensions as needed

   

  graphLayer.stroke(255);
  graphLayer.strokeWeight(2);
  graphLayer.noFill();
  
  // Draw axes
  graphLayer.line(10, graphLayer.height -160, graphLayer.width / 4+10, graphLayer.height -160);  // X-axis
  graphLayer.line(10, graphLayer.height - 10, 10, graphLayer.height-310);  // Y-axis

  graphLayer.fill(255, 0, 0, 100);
  graphLayer.noStroke();
  graphLayer.ellipse(x, y, 5, 5);  // Draw the point for the current population and growth
  // graphLayer.blendMode(BLEND)
}

function getAge(growth, population, averageRichness, growthRateChange) {
  if (population == 0) {  return "We Extincted. " + bands.length + " bands lived here.";}
    else if (growth>0 && averageRichness > 50 && population < totalTerritory / 4) {
      return "Age of Eden";
  } else if (growth> 0 && growthRateChange > 0 && averageRichness > 50 && population < totalTerritory *2) {
      return "Age of Pioneer";
  } else if (growth> 0 && growthRateChange > 0  && population >= totalTerritory *2) {
      return "Age of Boom";
  } else if (growth> 0 && growthRateChange <= 0  && population >= totalTerritory *2) {
      return "Age of Crisis";
  } else if (growth<= 0 && growthRateChange <= 0 && averageRichness <= 50 && population >= totalTerritory *2) {
      return "Age of Collapse";
  } else if (growth<= 0 && averageRichness <= 50 && population < totalTerritory *2) {
      return "the Death Match";
  } else if (growth<= 0 && growthRateChange > 0 &&averageRichness <= 50 && population < totalTerritory *2) {
      return "Age of Noah";
  } else {
      return " ";
  }
}

// function getAge(growth, population, averageRichness,growthRateChange) {
//   //ages: eden, pioneer, boom, stagnation, collapse, deathmatch, noah, darkage
//     if (population == 0) { noLoop(); return "We Extincted. " + bands.length + " bands lived here.";}
//       else if (growth>0 && averageRichness > 50 && population < totalTerritory/4) return "Age of Eden";
//       else if ( growth>0 && growthRateChange >0 && population >= totalTerritory/4) return "Age of Pioneer";
//       else if ( growth>0 && growthRateChange <=0 && population >= totalTerritory *2) return "Age of Boom";
//       else if ( growth>0 && growthRateChange <=0 && population < totalTerritory *2) return "Age of Stagnation";
//       }
//     // }
//     // if (growth <= -10 && population> totalTerritory*2) return "Age of the Collapse";
//     // if (growth <= -10 && population<= totalTerritory*2) return "Death Match";
//     // if (growth >= 10 && population<= totalTerritory/3) return "Age of the Exploitation";
//     // if (population > totalTerritory*2 && growth >= 10) return "Age of the Exploitation";
//     // if (population <= totalTerritory/3 && growth < -3) return "Death Match";
//     // if (population >= totalTerritory && abs(growth)<5) return "Age of the Stagnation";
//     // if (population <= totalTerritory/5 && averageRichness > 50) return "Age of Eden";
//     // if (growth > 5) return "Age of Pioneer";
//     // // return "Dark Age Balance";      
//     // return "";        
  
// // }

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
  pauseResumeButton.remove();
  restartButton.remove();
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

