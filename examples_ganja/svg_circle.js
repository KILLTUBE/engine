Algebra(2,0,1,()=>{
    var ORIGIN = 1e12;
    var point      = (x,y) => 1e12-x*1e02+y*1e01;
    var line       = (a,b,c) => a*1e1 + b*1e2 + c*1e0;
    var dist_pp    = (x,y) =>(X&Y).Length;
    var dist_pl    = (P,l) => (P.normalized^l.Normalized).e012;
    var angle      = (x,y) => (x,y)=>Math.acos(x.Normalized<<y.Normalized);
    var project_pl = (P,l)=>(l<<P)*1;
    var project_lp = (P,l)=>(l<<P)*P;
    var reject_lp  = (P,l)=>(l<<P);
    
    // Rotations can be specified through exponentiation (angle around point)
    var rotor = (point, angle) => Math.cos(angle/2) + Math.sin(angle/2) * point.normalized;
    
    // Translations can similarly be expessed through exponentiation
    var translator = (line,distance) =>1+0.5*distance*(line.Normalized*1e012);
    
    var point_a = point(0,0);
    var point_b = point(0.5,-0.5);
    var line_a = line(0,1,0);
    var line_b = line(1,0,0);
    
    var translator_along_line_a = ()=>translator(line_a,0.5*Math.sin(performance.now()*0.001))
    var translator_along_line_b = ()=>translator(line_b,0.5*Math.sin(performance.now()*0.001))
    
    // Rotating around origin, then apply translator
    //var rotor = 
    var translated_point_a = () => translator_along_line_a>>>point_b;
    var translated_point_b = () => translator_along_line_b>>>point_b;
    var circle_two_points = (point_a, point_b) => {
        var midpoint = (point_a + point_b) / 2;
        var len = (point_a & point_b).Length;
        var r = len / 2;
        //console.log("len", len);
        //translator_along_line_a>>>point_b
        var x = -midpoint.e01;
        var y = midpoint.e02;
        return `<circle cx="${x}" cy="${y}" r="${r}" stroke="lime" stroke-width="0.01" fill="transparent"/>
        <text x="${x}" y="${y}" font-size=0.1>${r.toFixed(2)}</text>`;
    }
    
    document.body.innerHTML = "";
    document.body.appendChild(this.graph([
        point_a,"point_a",
        point_b,"point_b",
        line_a,"line_b",
        line_b,"line_a",
        ORIGIN, translated_point_a,
        ORIGIN, translated_point_b,
        ORIGIN, line_b,
        ORIGIN, ()=>circle_two_points(translated_point_a,translated_point_b),
        ORIGIN, () => (point_a + point_b) / 2, "midpoint"
    ],{
        animate: 1,
        grid: true
    }))
})