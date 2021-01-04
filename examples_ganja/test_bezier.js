// Create a Clifford Algebra with 2,0,1 metric.
Algebra(2,0,1,()=>{
    var O = 1e12;
    var X = -1e02;
    var Y = -1e01;
    
    var point = (x,y) => O + x * X + y * Y;
    var point_a = point(0.3, 0.4);
    var point_b = point(0.3, 1.4);
    var point_c = point(1.3, 1.4);
    var point_d = point(1.7, 0.4);
    
    var translator = (line, dist) => 1+0.5*dist*(line.Normalized*1e012)
    
    var line_a_b = point_a & point_b;
    var line_b_c = point_b & point_c;
    var line_c_d = point_c & point_d;
    
    var num = ()=>performance.now()*0.001 % 1;
    var t_ab = ()=>translator(line_a_b, num)
    var t_bc = ()=>translator(line_b_c, num)
    var t_cd = ()=>translator(line_c_d, num)
    
    function toGraph() {
        return [
        O,X,
        O,Y,
        point_a,"A",
        point_b,"B",
        point_c,"C",
        point_d,"D",
        line_a_b,
        line_b_c,
        line_c_d,
        t_ab>>>point_a,
        t_bc>>>point_b,
        t_cd>>>point_c,
        `<text x=0 y=0.2 font-size=0.1>${num().toFixed(2)}</text>`
        ];
    }
    var options = {
        grid: true,
        animate: 1
    };
    document.body.innerHTML = "";
    document.body.appendChild(this.graph(toGraph, options));
});
