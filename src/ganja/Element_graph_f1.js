/**
 * 
 * @param {Options} options
 * @param {number} width
 * @param {number} height
 * @param {(x: number) => number} f
 * @returns {HTMLCanvasElement}
 */

export function graph_f1(options, width, height, f) {
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
    var data = context.getImageData(0, 0, w, h);
    // one parameter function.. go over x range, use result as y.
    for (var px = 0; px < w; px++) {
        var res = f(px / w * 2 - 1);
        res = Math.round((res / 2 + 0.5) * h);
        if (res > 0 && res < h - 1)
            data.data.set(
                [0, 0, 0, 255],
                res * w * 4 + px * 4
            );
    }
    context.putImageData(data, 0, 0);
    return canvas;
}
