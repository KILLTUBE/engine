/**
 * 
 * @param {*} f 
 * @param {Options} options 
 * @param {*} Element 
 * @param {*} tot 
 * @param {*} counts 
 */

export default function graphGL(
    f,
    options,
    Element,
    tot,
    counts
) {
    // Create a canvas, webgl2 context and set some default GL options.
    var canvas = document.createElement('canvas'); canvas.style.width = options.width || ''; canvas.style.height = options.height || ''; canvas.style.backgroundColor = '#EEE';
    if (options.width && options.width.match && options.width.match(/px/i)) canvas.width = parseFloat(options.width); if (options.height && options.height.match && options.height.match(/px/i)) canvas.height = parseFloat(options.height);
    /**
     * @type {WebGL2RenderingContext}
     */
    var gl = canvas.getContext('webgl', { alpha: options.alpha || false, antialias: true, preserveDrawingBuffer: options.still || true, powerPreference: 'high-performance' });
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); if (!options.alpha) gl.clearColor(240 / 255, 240 / 255, 240 / 255, 1.0); gl.getExtension("OES_standard_derivatives"); gl.va = gl.getExtension("OES_vertex_array_object");
    // Compile vertex and fragment shader, return program.
    var compile = (vs, fs) => {
        var s = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].map((t, i) => {
            var r = gl.createShader(t); gl.shaderSource(r, [vs, fs][i]); gl.compileShader(r);
            return gl.getShaderParameter(r, gl.COMPILE_STATUS) && r || console.error(gl.getShaderInfoLog(r));
        });
        var p = gl.createProgram(); gl.attachShader(p, s[0]); gl.attachShader(p, s[1]); gl.linkProgram(p);
        gl.getProgramParameter(p, gl.LINK_STATUS) || console.error(gl.getProgramInfoLog(p));
        return p;
    };
    // Create vertex array and buffers, upload vertices and optionally texture coordinates.
    var createVA = function (vtx, texc, idx, clr) {
        var r = gl.va.createVertexArrayOES(); gl.va.bindVertexArrayOES(r);
        var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vtx), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
        if (texc) {
            var b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texc), gl.STATIC_DRAW);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(1);
        }
        if (clr) {
            var b3 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b3);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(clr), gl.STATIC_DRAW);
            gl.vertexAttribPointer(texc ? 2 : 1, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(texc ? 2 : 1);
        }
        if (idx) {
            var b4 = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b4);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
        }
        return { r, b, b2, b4, b3 }
    },
        // Destroy Vertex array and delete buffers.
        destroyVA = function (va) {
            [va.b, va.b2, va.b4, va.b3].forEach(x => { if (x) gl.deleteBuffer(x) }); if (va.r) gl.va.deleteVertexArrayOES(va.r);
        }
    // Default modelview matrix, convert camera to matrix (biquaternion->matrix)
    var M = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 5, 1], mtx = x => {
        var t = options.spin ? performance.now() * options.spin / 1000 : options.h || 0, t2 = options.p || 0;
        var ct = Math.cos(t), st = Math.sin(t), ct2 = Math.cos(t2), st2 = Math.sin(t2), xx = options.posx || 0, y = options.posy || 0, z = options.posz || 0, zoom = options.z || 5;
        if (tot == 5) return [ct, st * -st2, st * ct2, 0, 0, ct2, st2, 0, -st, ct * -st2, ct * ct2, 0, xx * ct + z * -st, y * ct2 + (xx * st + z * ct) * -st2, y * st2 + xx * st + z * ct * ct2 + zoom, 1];
        x = x.Normalized; var y = x.Mul(x.Dual), X = -x.e23, Y = -x.e13, Z = x.e12, W = x.s, m = Array(16);
        var xx = X * X, xy = X * Y, xz = X * Z, xw = X * W, yy = Y * Y, yz = Y * Z, yw = Y * W, zz = Z * Z, zw = Z * W;
        var mtx = [1 - 2 * (yy + zz), 2 * (xy + zw), 2 * (xz - yw), 0, 2 * (xy - zw), 1 - 2 * (xx + zz), 2 * (yz + xw), 0, 2 * (xz + yw), 2 * (yz - xw), 1 - 2 * (xx + yy), 0, -2 * y.e23, -2 * y.e13, 2 * y.e12 + 5, 1];
        var mtx2 = [ct, st * -st2, st * ct2, 0, 0, ct2, st2, 0, -st, ct * -st2, ct * ct2, 0, 0, 0, 0, 1], mtx3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 0; i < 4; ++i) for (var j = 0; j < 4; ++j) for (var k = 0; k < 4; ++k) mtx3[i + k * 4] += mtx[i + j * 4] * mtx2[j + k * 4]; return mtx3;
        return mtx;
    }
    // Render the given vertices. (autocreates/destroys vertex array if not supplied).
    var draw = function (p, tp, vtx, color, color2, ratio, texc, va) {
        gl.useProgram(p); gl.uniformMatrix4fv(gl.getUniformLocation(p, "mv"), false, M);
        gl.uniformMatrix4fv(gl.getUniformLocation(p, "p"), false, [5, 0, 0, 0, 0, 5 * (ratio || 2), 0, 0, 0, 0, 1, 2, 0, 0, -1, 0])
        gl.uniform3fv(gl.getUniformLocation(p, "color"), new Float32Array(color));
        gl.uniform3fv(gl.getUniformLocation(p, "color2"), new Float32Array(color2));
        if (texc) gl.uniform1i(gl.getUniformLocation(p, "texc"), 0);
        var v; if (!va) v = createVA(vtx, texc); else gl.va.bindVertexArrayOES(va.r);
        if (va && va.b4) {
            gl.drawElements(tp, va.tcount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(tp, 0, (va && va.tcount) || vtx.length / 3);
        }
        if (v) destroyVA(v);
    }
    // Program for the geometry. Derivative based normals. Basic lambert shading.
    var program = compile(`attribute vec4 position; varying vec4 Pos; uniform mat4 mv; uniform mat4 p;
                void main() { gl_PointSize=12.0; Pos=mv*position; gl_Position = p*Pos; }`,
        `#extension GL_OES_standard_derivatives : enable
                precision highp float; uniform vec3 color; uniform vec3 color2; varying vec4 Pos;
                void main() { vec3 ldir = normalize(Pos.xyz - vec3(2.0,2.0,-4.0));
                vec3 normal = normalize(cross(dFdx(Pos.xyz), dFdy(Pos.xyz))); float l=dot(normal,ldir);
                vec3 E = normalize(-Pos.xyz); vec3 R = normalize(reflect(ldir,normal));
                gl_FragColor = vec4(max(0.0,l)*color+vec3(0.5*pow(max(dot(R,E),0.0),20.0))+color2, 1.0);  }`);
    var programPoint = compile(`attribute vec4 position; varying vec4 Pos; uniform mat4 mv; uniform mat4 p;
                void main() { gl_PointSize=${((options.pointRadius || 1) * 8.0).toFixed(2)}; Pos=mv*position; gl_Position = p*Pos; }`,
        `precision highp float; uniform vec3 color; uniform vec3 color2; varying vec4 Pos;
                void main() {  float distanceToCenter = length(gl_PointCoord - vec2(0.5)); if (distanceToCenter>0.5) discard; 
                gl_FragColor = vec4(color+color2, (distanceToCenter<0.5?1.0:0.0));  }`);
    var programcol = compile(`attribute vec4 position; attribute vec3 col; varying vec3 Col; varying vec4 Pos; uniform mat4 mv; uniform mat4 p;
                void main() { gl_PointSize=6.0; Pos=mv*position; gl_Position = p*Pos; Col=col; }`,
        `#extension GL_OES_standard_derivatives : enable
                precision highp float; uniform vec3 color; uniform vec3 color2; varying vec4 Pos; varying vec3 Col;
                void main() { vec3 ldir = normalize(Pos.xyz - vec3(1.0,1.0,2.0));
                vec3 normal = normalize(cross(dFdx(Pos.xyz), dFdy(Pos.xyz))); float l=dot(normal,ldir);
                vec3 E = normalize(-Pos.xyz); vec3 R = normalize(reflect(ldir,normal));
                gl_FragColor = vec4(max(0.3,l)*Col+vec3(pow(max(dot(R,E),0.0),20.0))+color2, 1.0); ${options.shader || ''}  }`);
    var programmot = compile(`attribute vec4 position; attribute vec2 texc; attribute vec3 col; varying vec3 Col; varying vec4 Pos; uniform mat4 mv; uniform mat4 p; uniform vec3 color2;
                void main() { gl_PointSize=2.0; float blend=fract(color2.x+texc.r)*0.5; Pos=mv*(position*(1.0-blend) + (blend)*vec4(col,1.0)); gl_Position = p*Pos; Col=vec3(length(col-position.xyz)*1.); gl_PointSize = 8.0 -  Col.x; Col.y=sin(blend*2.*3.1415); }`,
        `precision highp float; uniform vec3 color; uniform vec3 color2; varying vec4 Pos; varying vec3 Col; 
                void main() {  float distanceToCenter = length(gl_PointCoord - vec2(0.5));gl_FragColor = vec4(1.0-pow(Col.x,2.0),0.0,0.0,(.6-Col.x*0.05)*(distanceToCenter<0.5?1.0:0.0)*Col.y);  }`);
    gl.lineWidth(options.lineWidth || 1); // doesn't work yet (nobody supports it)
    // Create a font texture, lucida console or otherwise monospaced.
    var fw = 33, font = Object.assign(document.createElement('canvas'), { width: (19 + 94) * fw, height: 48 }),
        ctx = Object.assign(font.getContext('2d'), { font: 'bold 48px lucida console, monospace' }),
        ftx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ftx);
    for (var i = 33; i < 127; i++) ctx.fillText(String.fromCharCode(i), (i - 33) * fw, 40);
    var specialChars = "∞≅¹²³₀₁₂₃₄₅₆₇₈₉⋀⋁∆⋅"; specialChars.split('').forEach((x, i) => ctx.fillText(x, (i - 33 + 127) * fw, 40));
    // 2.0 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,94*fw,32,0,gl.RGBA,gl.UNSIGNED_BYTE,font);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, font);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Font rendering program. Renders billboarded fonts, transforms offset passed as color2.
    var program2 = compile(`attribute vec4 position; attribute vec2 texc; varying vec2 tex; varying vec4 Pos; uniform mat4 mv; uniform mat4 p; uniform vec3 color2;
                void main() { tex=texc; gl_PointSize=6.0; vec4 o=mv*vec4(color2,0.0); Pos=(-1.0/(o.z-mv[3][2]))*position+vec4(mv[3][0],mv[3][1],mv[3][2],0.0)+o; gl_Position = p*Pos; }`,
        `precision highp float; uniform vec3 color; varying vec4 Pos; varying vec2 tex;
                uniform sampler2D texm; void main() { vec4 c = texture2D(texm,tex); if (c.a<0.01) discard; gl_FragColor = vec4(color,c.a);}`);
    // Conformal space needs a bit extra magic to extract euclidean parametric representations.
    if (tot == 5 && options.conformal) var ni = Element.Coeff(4, 1).Add(Element.Coeff(5, 1)), no = Element.Coeff(4, 0.5).Sub(Element.Coeff(5, 0.5));
    var interprete = (x) => {
        if (!(x instanceof Element)) return { tp: 0 };
        if (options.ipns) x = x.Dual;
        // tp = { 0:unknown 1:point 2:line, 3:plane, 4:circle, 5:sphere
        var X2 = (x.Mul(x)).s, tp = 0, weight2, opnix = ni.Wedge(x), ipnix = ni.LDot(x),
            attitude, pos, normal, tg, btg, epsilon = 0.000001 / (options.scale || 1), I3 = Element.Coeff(16, -1);
        var x2zero = Math.abs(X2) < epsilon, ipnixzero = ipnix.VLength < epsilon, opnixzero = opnix.VLength < epsilon;
        if (opnixzero && ipnixzero) {                 // free flat
        } else if (opnixzero && !ipnixzero) {         // bound flat (lines)
            attitude = no.Wedge(ni).LDot(x);
            weight2 = Math.abs(attitude.LDot(attitude).s) ** .5;
            pos = attitude.LDot(x.Reverse); //Inverse);
            pos = [-pos.e15 / pos.e45, -pos.e25 / pos.e45, -pos.e34 / pos.e45];
            if (x.Grade(3).VLength) {
                normal = [attitude.e1 / weight2, attitude.e2 / weight2, attitude.e3 / weight2]; tp = 2;
            } else if (x.Grade(2).VLength) { // point pair with ni
                tp = 1;
            } else {
                normal = Element.LDot(Element.Mul(attitude, 1 / weight2), I3).Normalized;
                var r = normal.Mul(Element.Coeff(3, 1)); if (r[0] == -1) r[0] = 1; else { r[0] += 1; r = r.Normalized; }
                tg = [...r.Mul(Element.Coeff(1, 1)).Mul(r.Conjugate)].slice(1, 4);
                btg = [...r.Mul(Element.Coeff(2, 1)).Mul(r.Conjugate)].slice(1, 4);
                normal = [...normal.slice(1, 4)]; tp = 3;
            }
        } else if (!opnixzero && ipnixzero) {         // dual bound flat
        } else if (x2zero) {                          // bound vec,biv,tri (points)
            if (options.ipns) x = x.Dual;
            attitude = ni.Wedge(no).LDot(ni.Wedge(x));
            pos = [...(Element.LDot(1 / (ni.LDot(x)).s, x)).slice(1, 4)].map(x => -x);
            tp = 1;
        } else if (!x2zero) {                          // round (point pair,circle,sphere)
            tp = x.Grade(3).VLength ? 4 : x.Grade(2).VLength ? 6 : 5;
            var nix = ni.Wedge(x), nix2 = (nix.Mul(nix)).s;
            attitude = ni.Wedge(no).LDot(nix);
            pos = [...(x.Mul(ni).Mul(x)).slice(1, 4)].map(x => -x / (2.0 * nix2));
            weight2 = Math.abs((x.LDot(x)).s / nix2) ** .5;
            if (tp == 4) {
                if (x.LDot(x).s < 0) { weight2 = -weight2; }
                normal = Element.LDot(Element.Mul(attitude, 1 / weight2), I3).Normalized;
                var r = normal.Mul(Element.Coeff(3, 1)); if (r[0] == -1) r[0] = 1; else { r[0] += 1; r = r.Normalized; }
                tg = [...r.Mul(Element.Coeff(1, 1)).Mul(r.Conjugate)].slice(1, 4);
                btg = [...r.Mul(Element.Coeff(2, 1)).Mul(r.Conjugate)].slice(1, 4);
                normal = [...normal.slice(1, 4)];
            } else if (tp == 6) {
                weight2 = (x.LDot(x).s < 0) ? -(weight2) : weight2;
                normal = Element.Mul(attitude.Normalized, weight2).slice(1, 4);
            } else {
                normal = [...((Element.LDot(Element.Mul(attitude, 1 / weight2), I3)).Normalized).slice(1, 4)];
            }
        }
        return { tp, pos: pos ? pos.map(x => x * (options.scale || 1)) : [0, 0, 0], normal, tg, btg, weight2: weight2 * (options.scale || 1) }
    };
    // canvas update will (re)render the content.
    var armed = 0, sphere, e14 = Element.Coeff(14, 1);
    canvas.update = (x) => {
        // restore from still..
        if (options && !options.still && canvas.im && canvas.im.parentElement) { canvas.im.parentElement.insertBefore(canvas, canvas.im); canvas.im.parentElement.removeChild(canvas.im); }
        // Start by updating canvas size if needed and viewport.
        var s = getComputedStyle(canvas); if (s.width) { canvas.width = parseFloat(s.width) * (options.devicePixelRatio || 1); canvas.height = parseFloat(s.height) * (options.devicePixelRatio || 1); }
        gl.viewport(0, 0, canvas.width | 0, canvas.height | 0); var r = canvas.width / canvas.height;
        // Defaults, resolve function input
        var a, p = [], l = [], t = [], c = [.5, .5, .5], alpha = 0, lastpos = [-2, 2, 0.2]; gl.clear(gl.COLOR_BUFFER_BIT + gl.DEPTH_BUFFER_BIT); while (x.call) x = x();
        // Create default camera matrix and initial lastposition (contra-compensated for camera)
        M = mtx(options.camera); lastpos = options.camera.Normalized.Conjugate.Mul(((a = new this()).set(lastpos, 11), a)).Mul(options.camera.Normalized).slice(11, 14);
        // Grid.
        if (options.grid) {
            if (!options.gridLines) {
                options.gridLines = [[], [], []]; for (var i = -5; i <= 5; i++) {
                    options.gridLines[0].push(i, 0, 5, i, 0, -5, 5, 0, i, -5, 0, i); options.gridLines[1].push(i, 5, 0, i, -5, 0, 5, i, 0, -5, i, 0); options.gridLines[2].push(0, i, 5, 0, i, -5, 0, 5, i, 0, -5, i);
                }
            }
            gl.depthMask(false);
            draw(program, gl.LINES, options.gridLines[0], [0, 0, 0], [.6, 1, .6], r); draw(program, gl.LINES, options.gridLines[1], [0, 0, 0], [1, .8, .8], r); draw(program, gl.LINES, options.gridLines[2], [0, 0, 0], [.8, .8, 1], r);
            gl.depthMask(true);
        }
        // Z-buffer override.
        if (options.noZ) gl.depthMask(false);
        // Loop over all items to render.
        for (var i = 0, ll = x.length; i < ll; i++) {
            var e = x[i]; while (e && e.call && e.length == 0) e = e(); if (e == undefined) continue;
            // CGA
            if (tot == 5 && options.conformal) {
                if (e instanceof Array && e.length == 2) { e.forEach(x => { while (x.call) x = x.call(); x = interprete(x); l.push.apply(l, x.pos); }); var d = { tp: -1 }; }
                else if (e instanceof Array && e.length == 3) { e.forEach(x => { while (x.call) x = x.call(); x = interprete(x); t.push.apply(t, x.pos); }); var d = { tp: -1 }; }
                else var d = interprete(e);
                if (d.tp) lastpos = d.pos;
                if (d.tp == 1) p.push.apply(p, d.pos);
                if (d.tp == 2) { l.push.apply(l, d.pos.map((x, i) => x - d.normal[i] * 10)); l.push.apply(l, d.pos.map((x, i) => x + d.normal[i] * 10)); }
                if (d.tp == 3) {
                    t.push.apply(t, d.pos.map((x, i) => x + d.tg[i] + d.btg[i])); t.push.apply(t, d.pos.map((x, i) => x - d.tg[i] + d.btg[i])); t.push.apply(t, d.pos.map((x, i) => x + d.tg[i] - d.btg[i]));
                    t.push.apply(t, d.pos.map((x, i) => x - d.tg[i] + d.btg[i])); t.push.apply(t, d.pos.map((x, i) => x + d.tg[i] - d.btg[i])); t.push.apply(t, d.pos.map((x, i) => x - d.tg[i] - d.btg[i]));
                }
                if (d.tp == 4) {
                    var ne = 0, la = 0;
                    if (d.weight2 < 0) { c[0] = 1; c[1] = 0; c[2] = 0; }
                    for (var j = 0; j < 65; j++) {
                        ne = d.pos.map((x, i) => x + Math.cos(j / 32 * Math.PI) * d.weight2 * d.tg[i] + Math.sin(j / 32 * Math.PI) * d.weight2 * d.btg[i]); if (ne && la && (d.weight2 > 0 || j % 2 == 0)) { l.push.apply(l, la); l.push.apply(l, ne); }; la = ne;
                    }
                }
                if (d.tp == 6) {
                    if (d.weight2 < 0) { c[0] = 1; c[1] = 0; c[2] = 0; }
                    if (options.useUnnaturalLineDisplayForPointPairs) {
                        l.push.apply(l, d.pos.map((x, i) => x - d.normal[i] * (options.scale || 1)));
                        l.push.apply(l, d.pos.map((x, i) => x + d.normal[i] * (options.scale || 1)));
                    }
                    p.push.apply(p, d.pos.map((x, i) => x - d.normal[i] * (options.scale || 1)));
                    p.push.apply(p, d.pos.map((x, i) => x + d.normal[i] * (options.scale || 1)));
                }
                if (d.tp == 5) {
                    if (!sphere) {
                        var pnts = [], tris = [], S = Math.sin, C = Math.cos, pi = Math.PI, W = 96, H = 48;
                        for (var j = 0; j < W + 1; j++) for (var k = 0; k < H; k++) {
                            pnts.push([S(2 * pi * j / W) * S(pi * k / (H - 1)), C(2 * pi * j / W) * S(pi * k / (H - 1)), C(pi * k / (H - 1))]);
                            if (j && k) {
                                tris.push.apply(tris, pnts[(j - 1) * H + k - 1]); tris.push.apply(tris, pnts[(j - 1) * H + k]); tris.push.apply(tris, pnts[j * H + k - 1]);
                                tris.push.apply(tris, pnts[j * H + k - 1]); tris.push.apply(tris, pnts[(j - 1) * H + k]); tris.push.apply(tris, pnts[j * H + k]);
                            }
                        }
                        sphere = { va: createVA(tris, undefined) }; sphere.va.tcount = tris.length / 3;
                    }
                    var oldM = M;
                    M = [].concat.apply([], Element.Mul([[d.weight2, 0, 0, 0], [0, d.weight2, 0, 0], [0, 0, d.weight2, 0], [d.pos[0], d.pos[1], d.pos[2], 1]], [[M[0], M[1], M[2], M[3]], [M[4], M[5], M[6], M[7]], [M[8], M[9], M[10], M[11]], [M[12], M[13], M[14], M[15]]])).map(x => x.s);
                    gl.enable(gl.BLEND); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); gl.blendColor(1, 1, 1, 0.5); gl.enable(gl.CULL_FACE)
                    draw(program, gl.TRIANGLES, undefined, c, [0, 0, 0], r, undefined, sphere.va);
                    gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
                    M = oldM;
                }
                if (i == ll - 1 || d.tp == 0) {
                    // render triangles, lines, points.
                    if (alpha) { gl.enable(gl.BLEND); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); gl.blendColor(1, 1, 1, 1 - alpha); }
                    if (t.length) { draw(program, gl.TRIANGLES, t, c, [0, 0, 0], r); t.forEach((x, i) => { if (i % 9 == 0) lastpos = [0, 0, 0]; lastpos[i % 3] += x / 3; }); t = []; }
                    if (l.length) { draw(program, gl.LINES, l, [0, 0, 0], c, r); var l2 = l.length - 1; lastpos = [(l[l2 - 2] + l[l2 - 5]) / 2, (l[l2 - 1] + l[l2 - 4]) / 2 + 0.1, (l[l2] + l[l2 - 3]) / 2]; l = []; }
                    if (p.length) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); draw(programPoint, gl.POINTS, p, [0, 0, 0], c, r); lastpos = p.slice(-3); lastpos[0] -= 0.075; lastpos[1] += 0.075; p = []; gl.disable(gl.BLEND); }
                    // Motor orbits
                    if (e.call && e.length == 2 && !e.va3) {
                        var countx = e.dx || 32, county = e.dy || 32;
                        var temp = new Float32Array(3 * countx * county), o = new Float32Array(3), et = [];
                        for (var pp = 0, ii = 0; ii < countx; ii++) for (var jj = 0; jj < county; jj++, pp += 3)
                            temp.set(Element.sw(e(ii / (countx - 1), jj / (county - 1)), no).slice(1, 4), pp);
                        for (ii = 0; ii < countx - 1; ii++) for (var jj = 0; jj < county; jj++)
                            et.push((ii + 0) * county + (jj + 0), (ii + 0) * county + (jj + 1), (ii + 1) * county + (jj + 1), (ii + 0) * county + (jj + 0), (ii + 1) * county + (jj + 1), (ii + 1) * county + (jj + 0));
                        e.va3 = createVA(temp, undefined, et.map(x => x % (countx * county))); e.va3.tcount = (countx - 1) * county * 2 * 3;
                    }
                    if (e.call && e.length == 1 && !e.va2) {
                        var countx = e.dx || 256;
                        var temp = new Float32Array(3 * countx), o = new Float32Array(3), et = [];
                        for (var ii = 0; ii < countx; ii++) { temp.set(Element.sw(e(ii / (countx - 1)), no).slice(1, 4), ii * 3); if (ii) et.push(ii - 1, ii); }
                        e.va2 = createVA(temp, undefined, et); e.va2.tcount = et.length;
                    }
                    // Experimental display of motors using particle systems.
                    if (e instanceof Object && e.motor) {
                        if (!e.va || e.recalc) {
                            var seed = 1; function random() { var x = Math.sin(seed++) * 10000; return x - Math.floor(x); }
                            e.xRange = e.xRange === undefined ? 1 : e.xRange; e.yRange = e.yRange === undefined ? 1 : e.yRange; e.zRange = e.zRange === undefined ? 1 : e.zRange;
                            var vtx = [], tx = [], vtx2 = [];
                            for (var i = 0; i < (e.zRange * e.xRange * e.yRange === 0 ? 2500 : Math.pow(e.zRange * e.xRange * e.yRange, 1 / 3) * 6000); i++) {
                                var [x, y, z] = [random() * (2 * e.xRange) - e.xRange, random() * 2 * e.yRange - e.yRange, random() * 2 * e.zRange - e.zRange];
                                var xyz = (x * x + y * y + z * z) * 0.5;
                                var p = Element.Vector(x, y, z, xyz - 0.5, xyz + 0.5);
                                var p2 = Element.sw(e.motor, p);
                                var d = p2[5] - p2[4]; p2[1] /= d; p2[2] /= d; p2[3] /= d;
                                tx.push(random(), random());
                                vtx.push(...p.slice(1, 4)); vtx2.push(...p2.slice(1, 4));
                            }
                            e.va = createVA(vtx, tx, undefined, vtx2); e.va.tcount = vtx.length / 3;
                            e.recalc = false;
                        }
                        var time = performance.now() / 1000;
                        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
                        draw(programmot, gl.POINTS, t, c, [time % 1, 0, 0], r, undefined, e.va);
                        gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST);
                    }
                    // we could also be an object with cached vertex array of triangles ..
                    else if (e.va || e.va2 || e.va3 || (e instanceof Object && e.data)) {
                        // Create the vertex array and store it for re-use.
                        if (!e.va3 && !e.va2) {
                            var et = [], et2 = [], et3 = [], lc = 0, pc = 0, tc = 0; e.data.forEach(e => {
                                if (e instanceof Array && e.length == 3) { tc++; e.forEach(x => { while (x.call) x = x.call(); x = interprete(x); et3.push.apply(et3, x.pos); }); var d = { tp: -1 }; }
                                else {
                                    var d = interprete(e);
                                    if (d.tp == 1) { pc++; et.push(...d.pos); }
                                    if (d.tp == 2) { lc++; et2.push(...d.pos.map((x, i) => x - d.normal[i] * 10), ...d.pos.map((x, i) => x + d.normal[i] * 10)); }
                                }
                            });
                            e.va = createVA(et, undefined); e.va.tcount = pc;
                            e.va2 = createVA(et2, undefined); e.va2.tcount = lc * 2;
                            e.va3 = createVA(et3, undefined); e.va3.tcount = tc * 3;
                        }
                        // render the vertex array.
                        if (e.va && e.va.tcount) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); draw(programPoint, gl.POINTS, undefined, [0, 0, 0], c, r, undefined, e.va); gl.disable(gl.BLEND); };
                        if (e.va2 && e.va2.tcount) draw(program, gl.LINES, undefined, [0, 0, 0], c, r, undefined, e.va2);
                        if (e.va3 && e.va3.tcount) draw(program, gl.TRIANGLES, undefined, c, [0, 0, 0], r, undefined, e.va3);
                    }
                    if (alpha) gl.disable(gl.BLEND); // no alpha for text printing.
                    // setup a new color
                    if (typeof e == "number") { alpha = ((e >>> 24) & 0xff) / 255; c[0] = ((e >>> 16) & 0xff) / 255; c[1] = ((e >>> 8) & 0xff) / 255; c[2] = (e & 0xff) / 255; }
                    if (typeof (e) == 'string') {
                        if (options.htmlText) {
                            if (!x['_' + i]) { console.log('creating div'); Object.defineProperty(x, '_' + i, { value: document.body.appendChild(document.createElement('div')), enumerable: false }) };
                            var rc = canvas.getBoundingClientRect(), div = x['_' + i];
                            var pos2 = Element.Mul([[M[0], M[4], M[8], M[12]], [M[1], M[5], M[9], M[13]], [M[2], M[6], M[10], M[14]], [M[3], M[7], M[11], M[15]]], [...lastpos, 1]).map(x => x.s);
                            pos2 = Element.Mul([[5, 0, 0, 0], [0, 5 * (r || 2), 0, 0], [0, 0, 1, -1], [0, 0, 2, 0]], pos2).map(x => x.s).map((x, i, a) => x / a[3]);
                            Object.assign(div.style, { position: 'fixed', pointerEvents: 'none', left: rc.left + (rc.right - rc.left) * (pos2[0] / 2 + 0.5), top: rc.top + (rc.bottom - rc.top) * (-pos2[1] / 2 + 0.5) - 20 });
                            if (div.last != e) { div.innerHTML = e; div.last = e; if (self.renderMathInElement) self.renderMathInElement(div); }
                        } else {
                            gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                            var fw = 113, mapChar = (x) => { var c = x.charCodeAt(0) - 33; if (c >= 94) c = 94 + specialChars.indexOf(x); return c / fw; }
                            draw(program2, gl.TRIANGLES,
                                [...Array(e.length * 6 * 3)].map((x, i) => { var x = 0, z = -0.2, o = x + (i / 18 | 0) * 1.1; return (0.05 * (options.z || 5)) * [o, -1, z, o + 1.2, -1, z, o, 1, z, o + 1.2, -1, z, o + 1.2, 1, z, o, 1, z][i % 18] }), c, lastpos, r,
                                [...Array(e.length * 6 * 2)].map((x, i) => { var o = mapChar(e[i / 12 | 0]); return [o, 1, o + 1 / fw, 1, o, 0, o + 1 / fw, 1, o + 1 / fw, 0, o, 0][i % 12] })); gl.disable(gl.BLEND); lastpos[1] -= 0.18;
                        }
                    }
                }
                continue;
            }
            // PGA
            if (options.dual && e instanceof Element) e = e.Dual;
            // Convert planes to polygons.
            if (e instanceof Element && e.Grade(1).Length) {
                var m = Element.Add(1, Element.Mul(e.Normalized, Element.Coeff(3, 1))).Normalized, e0 = 0;
                e = Element.sw(m, [[-1, -1], [-1, 1], [1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z]) => Element.Trivector(x, e0, z, 1)));
            }
            // Convert lines to line segments.
            if (e instanceof Element && e.Grade(2).Length)
                e = [e.LDot(e14).Wedge(e).Add(e.Wedge(Element.Coeff(1, 1)).Mul(Element.Coeff(0, -500))), e.LDot(e14).Wedge(e).Add(e.Wedge(Element.Coeff(1, 1)).Mul(Element.Coeff(0, 500)))];
            // If euclidean point, store as point, store line segments and triangles.
            if (e.e123) p.push.apply(p, e.slice(11, 14).map((y, i) => (i == 0 ? 1 : -1) * y / e[14]).reverse());
            if (e instanceof Array && e.length == 2) l = l.concat.apply(l, e.map(x => [...x.slice(11, 14).map((y, i) => (i == 0 ? 1 : -1) * y / x[14]).reverse()]));
            if (e instanceof Array && e.length % 3 == 0) t = t.concat.apply(t, e.map(x => [...x.slice(11, 14).map((y, i) => (i == 0 ? 1 : -1) * y / x[14]).reverse()]));
            // Render orbits of parametrised motors, as well as lists of points.. 
            function sw_mot_orig(A, R) {
                var a0 = A[0], a1 = A[5], a2 = A[6], a3 = A[7], a4 = A[8], a5 = A[9], a6 = A[10], a7 = A[15];
                R[2] = -2 * (a0 * a3 + a4 * a7 - a6 * a2 - a5 * a1);
                R[1] = -2 * (a4 * a1 - a0 * a2 - a6 * a3 + a5 * a7);
                R[0] = 2 * (a0 * a1 + a4 * a2 + a5 * a3 + a6 * a7);
                return R
            }
            if (e.call && e.length == 1) {
                var count = e.dx || 64;
                for (var ismot, xx, o = new Float32Array(3), ii = 0; ii < count; ii++) {
                    if (ii > 1) l.push(xx[0], xx[1], xx[2]);
                    var m = e(ii / (count - 1));
                    if (ii == 0) ismot = m[0] || m[5] || m[6] || m[7] || m[8] || m[9] || m[10];
                    xx = ismot ? sw_mot_orig(m, o) : m.slice(11, 14).map((y, i) => (i == 0 ? 1 : -1) * y).reverse(); //Element.sw(e(ii/(count-1)),o);
                    l.push(xx[0], xx[1], xx[2]);
                }
            }
            if (e.call && e.length == 2 && !e.va) {
                var countx = e.dx || 64, county = e.dy || 32;
                var temp = new Float32Array(3 * countx * county), o = new Float32Array(3), et = [];
                for (var pp = 0, ii = 0; ii < countx; ii++) for (var jj = 0; jj < county; jj++, pp += 3) temp.set(sw_mot_orig(e(ii / (countx - 1), jj / (county - 1)), o), pp);
                for (ii = 0; ii < countx - 1; ii++) for (var jj = 0; jj < county; jj++) et.push((ii + 0) * county + (jj + 0), (ii + 0) * county + (jj + 1), (ii + 1) * county + (jj + 1), (ii + 0) * county + (jj + 0), (ii + 1) * county + (jj + 1), (ii + 1) * county + (jj + 0));
                e.va = createVA(temp, undefined, et.map(x => x % (countx * county))); e.va.tcount = (countx - 1) * county * 2 * 3;
            }
            // Experimental display of motors using particle systems.
            if (e instanceof Object && e.motor) {
                if (!e.va || e.recalc) {
                    var seed = 1; function random() { var x = Math.sin(seed++) * 10000; return x - Math.floor(x); }
                    e.xRange = e.xRange === undefined ? 1 : e.xRange; e.yRange = e.yRange === undefined ? 1 : e.yRange; e.zRange = e.zRange === undefined ? 1 : e.zRange;
                    var vtx = [], tx = [], vtx2 = [];
                    for (var i = 0; i < (e.zRange === 0 ? 5000 : 60000); i++) {
                        var p = Element.Trivector(random() * (2 * e.xRange) - e.xRange, random() * 2 * e.yRange - e.yRange, random() * 2 * e.zRange - e.zRange, 1);
                        //                   var p2 = Element.sw(e.motor,p);
                        var p2 = e.motor.Mul(p).Mul(e.motor.Inverse);
                        tx.push(random(), random());
                        vtx.push(...p.slice(11, 14).reverse()); vtx2.push(...p2.slice(11, 14).reverse());
                    }
                    e.va = createVA(vtx, tx, undefined, vtx2); e.va.tcount = vtx.length / 3;
                    e.recalc = false;
                }
                var time = performance.now() / 1000;
                gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
                draw(programmot, gl.POINTS, t, c, [time % 1, 0, 0], r, undefined, e.va);
                gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST);
            }
            // we could also be an object with cached vertex array of triangles ..
            else if (e.va || (e instanceof Object && e.data)) {
                // Create the vertex array and store it for re-use.
                if (!e.va) {
                    if (e.idx) {
                        var et = e.data.map(x => [...x.slice(11, 14).map((y, i) => (i == 0 ? 1 : -1) * y / x[14]).reverse()]).flat();
                    } else {
                        var et = []; e.data.forEach(e => { if (e instanceof Array && e.length == 3) et = et.concat.apply(et, e.map(x => [...x.slice(11, 14).map((y, i) => (i == 0 ? 1 : -1) * y / x[14]).reverse()])); });
                    }
                    e.va = createVA(et, undefined, e.idx, e.color ? new Float32Array(e.color) : undefined); e.va.tcount = (e.idx && e.idx.length) ? e.idx.length : e.data.length * 3;
                }
                // render the vertex array.
                if (e.transform) { M = mtx(options.camera.Mul(e.transform)); }
                if (alpha) { gl.enable(gl.BLEND); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); gl.blendColor(1, 1, 1, 1 - alpha); }
                draw(e.color ? programcol : program, gl.TRIANGLES, t, c, [0, 0, 0], r, undefined, e.va);
                if (alpha) gl.disable(gl.BLEND);
                if (e.transform) { M = mtx(options.camera); }
            }
            // if we're a number (color), label or the last item, we output the collected items.
            else if (typeof e == 'number' || i == ll - 1 || typeof e == 'string') {
                // render triangles, lines, points.
                if (alpha) { gl.enable(gl.BLEND); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); gl.blendColor(1, 1, 1, 1 - alpha); }
                if (t.length) { draw(program, gl.TRIANGLES, t, c, [0, 0, 0], r); t.forEach((x, i) => { if (i % 9 == 0) lastpos = [0, 0, 0]; lastpos[i % 3] += x / 3; }); t = []; }
                if (l.length) { draw(program, gl.LINES, l, [0, 0, 0], c, r); var l2 = l.length - 1; lastpos = [(l[l2 - 2] + l[l2 - 5]) / 2, (l[l2 - 1] + l[l2 - 4]) / 2 + 0.1, (l[l2] + l[l2 - 3]) / 2]; l = []; }
                if (p.length) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); draw(programPoint, gl.POINTS, p, [0, 0, 0], c, r); lastpos = p.slice(-3); lastpos[0] -= 0.075; lastpos[1] += 0.075; p = []; gl.disable(gl.BLEND); }
                if (alpha) gl.disable(gl.BLEND);
                // setup a new color
                if (typeof e == "number") { alpha = ((e >>> 24) & 0xff) / 255; c[0] = ((e >>> 16) & 0xff) / 255; c[1] = ((e >>> 8) & 0xff) / 255; c[2] = (e & 0xff) / 255; }
                // render a label
                if (typeof (e) == 'string') {
                    if (options.htmlText) {
                        if (!canvas['_' + i]) { console.log('creating div'); Object.defineProperty(canvas, '_' + i, { value: document.body.appendChild(document.createElement('div')), enumerable: false }) };
                        var rc = canvas.getBoundingClientRect(), div = canvas['_' + i];
                        var pos2 = Element.Mul([[M[0], M[4], M[8], M[12]], [M[1], M[5], M[9], M[13]], [M[2], M[6], M[10], M[14]], [M[3], M[7], M[11], M[15]]], [...lastpos, 1]).map(x => x.s);
                        pos2 = Element.Mul([[5, 0, 0, 0], [0, 5 * (r || 2), 0, 0], [0, 0, 1, -1], [0, 0, 2, 0]], pos2).map(x => x.s).map((x, i, a) => x / a[3]);
                        Object.assign(div.style, { position: 'fixed', pointerEvents: 'none', left: rc.left + (rc.right - rc.left) * (pos2[0] / 2 + 0.5), top: rc.top + (rc.bottom - rc.top) * (-pos2[1] / 2 + 0.5) - 20 });
                        if (div.last != e) { div.innerHTML = e; div.last = e; if (self.renderMathInElement) self.renderMathInElement(div, { output: 'html' }); }
                    } else {
                        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                        var fw = 113, mapChar = (x) => { var c = x.charCodeAt(0) - 33; if (c >= 94) c = 94 + specialChars.indexOf(x); return c / fw; }
                        draw(program2, gl.TRIANGLES,
                            [...Array(e.length * 6 * 3)].map((x, i) => { var x = 0, z = -0.2, o = x + (i / 18 | 0) * 1.1; return 0.25 * [o, -1, z, o + 1.2, -1, z, o, 1, z, o + 1.2, -1, z, o + 1.2, 1, z, o, 1, z][i % 18] }), c, lastpos, r,
                            [...Array(e.length * 6 * 2)].map((x, i) => { var o = mapChar(e[i / 12 | 0]); return [o, 1, o + 1 / fw, 1, o, 0, o + 1 / fw, 1, o + 1 / fw, 0, o, 0][i % 12] })); gl.disable(gl.BLEND); lastpos[1] -= 0.18;
                    }
                }
            }
        };
        // if we're no longer in the page .. stop doing the work.
        armed++; if (document.body.contains(canvas)) armed = 0; if (armed == 2) return;
        canvas.value = x; if (options && !options.animate) canvas.dispatchEvent(new CustomEvent('input')); canvas.options = options;
        if (options && options.animate) { requestAnimationFrame(canvas.update.bind(canvas, f, options)); }
        if (options && options.still) {
            canvas.value = x; canvas.dispatchEvent(new CustomEvent('input')); canvas.im.style.width = canvas.style.width; canvas.im.style.height = canvas.style.height; canvas.im.src = canvas.toDataURL();
            var p = canvas.parentElement; if (p) { p.insertBefore(canvas.im, canvas); p.removeChild(canvas); }
        }
    }
    // Basic mouse interactivity. needs more love.
    var sel = -1; canvas.oncontextmenu = canvas.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation(); if (e.detail === 0) return;
        var rc = canvas.getBoundingClientRect(), mx = (e.x - rc.left) / (rc.right - rc.left) * 2 - 1, my = ((e.y - rc.top) / (rc.bottom - rc.top) * -4 + 2) * canvas.height / canvas.width;
        sel = (e.button == 2) ? -3 : -2; canvas.value.forEach((x, i) => {
            if (tot != 5) {
                if (x[14]) {
                    var pos2 = Element.Mul([[M[0], M[4], M[8], M[12]], [M[1], M[5], M[9], M[13]], [M[2], M[6], M[10], M[14]], [M[3], M[7], M[11], M[15]]], [-x[13] / x[14], -x[12] / x[14], x[11] / x[14], 1]).map(x => x.s);
                    pos2 = Element.Mul([[5, 0, 0, 0], [0, 5 * (2), 0, 0], [0, 0, 1, -1], [0, 0, 2, 0]], pos2).map(x => x.s).map((x, i, a) => x / a[3]);
                    if ((mx - pos2[0]) ** 2 + ((my) - pos2[1]) ** 2 < 0.01) sel = i;
                }
            } else {
                x = interprete(x); if (x.tp == 1) {
                    var pos2 = Element.Mul([[M[0], M[4], M[8], M[12]], [M[1], M[5], M[9], M[13]], [M[2], M[6], M[10], M[14]], [M[3], M[7], M[11], M[15]]], [...x.pos, 1]).map(x => x.s);
                    pos2 = Element.Mul([[5, 0, 0, 0], [0, 5 * (r || 2), 0, 0], [0, 0, 1, -1], [0, 0, 2, 0]], pos2).map(x => x.s).map((x, i, a) => x / a[3]);
                    if ((mx - pos2[0]) ** 2 + (my - pos2[1]) ** 2 < 0.01) sel = i;
                }
            }
        });
        canvas.onwheel = e => { e.preventDefault(); e.stopPropagation(); options.z = (options.z || 5) + e.deltaY / 100; if (!options.animate) requestAnimationFrame(canvas.update.bind(canvas, f, options)); }
        canvas.onmouseup = e => sel = -1; canvas.onmouseleave = e => sel = -1;
        var tx, ty; canvas.ontouchstart = (e) => { e.preventDefault(); canvas.focus(); var x = e.changedTouches[0].pageX, y = e.changedTouches[0].pageY; tx = x; ty = y; }
        canvas.ontouchmove = function (e) {
            e.preventDefault();
            var x = e.changedTouches[0].pageX, y = e.changedTouches[0].pageY, mx = (x - (tx || x)) / 1000, my = -(y - (ty || y)) / 1000; tx = x; ty = y;
            options.h = (options.h || 0) + mx; options.p = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, (options.p || 0) + my)); if (!options.animate) requestAnimationFrame(canvas.update.bind(canvas, f, options)); return;
        };
        canvas.onmousemove = (e) => {
            var rc = canvas.getBoundingClientRect(), x; if (sel >= 0) { if (tot == 5) x = interprete(canvas.value[sel]); else { x = canvas.value[sel]; x = { pos: [-x[13] / x[14], -x[12] / x[14], x[11] / x[14]] }; } }
            var mx = (e.movementX) / (rc.right - rc.left) * 2, my = ((e.movementY) / (rc.bottom - rc.top) * -2) * canvas.height / canvas.width;
            if (sel == -2) { options.h = (options.h || 0) + mx; options.p = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, (options.p || 0) + my)); if (!options.animate) requestAnimationFrame(canvas.update.bind(canvas, f, options)); return; };
            if (sel == -3) {
                var ct = Math.cos(options.h || 0), st = Math.sin(options.h || 0), ct2 = Math.cos(options.p || 0), st2 = Math.sin(options.p || 0);
                if (e.shiftKey) { options.posy = (options.posy || 0) + my; } else { options.posx = (options.posx || 0) + mx * ct + my * st; options.posz = (options.posz || 0) + mx * -st + my * ct * ct2; } if (!options.animate) requestAnimationFrame(canvas.update.bind(canvas, f, options)); return;
            }; if (sel < 0) return;
            if (tot == 5) {
                x.pos[0] += (e.buttons != 2) ? Math.cos(-(options.h || 0)) * mx : Math.sin((options.h || 0)) * my; x.pos[1] += (e.buttons != 2) ? my : 0; x.pos[2] += (e.buttons != 2) ? Math.sin(-(options.h || 0)) * mx : Math.cos((options.h || 0)) * my;
                canvas.value[sel].set(Element.Mul(ni, (x.pos[0] ** 2 + x.pos[1] ** 2 + x.pos[2] ** 2) * 0.5).Sub(no)); canvas.value[sel].set(x.pos, 1);
            }
            else if (x) {
                x.pos[2] += (e.buttons != 2) ? Math.sin(-(options.h || 0)) * mx : Math.cos((options.h || 0)) * my; x.pos[1] += (e.buttons != 2) ? my : 0; x.pos[0] += (e.buttons != 2) ? Math.cos(-(options.h || 0)) * mx : Math.sin((options.h || 0)) * my;
                canvas.value[sel].set([x.pos[2], -x.pos[1], -x.pos[0], 1], 11);
            }
            if (!options.animate) requestAnimationFrame(canvas.update.bind(canvas, f, options));
        }
    }
    canvas.value = f.call ? f() : f; canvas.options = options;
    if (options && options.still) {
        var i = new Image(); canvas.im = i; return requestAnimationFrame(canvas.update.bind(canvas, f, options)), canvas;
    } else return requestAnimationFrame(canvas.update.bind(canvas, f, options)), canvas;
}
