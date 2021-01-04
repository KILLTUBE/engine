// https://github.com/enkimute/ganja.js/pull/73

import { graph_f1 } from "./Element_graph_f1.js";
import { graph_f2 } from "./Element_graph_f2.js";

// The graphing function supports several modes. It can render 1D functions and 2D functions on canvas, and PGA2D, PGA3D and CGA2D functions using SVG.
// It handles animation and interactivity.
//   graph(function(x))     => function of 1 parameter will be called with that parameter from -1 to 1 and graphed on a canvas. Returned values should also be in the [-1 1] range
//   graph(function(x,y))   => functions of 2 parameters will be called from -1 to 1 on both arguments. Returned values can be 0-1 for greyscale or an array of three RGB values.
//   graph(array)           => array of algebraic elements (points, lines, circles, segments, texts, colors, ..) is graphed.
//   graph(function=>array) => same as above, for animation scenario's this function is called each frame.
// An optional second parameter is an options object { width, height, animate, camera, scale, grid, canvas }

/**
 * 
 * @param {*} f 
 * @param {Options} options 
 * @param {*} Element
 * @param {*} tot
 * @param {*} drm
 */

export default function Element_graph_arrows(
    f,
    options,
    Element,
    tot,
    drm
) {
    // Store the original input
    if (!f) {
        return;
    }
    var origf = f;
    // generate default options.
    options = options || {};
    options.scale = options.scale || 1;
    options.camera = options.camera || (tot < 4 ? Element.Scalar(1) : new Element([0.7071067690849304, 0, 0, 0, 0, 0, 0, 0, 0, 0.7071067690849304, 0, 0, 0, 0, 0, 0]));
    if (options.conformal && tot == 4) {
        var ni = options.ni || this.Coeff(4, 1, 3, 1), no = options.no || this.Coeff(4, 0.5, 3, -0.5), minus_no = no.Scale(-1);
    }
    var ww = options.width;
    var hh = options.height;
    var cvs = options.canvas;
    var tpcam = new Element([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -5, 0, 0, 1, 0]);
    var tpy = this.Coeff(4, 1);
    // var tp = new Element();

    // project 3D to 2D. This allows to render 3D and 2D PGA with the same code.
    /**
     * 
     * @param {any} o 
     */
    function project(o) {
        if (!o) {
            return o;
        }
        while (o.call) {
            o = o();
        }
        return (tot == 4 && (o.length == 16)) ?
        (tpcam).Vee(options.camera.Mul(o).Mul(options.camera.Conjugate)).Wedge(tpy) :
        (o.length == 2 ** tot) ? Element.sw(options.camera, o) : o;
    }
    // gl escape.
    if (options.gl && !(tot == 4 && options.conformal)) {
        return Element.graphGL(f, options);
    }
    if (options.up) {
        return Element.graphGL2(f, options);
    }
    // if we get an array or function without parameters, we render c2d or p2d SVG points/lines/circles/etc
    if (!(f instanceof Function) || f.length === 0) {
        // Our current cursor, color, animation state and 2D mapping.
        var lx, ly, lr, color, res, anim = false, to2d = (tot == 3) ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 7, 9, 10, 13, 12, 14, 15];
        // Make sure we have an array of elements. (if its an object, convert to array with elements and names.)
        if (f instanceof Function) {
            f = f();
        }
        if (!(f instanceof Array)) {
            f = [].concat.apply([], Object.keys(f).map((k) => typeof f[k] == 'number' ? [f[k]] : [f[k], k]));
        }
        /**
         * 
         * @param {number} x1 
         * @param {number} y1 
         * @param {number} x2 
         * @param {number} y2 
         * @param {number} strokeWidth 
         * @param {string} color 
         */
        function svg_arrow(x1, y1, x2, y2, strokeWidth, color) {
            var ret = "";
            var headlen = 0.01; // length of head in pixels
            var dx = x2 - x1;
            var dy = y2 - y1;
            //var len = Math.sqrt(dx*dx+dy*dy);
            //headlen = len / 10;
            var angle = Math.atan2(dy, dx);
            ret += svg_line_no_arrow(
                x1,
                y1,
                x2 - headlen * Math.cos(angle - Math.PI / 6),
                y2 - headlen * Math.sin(angle - Math.PI / 6),
                strokeWidth,
                color
            );
            ret += svg_line_no_arrow(
                x2,
                y2,
                x2 - headlen * Math.cos(angle + Math.PI / 6),
                y2 - headlen * Math.sin(angle + Math.PI / 6),
                strokeWidth,
                color
            );
            return ret;
          }
          /**
           * 
           * @param {number} x1 
           * @param {number} y1 
           * @param {number} x2 
           * @param {number} y2 
           * @param {number} strokeWidth 
           * @param {string} color
           */
          function svg_line(x1, y1, x2, y2, strokeWidth, color) {
            var tmp = "";
            tmp += `<LINE style="pointer-events:none" x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke-width="${strokeWidth}" stroke="${color}"/>`;
            tmp += svg_arrow(x1, y1, x2, y2, strokeWidth, color);
            return tmp;
          }
          /**
           * 
           * @param {number} x1 
           * @param {number} y1 
           * @param {number} x2 
           * @param {number} y2 
           * @param {number} strokeWidth 
           * @param {string} color 
           */
          function svg_line_no_arrow(x1, y1, x2, y2, strokeWidth, color) {
            var tmp = "";
            tmp += `<LINE style="pointer-events:none" x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke-width="${strokeWidth}" stroke="${color}"/>`;
            return tmp;
          }
        // The build function generates the actual SVG. It will be called everytime the user interacts or the anim flag is set.
        function build(f, or) {
            var marker_defs = {};
            // Make sure we have an aray.
            if (or && f && f instanceof Function) {
                f = f();
            }
            // Reset position and color for cursor.
            /** @type {number} */
            lx = -2;
            /** @type {number} */
            ly = -1.85;
            /** @type {number} */
            lr = 0;
            /** @type {string} */
            color = '#444';
            // Create the svg element. (master template string till end of function)
            var svg = new DOMParser().parseFromString(`<SVG onmousedown="if(evt.target==this)this.sel=undefined" viewBox="-2 -${2 * (hh / ww || 1)} 4 ${4 * (hh / ww || 1)}" style="width:${ww || 512}px; height:${hh || 512}px; background-color:#eee; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; user-select:none">
            ${// Add a grid (option)
                options.grid ? (() => {
                    var n = Math.floor(10 / options.scale);
                    return n > 50 ? '' : [...Array(2 * n + 1)].map((x, xi) => `<line x1="-10" y1="${((xi - n) / 2 - (tot < 4 ? 2 * options.camera.e02 : 0)) * options.scale}" x2="10" y2="${((xi - n) / 2 - (tot < 4 ? 2 * options.camera.e02 : 0)) * options.scale}" stroke-width="0.005" stroke="#CCC"/><line y1="-10" x1="${((xi - n) / 2 - (tot < 4 ? 2 * options.camera.e01 : 0)) * options.scale}" y2="10" x2="${((xi - n) / 2 - (tot < 4 ? 2 * options.camera.e01 : 0)) * options.scale}"  stroke-width="0.005" stroke="#CCC"/>`).join('');
                })() : ''}
            ${// Handle conformal 2D elements.
                options.conformal ? f.map && f.map((o, oidx) => {
                    // Optional animation handling.
                    if ((o == Element.graph && or !== false) || (oidx == 0 && options.animate && or !== false)) {
                        anim = true;
                        requestAnimationFrame(() => { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; });
                        if (!options.animate)
                            return;
                    }
                    // Resolve expressions passed in.
                    while (o.call) {
                        o = o();
                    }
                    if (options.ipns && o instanceof Element) {
                        o = o.Dual;
                    }
                    var sc = options.scale;
                    var lineWidth = options.lineWidth || 1;
                    var pointRadius = options.pointRadius || 1;
                    var dash_for_r2 = (r2, render_r, target_width) => {
                        // imaginary circles are dotted
                        if (r2 >= 0) {
                            return 'none';
                        }
                        var half_circum = render_r * Math.PI;
                        var width = half_circum / Math.max(Math.round(half_circum / target_width), 1);
                        return `${width} ${width}`;
                    };
                    // Arrays are rendered as segments or polygons. (2 or more elements)
                    if (o instanceof Array) {
                        lx = ly = lr = 0;
                        o = o.map(o => {
                            while (o.call) {
                                o = o();
                            }
                            return o.Scale(-1 / o.Dot(ni).s);
                        });
                        o.forEach((o) => {
                            lx += sc * (o.e1);
                            ly += sc * (-o.e2)
                        });
                        lx /= o.length;
                        ly /= o.length;
                        if (o.length > 2) {
                            return `<POLYGON
                                style="pointer-events:none; fill:${color};opacity:0.7"
                                points="${o.map(o => (sc * o.e1 + ',' + (-o.e2 * sc) + ' '))}"
                            />`;
                        }
                        else {
                            return `<LINE
                                style="pointer-events:none"
                                x1=${o[0].e1 * sc}
                                y1=${-o[0].e2 * sc}
                                x2=${o[1].e1 * sc}
                                y2=${-o[1].e2 * sc}
                                stroke-width="${lineWidth * 0.005}"
                                stroke="${color || '#888'}"
                            />`;
                        }
                    }
                    // Strings are rendered at the current cursor position.
                    if (typeof o == 'string') {
                        var res2 = (o[0] == '_') ? '' : `<text
                            x="${lx}"
                            y="${ly}"
                            font-family="Verdana"
                            font-size="${options.fontSize * 0.1 || 0.1}"
                            style="pointer-events:none"
                            fill="${color || '#333'}"
                            transform="rotate(${lr},${lx},${ly})"
                            >&nbsp;${o}&nbsp;</text>`;
                        ly += 0.14;
                        return res2;
                    }

                    // Numbers change the current color.
                    if (typeof o == 'number') {
                        color = '#' + (o + (1 << 25)).toString(16).slice(-6);
                        return '';
                    };

                    var make_arrow_marker_def = (color) => {
                        if (marker_defs[color]) {
                            return '';
                        }
                        marker_defs[color] = true;
                        return `<defs>
                            <marker id="marker-${color}" orient="auto" markerWidth="10" markerHeight="12" refX="9" refY="6">
                                <path
                                    d="M 1 1 L 9 6 L 1 11"
                                    stroke-width="1"
                                    stroke="${color || '#888'}"
                                    stroke-linecap="round"
                                    fill="none"
                                />
                            </marker>
                        </defs>`;
                    };

                    // All other elements are rendered ..
                    var ni_part = o.Dot(no.Scale(-1));  // O_i + n_o O_oi
                    var no_part = ni.Scale(-1).Dot(o);  // O_o + O_oi n_i
                    if (ni_part.VLength * 1e-6 > no_part.VLength) {
                        // direction or dual - nothing to render
                        return "";
                    }
                    var no_ni_part = no_part.Dot(no.Scale(-1));  // O_oi
                    var no_only_part = ni.Wedge(no_part).Dot(no.Scale(-1));  // O_o

                    /* Note: making 1e-6 smaller increases the maximum circle radius before they are drawn as lines */
                    if (no_ni_part.VLength * 1e-6 > no_only_part.VLength) {
                        var is_flat = true;
                        var direction = no_ni_part;
                    }
                    else {
                        var is_flat = false;
                        var direction = no_only_part;
                    }
                    // normalize to make the direction unitary
                    var dl = direction.Length;
                    o = o.Scale(1 / dl);
                    direction = direction.Scale(1 / dl)

                    var b0 = direction.Grade(0).VLength > 0.001, b1 = direction.Grade(1).VLength > 0.001, b2 = direction.Grade(2).VLength > 0.001;
                    if (!is_flat && b0 && !b1 && !b2) {
                        // Points
                        if (direction.s < 0) {
                            o = Element.Sub(o);
                        }
                        lx = sc * ( o.e1);
                        ly = sc * (-o.e2);
                        lr = 0;
                        return `<CIRCLE
                            onmousedown="this.parentElement.sel=${oidx}"
                            cx="${lx}"
                            cy="${ly}"
                            r="${pointRadius * 0.03}"
                            fill="${color || 'green'}"
                        />`;
                    } else if (is_flat && !b0 && b1 && !b2) {
                        // Lines.
                        var loc = minus_no.LDot(o).Div(o);
                        //var att = ni.Dot(o);
                        lx = sc * (-loc.e1);
                        ly = sc * (loc.e2);
                        lr = Math.atan2(-o[14], o[13]) / Math.PI * 180;
                        return `
                            ${make_arrow_marker_def(color || '#888')}
                            <path
                                style="pointer-events:none"
                                d="M ${[...Array(21)].map((_, i) => i - 10).map(xoff => `${lx + xoff} ${ly}`).join(' L ')}"
                                stroke-width="${lineWidth * 0.005}"
                                stroke="${color || '#888'}"
                                transform="rotate(${lr},${lx},${ly})"
                                marker-mid="url(#marker-${color || '#888'})"
                                fill="none"
                            />`;
                    } else if (!is_flat && !b0 && !b1 && b2) {
                        // Circles
                        var loc = o.Div(ni.LDot(o));
                        lx = sc * (-loc.e1);
                        ly = sc * (loc.e2);
                        var r2 = o.Mul(o.Conjugate).s;
                        var r = Math.sqrt(Math.abs(r2)) * sc;
                        // draw the markers separately, to avoid a chrome rendering bug with <path> (gh-73)
                        return `<CIRCLE
                            onmousedown="this.parentElement.sel=${oidx}"
                            cx="${lx}"
                            cy="${ly}"
                            r="${r}"
                            stroke-width="${lineWidth * 0.005}"
                            fill="none"
                            stroke="${color || 'green'}"
                            stroke-dasharray="${dash_for_r2(r2, r, lineWidth * 0.020)}"
                        />
                        ${make_arrow_marker_def(color || '#888')}
                        <path
                            d="
                                M ${lx - r} ${ly}
                                a ${r} ${r} 0 0 ${+(direction.e12 < 0)} ${2 * r} 0
                                a ${r} ${r} 0 0 ${+(direction.e12 < 0)} ${-2 * r} 0
                            "
                            marker-mid="url(#marker-${color || '#888'})"
                            marker-end="url(#marker-${color || '#888'})"
                            fill="none"
                            stroke="none"
                            stroke-width="${lineWidth * 0.005}"
                        />`;
                    } else if (!is_flat && !b0 && b1 && !b2) {
                        // Test: http://127.0.0.1/ganja.js/examples/coffeeshop.html#cga2d_points_and_circles
                        // Point Pairs.
                        lr = 0;
                        var ei = ni,
                        eo = no,
                        nix = o.Wedge(ei),
                        sqr = o.LDot(o).s / nix.LDot(nix).s,
                        r = Math.sqrt(Math.abs(sqr)),
                        attitude = ((ei.Wedge(eo)).LDot(nix)).Normalized.Mul(Element.Scalar(r)), pos = o.Div(nix); pos = pos.Div(pos.LDot(Element.Sub(ei)));
                        if (nix == 0) {
                            pos = o.Dot(Element.Coeff(4, -1)); sqr = -1;
                        }
                        lx = sc * (pos.e1);
                        ly = sc * (-pos.e2);
                        if (sqr == 0) {
                            return `<CIRCLE
                                onmousedown="this.parentElement.sel=${oidx}"
                                cx="${lx}"
                                cy="${ly}"
                                r="${pointRadius * 0.03}"
                                stroke-width="${lineWidth * 0.01}"
                                fill="none"
                                stroke="${color || 'green'}"
                            />`;
                        }
                        // Draw imaginary pairs hollow
                        var fill;
                        var stroke;
                        // var dash_array = 'none'
                        if (sqr > 0) {
                            fill = color || 'green';
                            stroke = 'none';
                        } else {
                            fill = 'none';
                            stroke = color || 'green';
                        }
                        lx = sc * (pos.e1 + attitude.e1);
                        ly = sc * (-pos.e2 - attitude.e2);
                        var res2 = `<CIRCLE
                            onmousedown="this.parentElement.sel=${oidx}"
                            cx="${lx}"
                            cy="${ly}"
                            r="${pointRadius * 0.03}"
                            fill="${fill}"
                            stroke-width="${lineWidth * 0.01}"
                            stroke="${stroke}"
                            stroke-dasharray="${dash_for_r2(sqr, pointRadius * 0.03, lineWidth * 0.020)}"
                        />`;
                        lx = sc * (pos.e1 - attitude.e1);
                        ly = sc * (-pos.e2 + attitude.e2);
                        return res2 + `<CIRCLE
                            onmousedown="this.parentElement.sel=${oidx}"
                            cx="${lx}"
                            cy="${ly}"
                            r="${pointRadius * 0.03}"
                            fill="${fill}"
                            stroke-width="${lineWidth * 0.01}"
                            stroke="${stroke}"
                            stroke-dasharray="${dash_for_r2(sqr, pointRadius * 0.03, lineWidth * 0.020)}"
                        />`;
                    } else {
                        /* Unrecognized */
                        return "";
                    }
                    // Handle projective 2D and 3D elements.
                }).join('') : f.map && f.map((o, oidx) => {
                    if (
                        (o == Element.graph && or !== false) ||
                        (oidx == 0 && options.animate && or !== false)
                    ) {
                        anim = true;
                        requestAnimationFrame(() => { var r = build(origf, (!res) || (document.body.contains(res))).innerHTML; if (res) res.innerHTML = r; });
                        if (!options.animate)
                        return;
                    }
                    while (o instanceof Function) {
                        o = o();
                    }
                    o = (o instanceof Array) ? o.map(project) : project(o);
                    if (o === undefined) {
                        return;
                    }
                    // line segments and polygons
                    if (o instanceof Array && o.length)
                    {
                        lx = ly = lr = 0;
                        o.forEach((o) => {
                            while (o.call) {
                                o = o();
                            }
                            lx += options.scale * ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * o[drm[2]] / o[drm[1]];
                            ly += options.scale * o[drm[3]] / o[drm[1]]
                        });
                        lx /= o.length;
                        ly /= o.length;
                        if (o.length > 2) {
                            var scaleA = ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * options.scale;
                            var scaleB = options.scale;
                            // Generate something like ["-1,1 ", "-1,-1 ", "1,-1 "]
                            var points = o.map(
                                o => scaleA * o[drm[2]] / o[drm[1]] + ',' + scaleB * o[drm[3]] / o[drm[1]] + ' '
                                );
                            return `<POLYGON
                                style="pointer-events:none; fill:${color};opacity:0.7"
                                points="${points}"
                            />`;
                        } else {
                            var x1 = options.scale * ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * o[0][drm[2]] / o[0][drm[1]];
                            var x2 = options.scale * ((drm[1] == 6 || drm[1] == 14) ? -1 : 1) * o[1][drm[2]] / o[1][drm[1]];
                            var y1 = options.scale * o[0][drm[3]] / o[0][drm[1]];
                            var y2 = options.scale * o[1][drm[3]] / o[1][drm[1]];
                            var strokeWidth = options.lineWidth * 0.005 || 0.005;
                            var color = color || '#888';
                            return svg_line(x1, y1, x2, y2, strokeWidth, color);
                        }
                    }
                    // svg
                    if (typeof o == 'string' && o[0] == '<') {
                        return o;
                    }
                    // Labels
                    if (typeof o == 'string') {
                        var res2 = (o[0] == '_') ? '' : `<text
                            x="${lx}"
                            y="${ly}"
                            font-family="Verdana"
                            font-size="${options.fontSize * 0.1 || 0.1}"
                            style="pointer-events:none"
                            fill="${color || '#333'}"
                            transform="rotate(${lr},0,0)"
                            >&nbsp;${o}&nbsp;</text>`;
                        ly += 0.14;
                        return res2;
                    }
                    // Colors
                    if (typeof o == 'number') {
                        color = '#' + (o + (1 << 25)).toString(16).slice(-6);
                        return '';
                    };
                    // Points
                    if (o[to2d[6]] ** 2 > 0.0001) {
                        lx = options.scale * o[drm[2]] / o[drm[1]];
                        if (drm[1] == 6 || drm[1] == 14)
                            lx *= -1;
                        ly = options.scale * o[drm[3]] / o[drm[1]];
                        lr = 0;
                        var res2 = `<CIRCLE
                            onmousedown="this.parentElement.sel=${oidx}"
                            cx="${lx}"
                            cy="${ly}"
                            r="${options.pointRadius * 0.03 || 0.03}"
                            fill="${color || 'green'}"
                        />`;
                        ly -= 0.05;
                        lx -= 0.1;
                        return res2;
                    }
                    // Lines
                    if (o[to2d[2]] ** 2 + o[to2d[3]] ** 2 > 0.0001) {
                        var l = Math.sqrt(o[to2d[2]] ** 2 + o[to2d[3]] ** 2);
                        o[to2d[2]] /= l;
                        o[to2d[3]] /= l;
                        o[to2d[1]] /= l;
                        lx = 0.5;
                        ly = options.scale * ((drm[1] == 6) ? -1 : -1) * o[to2d[1]];
                        lr = -Math.atan2(o[to2d[2]], o[to2d[3]]) / Math.PI * 180;
                        var res2 = `<LINE
                            style="pointer-events:none"
                            x1=-10
                            y1=${ly}
                            x2=10
                            y2=${ly}
                            stroke-width="${options.lineWidth * 0.005 || 0.005}"
                            stroke="${color || '#888'}"
                            transform="rotate(${lr},0,0)"
                        />`;
                        ly -= 0.05;
                        return res2;
                    }
                    // Vectors
                    if (o[to2d[4]] ** 2 + o[to2d[5]] ** 2 > 0.0001) {
                        lr = 0;
                        ly += 0.05;
                        lx += 0.1;
                        var res2 = `<LINE
                            style="pointer-events:none"
                            x1=${lx}
                            y1=${ly}
                            x2=${lx - o.e02}
                            y2=${ly + o.e01}
                            stroke-width="0.005"
                            stroke="${color || '#888'}"
                        />`;
                        ly = ly + o.e01 / 4 * 3 - 0.05;
                        lx = lx - o.e02 / 4 * 3;
                        return res2;
                    }
                }).join('')}`, 'text/html').body;
            // return the inside of the created svg element.
            return svg.removeChild(svg.firstChild);
        };
        // Create the initial svg and install the mousehandlers.
        res = build(f);
        res.value = f;
        res.options = options;
        res.onmousemove = (e) => {
            if (res.sel === undefined || !e.buttons)
                return;
            var selected = f[res.sel];
            if (typeof selected == "function") {
                console.log("Can't drag function: ", selected);
                res.sel = undefined;
                return;
            }
            var resx = res.getBoundingClientRect().width;
            var resy = res.getBoundingClientRect().height;
            var x = ((e.clientX - res.getBoundingClientRect().left) / (resx / 4 || 128) - 2) * (resx > resy ? resx / resy : 1);
            var y = ((e.clientY - res.getBoundingClientRect().top ) / (resy / 4 || 128) - 2) * (resy > resx ? resy / resx : 1);
            x /= options.scale;
            y /= options.scale;
            if (options.conformal) {
                selected.set(this.Coeff(1, x, 2, -y).Add(no).Add(ni.Scale(0.5 * (x * x + y * y))))
            } else {
                
                selected[drm[2]] = ((drm[1] == 6) ? -x : x) - ((tot < 4) ? 2 * options.camera.e01 : 0);
                selected[drm[3]] = y + ((tot < 4) ? 2 * options.camera.e02 : 0);
                selected[drm[1]] = 1;
                if (selected.set) {
                    selected.set(selected.Normalized);
                }
            }
            if (!anim) {
                var r = build(origf, (!res) || (document.body.contains(res))).innerHTML;
                if (res)
                    res.innerHTML = r;
            }
            res.dispatchEvent(new CustomEvent('input'))
        };
        return res;
    }
    // 1d and 2d functions are rendered on a canvas.
    cvs = cvs || document.createElement('canvas');
    if (ww) {
        cvs.width = ww;
    }
    if (hh) {
        cvs.height = hh;
    }
    var w = cvs.width;
    var h = cvs.height;
    var context = cvs.getContext('2d');
    var data = context.getImageData(0, 0, w, h);
    // two parameter functions .. evaluate for both and set resulting color.
    if (f.length == 2) {
        graph_f2(w, h, data, cvs, f, context);
    // one parameter function.. go over x range, use result as y.
    } else if (f.length == 1) {
        graph_f1(w, h, data, cvs, f, context);
    }
    return context.putImageData(data, 0, 0), cvs;
}
