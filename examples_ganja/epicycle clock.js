// Epicycle clock using PGA
// Ted Corcovilos
Algebra(2,0,1,()=>{
    
    var {E,PI} = Math;
    
    // Helper to draw a circle
    //var circle = (p,d, n=40)=>[...Array(n)].map((x,i)=>E**(PI*i/n*p)>>>(p+d*1e01));
    function circle(p,d, color, n=40) {
        //return [...Array(n)].map((x,i)=>E**(PI*i/n*p)>>>(p+d*1e01));
        var tmp = p + d * 1e01;
        return `<g transform="translate(${-p[5]}, ${p[4]})">
            <circle
                cx="0"
                cy="0"
                r="${d}"
                stroke="black"
                stroke-width="0.005"
                fill="${"#"+color.toString(16)}"
            />
            </g>
        `;
    }
    
    // lengths of hands
    var Lhour = 1.0,
        Lmin = 0.5,
        Lsec = 0.25;
        
    var format = 12; // 12 hour or 24 hour clock?
    
    var speedfactor = 360.0; // Speed up the animation (1 -> true time)
    
    document.body.appendChild(this.graph(()=>{
        // break time into h:m:s
        var time = speedfactor * Date.now(); // in milliseconds
        var hour = (time / (1000*60*60)) % format,
        minute = (time / (1000*60)) % 60,
        second = (time / (1000)) % 60;

    var O = 1e12, // origin
        // For the epicycles, start with a point, translate and rotate
        Step1 = E**(-0.5*Lhour*1e02)*E**(PI*hour*O/format),
        H = ~Step1 * O * Step1,
        Step2 = E**(-0.5*Lmin*1e02)*E**(PI*minute*H/60.),
        M = ~Step2 * H * Step2,
        Step3 = E**(-0.5*Lsec*1e02)*E**(PI*second*M/60.),
        S = ~Step3 * M * Step3;
    
    //console.log("H", H)
        return [
        0xcccccc,
        circle(O,Lhour, 0x66cccccc),
        0xffcccc,
        circle(H,Lmin, 0x66ffcccc),
        0xccccff,
        circle(M,Lsec, 0x66ccccff),
        0x000000,
        O, //"O",
        [O,H], 
        H, "H",
        0xff0000,
        [H,M], 
        M, "M",
        0x0000ff,
        [M,S], 
        S, "S",
        ];},{grid:false, animate:true}));
  });