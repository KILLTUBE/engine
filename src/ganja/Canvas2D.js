export default class Canvas2D {
    /**
     * 
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
    }

    /*
        Formerly:

        var w = this.canvas.width;
        var h = this.canvas.height;
        // Convert real component to canvas left/right
        var X = (real) => (real + 1) * w /  2;
        // Convert imag component to canvas top/bottom
        var Y = (imag) => (-imag + 1) * h / 2; // - to flip "top"
    */

    /**
     * 
     * @param {number} x
     */
    X(x) {
        var w = this.canvas.width;
        return (x + 1) * w /  2;
    }

    /**
     * 
     * @param {number} y 
     */
    Y(y) {
        var h = this.canvas.height;
        y *= -1; // flip "top"
        return (y + 1) * h / 2;
    }

    drawGrid() {
        var context = this.context;

        var X = this.X.bind(this);
        var Y = this.Y.bind(this);

        var real_from = -10;
        var real_to = 10;
        var imag_from = -5;
        var imag_to = 5;
        context.beginPath();
        // Draw real axis
        context.moveTo(X(real_from), Y(0));
        context.lineTo(X(real_to  ), Y(0));
        context.strokeStyle = "green";
        context.lineWidth = 3;
        context.stroke();
        // Draw imaginary axis
        context.beginPath();
        context.moveTo(X(0), Y(imag_from));
        context.lineTo(X(0), Y(imag_to  ));
        context.strokeStyle = "green";
        context.lineWidth = 3;
        context.stroke();
        // Draw real axis ticks
        for (var i=real_from; i<=real_to; i+=0.2) {
            context.beginPath();
            context.moveTo(X(i), Y( 0.01));
            context.lineTo(X(i), Y(-0.01));
            context.strokeStyle = "lime";
            context.lineWidth = 2;
            context.stroke();
            context.font = "10px Arial";
            context.fillStyle = "lime"
            context.fillText(i.toFixed(1), X(i-0.02), Y(-0.04));
        }
        // Draw imaginary axis ticks
        for (var i=imag_from; i<=imag_to; i+=0.2) {
            context.beginPath();
            context.moveTo(X( 0.01), Y(i));
            context.lineTo(X(-0.01), Y(i));
            context.strokeStyle = "lime";
            context.lineWidth = 2;
            context.stroke();
            context.font = "10px Arial";
            context.fillStyle = "lime"
            context.fillText(i.toFixed(1), X(-0.06), Y(i));
        }
    }
}
