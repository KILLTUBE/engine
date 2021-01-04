/**
 * 
 * @param {Options} options
 * @param {number} width
 * @param {number} height
 * @param {(x: number, y: number) => number} f
 * @returns {HTMLCanvasElement}
 */

export function graph_f2(options, width, height, f) {
    // 1d and 2d functions are rendered on a canvas.
    var canvas;
    if (options && options.canvas) {
        canvas = options.canvas;
    } else {
        canvas = document.createElement('canvas');
    }
    canvas.width = width;
    canvas.height = height;
    var w = canvas.width;
    var h = canvas.height;
    var context = canvas.getContext('2d');
    //var data = context.getImageData(0, 0, w, h);
    //context.putImageData(data, 0, 0);

    console.log("canvas", canvas)
    var slider = document.createElement("input");
    slider.style.position = "absolute";
    slider.style.top = "0";
    slider.style.left = "0";
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.002";

    var originalData = new Float32Array(w * h * 4);
    var sliderData = new Uint8ClampedArray(w * h * 4);
    var imageData = new ImageData(sliderData, w, h)

    var min =  999999;
    var max = -999999;

    Object.assign(window, {
        w,
        h,
        canvas,
        f,
        context,
        originalData,
        sliderData,
        imageData
    });

    slider.oninput = function() {
        var scalar = slider.valueAsNumber;
        //data = context.getImageData(0, 0, w, h);
        //console.log("data", data)
        ///window.data=data;

        var delta = max - min;
        var scalar = min + delta * slider.valueAsNumber;
        
        //if (window.debugGraphF2)
        {
            console.clear();
            console.log("min", min);
            console.log("max", max);
            console.log("slider.valueAsNumber", slider.valueAsNumber);
            console.log("scalar", scalar);
        }
        for (var i=0; i<w; i++) {
            for (var j=0; j<h; j++) {
                var idx = j * w * 4 + i * 4;
                sliderData[idx    ] = originalData[idx    ] * scalar;
                sliderData[idx + 1] = originalData[idx + 1] * scalar;
                sliderData[idx + 2] = originalData[idx + 2] * scalar;
                sliderData[idx + 3] = originalData[idx + 3] * scalar;
                //sliderData[idx] = Math.random() * 255;
                //sliderData[idx++] = Math.random() * 10;
                //sliderData[idx++] = Math.random() * 10;
                //sliderData[idx++] = Math.random() * 10;
                //sliderData[idx++] = Math.random() * 10;
            }
        }
        //data.data = sliderData;
        //var newImageData = new ImageData(sliderData, w, h)
        context.putImageData(imageData, 0, 0);
    }

    document.body.appendChild(slider);
    // two parameter functions .. evaluate for both and set resulting color.

    for (var px = 0; px < w; px++) {
        for (var py = 0; py < h; py++) {
            
            var res = f(px / w * 2 - 1, py / h * 2 - 1);
            min = Math.min(res, min);
            max = Math.max(res, max);
            res = res.buffer ? [].slice.call(res) : res.slice ? res : [res, res, res];
            originalData.set(
                res.map(
                    x => x * 255
                ).concat([255]),
                py * w * 4 + px * 4
            );
        }
    }
    window.min = min;
    window.max = max;

    

    for (var i=0, n=w*h*4; i<n; i++) {
        sliderData[i] = originalData[i] * 255;
    }

    //data = context.getImageData(0, 0, w, h);
    //data.data = originalData;
    context.putImageData(imageData, 0, 0);


    function randomPoints() {
        // get n-th pixel at random and paint it black
        var pos = ~~(Math.random()*w*h)*4;
        //originalData[pos+3] = 255;
        originalData[pos+0] = Math.random();
        originalData[pos+1] = Math.random();
        originalData[pos+2] = Math.random();
        //originalData[pos+4] = Math.random();
        for (var i=0, n=w*h*4; i<n; i++) {
            sliderData[i] = originalData[i] * 255;
        }
        // get (x,y) of chosen pixel
        //var x = (pos/4) % w,
        //    y = Math.floor((pos/4) / w);
        context.putImageData(imageData, 0, 0);
    }
    //setInterval(randomPoints, 10);

/*
var arr = sliderData;
// Iterate through every pixel
for (let i = 0; i < arr.length; i += 4) {
    arr[i + 0] = 0;    // R value
    arr[i + 1] = 190;  // G value
    arr[i + 2] = 0;    // B value
    arr[i + 3] = 255;  // A value
  }
  
  // Initialize a new ImageData object
  let imageData = new ImageData(arr, h);
  
  // Draw image data to the canvas
  ctx.putImageData(imageData, 20, 20);    
  */
    return canvas;
}
