export var scatter;
export var iris;
export var selectionHertz2;
export var selectionHertzVerticalLine;
export var width;
export var height;
export var svg;
export var clip;
export var x;
export var xAxis;
export var y;
export var yAxis;
export var lightred = "#ffcccb";
export var dataHertz2;
export var PI2 = Math.PI * 2;
export var sinX;
export var sinY;
export var newX;
export var newY;
export var debug;

// Create data
export var data = [
    {x: 10, y: 20, fill: lightred},
    {x: 40, y: 90, fill: "lightgreen"},
    {x: 80, y: 50, fill: "lightblue"}
];

export var pointOne;
export var pointTwo;
export var pointThree;

function addThreeOtherPoints() {
    // Add 3 dots for 0, 50 and 100%
    pointOne = svg
        .append("circle")
        .attr("cx", x(10))
        .attr("cy", y(15))
        .attr("r", 10)
        .style("fill", "red");

    pointTwo = svg
        .append("circle")
        .attr("cx", x(50))
        .attr("cy", y(30))
        .attr("r", 20)
        .style("fill", "green");

    pointThree = svg.append("circle")
        .attr("cx", x(100))
        .attr("cy", y(45))
        .attr("r", 30)
        .style("fill", "blue");
}

export function setup_clip() {
    // Add a clipPath: everything out of this area won't be drawn.
    clip = svg.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("SVG:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);
}

export function setup_x_xAxis_y_yAxis() {
    x = d3
        .scaleLinear()
        .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
        .range([0, width]);       // This is the corresponding value in pixels
        
    xAxis = svg
        .append('g')
        .attr("transform", "translate(0," + (height) + ")")
        .call(d3.axisTop(x));

    y = d3
        .scaleLinear()
        .domain([0, 100])         // This is the min and the max of the data: 0 to 100 if percentages
        .range([height, 0]);      // This is the corresponding value in pixels

    yAxis = svg
        .append('g')
        //.attr("transform", "translate(0," + (height-100) + ")")
        .call(d3.axisRight(y));
}

function updateSinus(x, y) {
    /*
    selectionHertz2
        .attr("cx", function(d, i) {
            var ret = Math.random() * 100;
            ret = sinX(i);
            ret = x(ret);
            //debug.innerHTML = `x ${newX(50).toFixed(0)} y ${newY(50).toFixed(0)}`;
            return ret;
            return d3.event.transform.rescaleX(x)()
        })
        .attr("cy", function(d) {
            var ret = Math.random() * 100;
            ret = d;
            ret = sinY(ret);
            ret = y(ret);
            return ret;
            return d3.event.transform.rescaleY(y)()
        })
        */
    selectionHertz2.attr("d",
        d3.line()
        .x(function(d,i) { return x(sinX(i)) })
        .y(function(d,i) { return y(sinY(d)) })
    )


    selectionHertzVerticalLine.attr("d",
        d3.line()
        .x(function(d) { return x(sinX(d.x)) })
        .y(function(d) { return y(sinY(d.y)) })
    )
}

function updateChart() {
    //console.log("d3.event.transform", d3.event.transform);

    // recover the new scale
    newX = d3.event.transform.rescaleX(x);
    newY = d3.event.transform.rescaleY(y);
    //console.log("newX", newX);
    //console.log("newY", newY);
    // update axes with these new boundaries
    xAxis.call(d3.axisTop(newX));
    yAxis.call(d3.axisRight(newY));


    // update circle position
    iris
        .attr('cx', function(d) {return newX(d.Sepal_Length)})
        .attr('cy', function(d) {return newY(d.Petal_Length)});

    updateSinus(newX, newY);
}

export function start() {
    d3
    .select(".target")  // select the elements that have the class 'target'
    .style("stroke-width", 8) // change their style: stroke width is not equal to 8 pixels
    .style("opacity", 0.4)
    
    svg = d3.select("#dataviz_area")

    /*
    margin = {
        top: 10,
        right: 40,
        bottom: 30,
        left: 30
    };
    */
    width = window.innerWidth; // - margin.left - margin.right;
    height = window.innerHeight; // - margin.top - margin.bottom;

    /*
    svg
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom)
    .style("border", "1px solid black")
    */

    svg = d3.select("#Area")
        .append("svg")
        .attr("width", width /*+ margin.left + margin.right*/)
        .attr("height", height /*+ margin.top + margin.bottom*/)

    /*
    svg
        .call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform)
        }))
    */

    // Create the scatter variable: where both the circles and the brush take place
    scatter = svg.append('g')
        .attr("clip-path", "url(#clip)")

        /*
    // translate this svg element to leave some margin.
    scatter
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        */

    setup_x_xAxis_y_yAxis();
    setup_clip();
    addThreeOtherPoints();

    dataHertz2 = [];
    for (var val=0; val<PI2 * 6; val+=0.1)
        dataHertz2.push(Math.sin(val));
            
    sinX = d3
    .scaleLinear()
    .domain([0, dataHertz2.length])
    .range([10, 90]);

    sinY = d3
        .scaleLinear()
        .domain([-1, 1])
        .range([70, 90]);
        

        /*
    selectionHertz2 = scatter
        .selectAll("whatever") // select all the elements that have not be created yet, I know it is weird.
        .data(dataHertz2)      // specify the data to use.
        .enter()               // start a loop for the data. Following code will be applied to data[0], data[1] and so on.
        .append("circle")      // for each iteration, add a circle.
        .attr("cx", function(d, i) {
            return 0;
        })
        .attr("cy", function(d) {
            return 0;
        })
        //.attr("fill", function(d){ return d.fill; })
        .attr("r", 7)
*/

    selectionHertzVerticalLine = scatter
    .append("path")
    .datum([
        {
            x:0,
            y:0
        }, {
            x: dataHertz2.length,
            y:0
        }
    ])      // specify the data to use.
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 4)
    .attr("d",
        d3.line()
            .x(function(d) { return sinX(d.x) })
            .y(function(d) { return sinY(d.y) })
    );

    selectionHertz2 = scatter
        .append("path")
        .datum(dataHertz2)      // specify the data to use.
        .attr("fill", "none")
        .attr("stroke", "yellow")
        .attr("stroke-width", 4)
        .attr("d",
            d3.line()
                .x(function(d,i) { return sinX(i) })
                .y(function(d,i) { return sinY(d) })
        )

    updateSinus(x, y);

    debug = document.createElement("div");
    document.body.appendChild(debug);

        
        //Read the data
    d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv", function(data) {
        console.log("got data", data);

        
        // Add circles
        iris = scatter
            .selectAll("iris")
            .data(data)
            .enter()
            .append("circle")
                .attr("cx", function (d) { return x(d.Sepal_Length); } )
                .attr("cy", function (d) { return y(d.Petal_Length); } )
                .attr("r", 8)
                .style("fill", "#61a3a9")
                .style("opacity", 0.5)


        // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
        var zoom = d3.zoom()
            .scaleExtent([.2, 100])  // This control how much you can unzoom (x0.5) and zoom (x20)
            .extent([[0, 0], [width, height]])
            .on("zoom", updateChart);
            
        // This add an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zoom
        svg
            .append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all")
                //.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .call(zoom); // now the user can zoom and it will trigger the function called updateChart
    });

}
