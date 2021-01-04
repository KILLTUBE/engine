import { Table } from "./Table.js";

/**
 * 
 * @param {number} w 
 * @param {number} h 
 * @param {(x: number, y: number) => number} f
 */

export function graph_f2_table(w, h, f) {

    var slider = document.createElement("input");
    slider.style.position = "absolute";
    slider.style.top = "0";
    slider.style.left = "0";
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.002";

    var tableOriginal = new Table(h, w);
    var tableCanvas = new Table(h, w);

    var originalData = new Float32Array(w * h * 4);
    var canvasData = new Uint8ClampedArray(w * h * 4);


    var min =  999999;
    var max = -999999;

    Object.assign(window, {
        w,
        h,
        f,
        originalData,
        canvasData
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
                canvasData[idx    ] = originalData[idx    ] * scalar;
                canvasData[idx + 1] = originalData[idx + 1] * scalar;
                canvasData[idx + 2] = originalData[idx + 2] * scalar;
                canvasData[idx + 3] = originalData[idx + 3] * scalar;
                //sliderData[idx] = Math.random() * 255;
                //sliderData[idx++] = Math.random() * 10;
                //sliderData[idx++] = Math.random() * 10;
                //sliderData[idx++] = Math.random() * 10;
                //sliderData[idx++] = Math.random() * 10;
            }
        }
    }

    document.body.appendChild(slider);
    // two parameter functions .. evaluate for both and set resulting color.

    for (var px = 0; px < w; px++) {
        for (var py = 0; py < h; py++) {
            
            var res = f(px / w * 2 - 1, py / h * 2 - 1);
            //res = res.buffer ? [].slice.call(res) : res.slice ? res : [res, res, res];
            if (res.buffer)
                res = [].slice.call(res);
            if (res instanceof Array) {
                    
                for (var i=0; i<res.length; i++) {
                    min = Math.min(res[i], min);
                    max = Math.max(res[i], max);
                }
                originalData.set(
                    res.map(
                        x => x * 255
                    ).concat([255]),
                    py * w * 4 + px * 4
                );
            
            } else {
                min = Math.min(res, min);
                max = Math.max(res, max);
                res = [res, res, res];
                originalData.set(
                    res.map(
                        x => x * 255
                    ).concat([255]),
                    py * w * 4 + px * 4
                );
            }
        }
    }
    window.min = min;
    window.max = max;

    var domMin = document.createElement("div");
    document.body.appendChild(domMin);
    domMin.innerText = "Min: " + min;

    var domMax = document.createElement("div");
    document.body.appendChild(domMax);
    domMax.innerText = "Max: " + max;

    for (var i=0, n=w*h*4; i<n; i++) {
        canvasData[i] = originalData[i] * 255;
    }
    
    for (var px = 0; px < w; px++) {
        for (var py = 0; py < h; py++) {
            tableOriginal.setText(px, py, px + "," + py);
            tableCanvas.setText(px, py, px + "," + py);
        }
    }

    var div = document.createElement('div');
    div.innerText = 'div';
    return div; // todo: append everything to div
}
