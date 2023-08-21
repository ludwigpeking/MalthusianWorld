class Splash {
  constructor(x, y){
    this.x = x
    this.y = y
  }
  
  show(){
    colorMode(RGB)
    noFill()
    strokeWeight(3)
    stroke(255)
    ellipse(this.x + resolution/2, this.y + resolution/2 ,50)
  }
}