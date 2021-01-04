// https://enkimute.github.io/ganja.js/examples/coffeeshop.html#NpsKhuwlO
// Ganja.js does not handle R2 or R3 natively, but this is easy to work around.
// Lets do it for R2.

Algebra(2,()=>{

  // R2 is often looked at point-based. That means vectors are points...    
  // In this space we can not distinguish vectors and points.. 

  var point  = (x,y)=> x*-1e1 + y*-1e2;
  var vector  = point;
  
  // It only has rotations around the origin.
  var rotate = (point, alpha)=> Math.E**( alpha/2 * 1e12 ) >>> point;
  var translate = (point, translation_vector)=> point + translation_vector;
  // Create some points
  var A = point(0.2,0.2);
  var B = point(1.5,1.5);
  var C = point(0.4,1);
  window.A = A;
  console.log("A", A)
  // Rotate then translate them
  //var [D,E,F] = translate(rotate([A,B,C], Math.PI/4 ), vector(0.5,-0.5));
  
  var [D,E,F] = translate(rotate([A,B,C], Math.PI*0.1 ), 1e12);

  // Now to graph them we quickly go to 2D PGA to graph.
  // Just ignore this block basically.
  var graph = Algebra(2,0,1).inline((ar,opts)=>{
      var upgrade_to_pga = x=>{
        while (x.call) x = x.call();
        if (x instanceof Array) {
            return x.map(upgrade_to_pga);
        }
        if (x instanceof Float32Array) {
            return new Element([0,0,0,0,x[2],x[1],1,0])
        }
        return x;
      }
      return this.graph(upgrade_to_pga(ar),opts)
  })    
    var AplusB = A+B;
    
    
  // Now graph these points, polygons, lines between them etc.
  document.body.innerHTML = "";
  document.body.appendChild(graph([
      //1e12,"ORIGIN",
    0xFF0000,
    A,"A",
    B,"B",
    C,"C",
    B-A,"B-A",
    0x00ffff,
    [A,B,C], "ABC",
    0x0000ff,"A,B,C",
    0x0000FF, D,"D",
    E,"E",
    F,"F",
    [D,E],[E,F],[D,F],
    AplusB,"A+B"
  ], {grid:1}))    
 
    
    
    var data = "";
    data = "<table>"
    for (var i=0; i<Math.PI*2; i+=0.2) {
        var ret = 1e12 * i;
        var str = "";
        str += "<td>" + ret[0] + "</td>";
        str += "<td>" + ret[1] + "</td>";
        str += "<td>" + ret[2] + "</td>";
        str += "<td>" + ret[3] + "</td>";
        //str += "<td>" + ret[4] + "</td>";
        //str += "<td>" + ret[5] + "</td>";
        //str += "<td>" + ret[6] + "</td>";
        //str += "<td>" + ret[7] + "</td>";
        
        data += "<tr>" + str + "</td>";
    }
    document.body.innerHTML = data + "</tr></table>";
    
})