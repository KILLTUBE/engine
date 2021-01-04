// webGL2 Graphing function. (for OPNS/IPNS implicit 2D and 1D surfaces in 3D space).
/**
 * 
 * @param {*} f 
 * @param {Options} options 
 * @param {*} tot
 * @param {*} counts
 */
export default function Element_graphGL2(
    f,
    options,
    Element,
    tot,
    counts
) {
    // Create canvas, get webGL2 context.
    var canvas = document.createElement('canvas'); canvas.style.width = options.width || ''; canvas.style.height = options.height || ''; canvas.style.backgroundColor = '#EEE';
    if (options.width && options.width.match && options.width.match(/px/i)) canvas.width = parseFloat(options.width) * (options.devicePixelRatio || 1); if (options.height && options.height.match && options.height.match(/px/i)) canvas.height = parseFloat(options.height) * (options.devicePixelRatio || 1);
    var gl = canvas.getContext('webgl2', { alpha: options.alpha || false, preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' });
    var gl2 = !!gl; if (!gl) gl = canvas.getContext('webgl', { alpha: options.alpha || false, preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' });
    gl.clearColor(240 / 255, 240 / 255, 240 / 255, 1.0); gl.enable(gl.DEPTH_TEST); if (!gl2) { gl.getExtension("EXT_frag_depth"); gl.va = gl.getExtension('OES_vertex_array_object'); }
    else gl.va = { createVertexArrayOES: gl.createVertexArray.bind(gl), bindVertexArrayOES: gl.bindVertexArray.bind(gl), deleteVertexArrayOES: gl.deleteVertexArray.bind(gl) }
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
    var createVA = function (vtx) {
        var r = gl.va.createVertexArrayOES(); gl.va.bindVertexArrayOES(r);
        var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vtx), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
        return { r, b }
    },
        // Destroy Vertex array and delete buffers.
        destroyVA = function (va) {
            if (va.b) gl.deleteBuffer(va.b); if (va.r) gl.va.deleteVertexArrayOES(va.r);
        }
    // Drawing function
    var M = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 5, 1];
    var draw = function (p, tp, vtx, color, color2, ratio, texc, va, b, color3, r, g) {
        gl.useProgram(p); gl.uniformMatrix4fv(gl.getUniformLocation(p, "mv"), false, M);
        gl.uniformMatrix4fv(gl.getUniformLocation(p, "p"), false, [5, 0, 0, 0, 0, 5 * (ratio || 1), 0, 0, 0, 0, 1, 2, 0, 0, -1, 0])
        gl.uniform3fv(gl.getUniformLocation(p, "color"), new Float32Array(color));
        gl.uniform3fv(gl.getUniformLocation(p, "color2"), new Float32Array(color2));
        if (color3) gl.uniform3fv(gl.getUniformLocation(p, "color3"), new Float32Array(color3));
        if (b) gl.uniform1fv(gl.getUniformLocation(p, "b"), (new Float32Array(counts[g])).map((x, i) => b[g][i] || 0));
        if (texc) gl.uniform1i(gl.getUniformLocation(p, "texc"), 0);
        if (r) gl.uniform1f(gl.getUniformLocation(p, "ratio"), r);
        var v; if (!va) v = createVA(vtx); else gl.va.bindVertexArrayOESOES(va.r);
        gl.drawArrays(tp, 0, (va && va.tcount) || vtx.length / 3);
        if (v) destroyVA(v);
    }
    // Compile the OPNS renderer. (sphere tracing)
    var programs = [], genprog = grade => compile(`${gl2 ? "#version 300 es" : ""}
            ${gl2 ? "in" : "attribute"} vec4 position; ${gl2 ? "out" : "varying"} vec4 Pos; uniform mat4 mv; uniform mat4 p;
            void main() { Pos=mv*position; gl_Position = p*Pos; }`,
        `${!gl2 ? "#extension GL_EXT_frag_depth : enable" : "#version 300 es"}
            precision highp float;
            uniform vec3 color; uniform vec3 color2;
            uniform vec3 color3; uniform float b[${counts[grade]}];
            uniform float ratio; ${gl2 ? "out vec4 col;" : ""}
            ${gl2 ? "in" : "varying"} vec4 Pos;
            float dist (in float z, in float y, in float x, in float[${counts[grade]}] b) {
            ${this.nVector(1, []).OPNS_GLSL(this.nVector(grade, []), options.up)}
            return ${grade != tot - 1 ? "sign(sum)*sqrt(abs(sum))" : "res"};
            }
            vec3 trace_depth (in vec3 start, vec3 dir, in float thresh) {
            vec3 orig=start; float lastd = 1000.0; const int count=${(options.maxSteps || 64)};
            float s =  sign(dist(start[0],start[1],start[2],b));
            for (int i=0; i<count; i++) {
                float d = s*dist(start[0],start[1],start[2],b);
                if (d < thresh) return start - lastd*${(options.stepSize || 0.25)}*dir*(thresh-d)/(lastd-d);
                lastd = d; start += dir*${(options.stepSize || 0.25)}*d;
            }
            return orig;
            }
            void main() {
            vec3 p = -5.0*normalize(color2);
            vec3 dir = normalize((-Pos[0]/5.0)*color + color2 + vec3(0.0,Pos[1]/5.0*ratio,0.0));  p += 1.0*dir;
            vec3 L = 5.0*normalize( -0.5*color + 0.85*color2 + vec3(0.0,-0.5,0.0) );
            vec3 d2 = trace_depth( p , dir, ${grade != tot - 1 ? (options.thresh || 0.2) : "0.0075"} );
            float dl2 = dot(d2-p,d2-p); const float h=0.1;
            if (dl2>0.0) {
                vec3 n = normalize(vec3(
                    dist(d2[0]+h,d2[1],d2[2],b)-dist(d2[0]-h,d2[1],d2[2],b),
                    dist(d2[0],d2[1]+h,d2[2],b)-dist(d2[0],d2[1]-h,d2[2],b),
                    dist(d2[0],d2[1],d2[2]+h,b)-dist(d2[0],d2[1],d2[2]-h,b)
                    ));
                ${gl2 ? "gl_FragDepth" : "gl_FragDepthEXT"} = dl2/50.0;
                ${gl2 ? "col" : "gl_FragColor"} = vec4(max(0.2,abs(dot(n,normalize(L-d2))))*color3 + pow(abs(dot(n,normalize(normalize(L-d2)+dir))),100.0),1.0);
            } else discard;
            }`), genprog2D = grade => compile(`${gl2 ? "#version 300 es" : ""}
            ${gl2 ? "in" : "attribute"} vec4 position; ${gl2 ? "out" : "varying"} vec4 Pos; uniform mat4 mv; uniform mat4 p;
            void main() { Pos=mv*position; gl_Position = p*Pos; }`,
            `${!gl2 ? "#extension GL_EXT_frag_depth : enable" : "#version 300 es"}
            precision highp float;
            uniform vec3 color; uniform vec3 color2;
            uniform vec3 color3; uniform float b[${counts[grade]}];
            uniform float ratio; ${gl2 ? "out vec4 col;" : ""}
            ${gl2 ? "in" : "varying"} vec4 Pos;
            float dist (in float z, in float y, in float x, in float[${counts[grade]}] b) {
            ${this.nVector(1, []).OPNS_GLSL(this.nVector(grade, []), options.up)}
            return ${grade != tot - 1 ? "sqrt(abs(sum))" : "res"};
            }
            float trace_depth (in vec3 start, vec3 dir, in float thresh) {
            vec3 orig=start; float lastd = 1000.0; const int count=${(options.maxSteps || 64)};
            float s = dist(start[0]*5.0,start[1]*5.0,start[2]*5.0,b);
            s=s*s;
            return 1.0-s*150.0;
            }
            void main() {
            vec3 p = -5.0*normalize(color2);
            vec3 dir = normalize((-Pos[0]/5.0)*color + color2 + vec3(0.0,Pos[1]/5.0*ratio,0.0));  p += 1.0*dir;
            vec3 L = 5.0*normalize( -0.5*color + 0.85*color2 + vec3(0.0,-0.5,0.0) );
            float d2 = trace_depth( p , dir, ${grade != tot - 1 ? (options.thresh || 0.2) : "0.0075"} );
            if (d2>0.0) {
                ${gl2 ? "gl_FragDepth" : "gl_FragDepthEXT"} = d2/50.0;
                ${gl2 ? "col" : "gl_FragColor"} = vec4(d2*color3,d2);
            } else discard;
            }`)
    // canvas update will (re)render the content.
    var armed = 0;
    canvas.update = (x) => {
        // Start by updating canvas size if needed and viewport.
        var s = getComputedStyle(canvas); if (s.width) { canvas.width = parseFloat(s.width) * (options.devicePixelRatio || 1); canvas.height = parseFloat(s.height) * (options.devicePixelRatio || 1); }
        gl.viewport(0, 0, canvas.width | 0, canvas.height | 0); var r = canvas.width / canvas.height;
        // Defaults, resolve function input
        var a;
        var p = [];
        var l = [];
        var t = [];
        var c = [.5, .5, .5];
        var alpha = 0;
        var lastpos = [-2, 2, 0.2];
        gl.clear(gl.COLOR_BUFFER_BIT + gl.DEPTH_BUFFER_BIT);
        while (x.call) {
            x = x();
        }
        // Loop over all items to render.
        for (var i = 0, ll = x.length; i < ll; i++) {
            var e = x[i];
            while (e && e.call) {
                e = e();
            }
            if (e == undefined) {
                continue;
            }
            if (typeof e == "number") {
                alpha = ((e >>> 24) & 0xff) / 255;
                c[0]  = ((e >>> 16) & 0xff) / 255;
                c[1]  = ((e >>> 8 ) & 0xff) / 255;
                c[2]  = ( e & 0xff) / 255;
            }
            if (e instanceof Element) {
                var tt = options.spin ? -performance.now() * options.spin / 1000 : -options.h || 0;
                tt += Math.PI / 2;
                var r = canvas.height / canvas.width;
                var g = tot - 1;
                while (!e[g] && g > 1) g--;
                if (!programs[tot - 1 - g])
                    programs[tot - 1 - g] = (options.up.find(x => x.match && x.match("z"))) ? genprog(g) : genprog2D(g);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                draw(
                    programs[tot - 1 - g],
                    gl.TRIANGLES,
                    [-2, -2, 0, -2, 2, 0, 2, -2, 0, -2, 2, 0, 2, -2, 0, 2, 2, 0],
                    [Math.cos(tt), 0, -Math.sin(tt)], [Math.sin(tt), 0, Math.cos(tt)],
                    undefined,
                    undefined,
                    undefined,
                    e,
                    c,
                    r,
                    g
                );
                gl.disable(gl.BLEND);
            }
        }
        // if we're no longer in the page .. stop doing the work.
        armed++; if (document.body.contains(canvas)) armed = 0; if (armed == 2) return;
        canvas.value = x; if (options && !options.animate) canvas.dispatchEvent(new CustomEvent('input'));
        if (options && options.animate) { requestAnimationFrame(canvas.update.bind(canvas, f, options)); }
        if (options && options.still) { canvas.value = x; canvas.dispatchEvent(new CustomEvent('input')); canvas.im.width = canvas.width; canvas.im.height = canvas.height; canvas.im.src = canvas.toDataURL(); }
    }
    // Basic mouse interactivity. needs more love.
    var sel = -1; canvas.oncontextmenu = canvas.onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation(); sel = -2;
        var rc = canvas.getBoundingClientRect(), mx = (e.x - rc.left) / (rc.right - rc.left) * 2 - 1, my = ((e.y - rc.top) / (rc.bottom - rc.top) * -4 + 2) * canvas.height / canvas.width;
        canvas.onwheel = e => { e.preventDefault(); e.stopPropagation(); options.z = (options.z || 5) + e.deltaY / 100; if (!options.animate) requestAnimationFrame(canvas.update.bind(canvas, f, options)); }
        canvas.onmouseup = e => sel = -1; canvas.onmouseleave = e => sel = -1;
        canvas.onmousemove = (e) => {
            var rc = canvas.getBoundingClientRect();
            var mx = (e.movementX) / (rc.right - rc.left) * 2, my = ((e.movementY) / (rc.bottom - rc.top) * -2) * canvas.height / canvas.width;
            if (sel == -2) { options.h = (options.h || 0) + mx; if (!options.animate) requestAnimationFrame(canvas.update.bind(canvas, f, options)); return; }; if (sel < 0) return;
        }
    }
    canvas.value = f.call ? f() : f; canvas.options = options;
    if (options && options.still) {
        var i = new Image(); canvas.im = i; return requestAnimationFrame(canvas.update.bind(canvas, f, options)), i;
    } else return requestAnimationFrame(canvas.update.bind(canvas, f, options)), canvas;

}
