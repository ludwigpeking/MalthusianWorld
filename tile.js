class Tile { 
  constructor(i, j, rich){
    this.i = i;
    this.j = j;
    this.x = i * resolution;
    this.y = j * resolution;
    this.rich = rich;
    this.occupy = false;
    this.neighbors = [];
  }
  
  grow(){
    if(this.rich <  200) {
      this.rich = this.rich * 1.01;
      this.rich = this.rich + 0.06;
    }
  }
  
  show(){
    colorMode(HSB, 100)
    fill(map(this.rich, 0, 200, 10, 40), map(this.rich, 0,200, 30,90),map(this.rich,0,200, 92,15))
    noStroke()
    rect(this.x, this.y, this.x+resolution, this.y + resolution)
    textSize(10);
    colorMode(RGB)
    fill(255);
    // text(floor(this.rhis.x, this.y + resolution)
  }
  defineNeighbors (){
    let up = tiles[this.i][(this.j -1 + rows)% rows];
    let down = tiles[this.i][(this.j +1)% rows];
    let left = tiles[(this.i-1 + cols)% cols][this.j];
    let right = tiles[(this.i+1)%cols][this.j];
    this.neighbors = [up, down, left, right];
  }

}