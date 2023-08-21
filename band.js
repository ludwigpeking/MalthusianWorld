class Band {
  constructor(i, j, size){
    this.i = i;
    this.j = j;
    this.x = i * resolution;
    this.y =  j * resolution;
    this.size = size
    this.dead = false
    this.spawning = false;
    this.hunting = false;
    this.moving = false;
    this.neighbors = tiles[this.i][this.j].neighbors;
    this.R = random(255)
    this.G = random(255)
    this.B = random(255)
    
  }
  update(){
    this.neighbors = tiles[this.i][this.j].neighbors;
  }

  spawn(){
    if (this.size >=60){
      
      let maxRichness = -Infinity;        
      let richestAvailable = null;
      this.neighbors = tiles[this.i][this.j].neighbors;

      for (let neighbor of this.neighbors) {
        if (!neighbor.occupy) {
          if (neighbor.rich > maxRichness) {
              maxRichness = neighbor.rich;
              richestAvailable = neighbor;
          }
        }
      }
   
      if (richestAvailable) {
        // this.spawning = true;
        this.size /= 2
        richestAvailable.occupy = true;
        let newBand = new Band(richestAvailable.i, richestAvailable.j, this.size/2);
        newBand.R = this.R + random(-40, 40);
        newBand.G = this.G + random(-40, 40);
        newBand.B = this.B + random(-40, 40);
        bands.push(newBand);
      }
    // let p = new Splash(target.x, target.y)
    // p.show()
    }
  }
  move(){
    let moveCriteria = this.size*2 > tiles[this.i][this.j].rich
    if (moveCriteria){

      let maxRichness = -Infinity;        
      let richestAvailable = null;
      this.neighbors = tiles[this.i][this.j].neighbors;
      for (let neighbor of this.neighbors) {
        if (!neighbor.occupy) {
          if (neighbor.rich > maxRichness) {
              maxRichness = neighbor.rich;
              richestAvailable = neighbor;
          }
        }
      }
      if (richestAvailable) {
        // this.moving = true;
        tiles[this.i][this.j].occupy = false;
  
        this.i = richestAvailable.i;
        this.j = richestAvailable.j;
        this.x = richestAvailable.x;
        this.y = richestAvailable.y;
        this.size = this.size*0.95
        richestAvailable.occupy = true;
      }
    }
  }

  hunt(){
    let huntEff = min(1.1 * this.size, tiles[this.i][this.j].rich*0.6)
    let surplus = huntEff - this.size //surplus can be negative
    this.size = this.size + surplus*0.65
    tiles[this.i][this.j].rich -= huntEff    
  }
  
  die(){
    if(this.size < 4) {
      // let s = new Splash(this.x, this.y);
      // s.show()
      this.dead = true;
      this.size = 0
      tiles[this.i][this.j].occupy = false
      image(tomb,this.x+2, this.y+2)

    }
  }
  
  show(){
    for (let i =0; i < round(this.size/10); i++){
      if (i % 2) {
        drawACaveman(this.x+resolution/2 + i * resolution/10 - resolution/10, this.y+resolution/2, resolution, this.R, this.G, this.B, figureLayer)
      } else {
        drawACaveman(this.x+resolution/2 - i * resolution/10, this.y+resolution/2, resolution, this.R, this.G, this.B, figureLayer)
      }
    
    }
    // fill(255,0,0)
    // textSize(12)
    // text(floor(this.size), this.x+resolution/2, this.y+resolution/2)
  }
}

function drawACaveman (x, y, res, r, g, b, layer){
  layer.fill(100+r*2,g*1,0)
  layer.noStroke();
  layer.ellipse(x, y-res/4, res/10)
  layer.rectMode(CENTER);
  layer.rect (x, y, res * 0.2, res * 0.3)
  layer.fill(r, g, b)
  layer.noStroke();
  layer.triangle(x-res*0.1, y+ res*0.15, x+res/10, y+ res*0.15,  x+res/10, y-res*0.15)
}

