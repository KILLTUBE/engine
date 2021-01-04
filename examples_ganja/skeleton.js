// Create a Clifford Algebra with 2,0,1 metric.
Algebra(2,0,1,()=>{  
    var toGraph = [
        1e21
    ];
    var options = {
        grid: true
    };
    document.body.innerHTML = "";
    document.body.appendChild(this.graph(toGraph, options));
});
