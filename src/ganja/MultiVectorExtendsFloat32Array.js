/**
 * 
 * @param {*} basis 
 * @param {Options} options 
 * @param {*} simplify 
 * @param {*} grades 
 * @param {*} grade_start 
 * @param {*} tot 
 * @param {*} p 
 * @param {*} q 
 * @param {*} r 
 */

export default function MultiVectorExtendsFloat32Array(
    basis,
    options,
    simplify,
    grades,
    grade_start,
    tot,
    p,
    q,
    r
) {
    // Faster and degenerate-metric-resistant dualization. (a remapping table that maps items into their duals).
    var drm = basis.map(
        (a, i) => { return { a: a, i: i } }
        )
        .sort(
            (a, b) => a.a.length > b.a.length ? 1 : a.a.length < b.a.length ? -1 : (+a.a.slice(1).split('').sort().join('')) -
            (+b.a.slice(1).split('').sort().join(''))
        )
        .map(
            x => x.i
        ).reverse();
    var drms = drm.map(
        (x, i) => (x == 0 || i == 0) ? 1 : simplify(basis[x] + basis[i])[0] == '-' ? -1 : 1
    );

    /// Store the full metric (also for bivectors etc ..)
    var metric = options.Cayley && options.Cayley.map(
        (x, i) => x[i]
    ) || basis.map(
        (x, xi) => simplify(x + x, p, q, r) | 0
    );
    metric[0] = 1;

    /// Generate multiplication tables for the outer and geometric products.
    var mulTable = options.Cayley || basis.map(
        x => basis.map(
            y => (x == 1) ? y : (y == 1) ? x : simplify(x + y, p, q, r)
        )
    );

    // subalgebra support. (must be bit-order basis blades, does no error checking.)
    if (options.even) {
        options.basis = basis.filter(
            x => x.length % 2 == 1
        );
    }
    if (options.basis && !options.Cayley && r >= 0 && options.basis.length != 2 ** tot) {
        metric = metric.filter(
            (x, i) => options.basis.indexOf(basis[i]) != -1
        );
        mulTable = mulTable.filter(
            (x, i) => options.basis.indexOf(basis[i]) != -1
        ).map(
            x => x.filter(
                (x, i) => options.basis.indexOf(basis[i]) != -1
            )
        );
        basis = options.basis;
    }

    /// Convert Cayley table to product matrices. The outer product selects the strict sum of the GP (but without metric), the inner product
    /// is the left contraction.
    var gp = basis.map(
        x => basis.map(
            x => '0'
        )
    );
    var cp = gp.map(
        x => gp.map(
            x => '0'
        )
    );
    var cps = gp.map(
        x => gp.map(
            x => '0'
        )
    );
    var op = gp.map(
        x => gp.map(
            x => '0'
        )
    );
    var gpo = {};          // Storage for our product tables.
    basis.forEach(
        (x, xi) => basis.forEach(
            (y, yi) => {
                var n = mulTable[xi][yi].replace(/^-/, '');
                if (!gpo[n]) {
                    gpo[n] = [];
                }
                gpo[n].push([xi, yi]);
            }
        )
    );
    basis.forEach((o, oi) => {
        gpo[o].forEach(
            ([xi, yi]) => op[oi][xi] = (grades[oi] == grades[xi] + grades[yi]) ? ((mulTable[xi][yi] == '0') ? '0' : ((mulTable[xi][yi][0] != '-') ? '' : '-') + 'b[' + yi + ']*this[' + xi + ']') : '0'
        );
        gpo[o].forEach(([xi, yi]) => {
            gp[oi][xi] = ((gp[oi][xi] == '0') ? '' : gp[oi][xi] + '+') + ((mulTable[xi][yi] == '0') ? '0' : ((mulTable[xi][yi][0] != '-') ? '' : '-') + 'b[' + yi + ']*this[' + xi + ']');
            cp[oi][xi] = ((cp[oi][xi] == '0') ? '' : cp[oi][xi] + '+') + ((grades[oi] == grades[yi] - grades[xi]) ? gp[oi][xi] : '0');
            cps[oi][xi] = ((cps[oi][xi] == '0') ? '' : cps[oi][xi] + '+') + ((grades[oi] == Math.abs(grades[yi] - grades[xi])) ? gp[oi][xi] : '0');
        });
    });

    /// Flat Algebra Multivector Base Class.
    var generator = class MultiVector extends (options.baseType || Float32Array) {
        /// constructor - create a floating point array with the correct number of coefficients.
        constructor(a) {
            super(a || basis.length);
        }

        /// grade selection - return a only the part of the input with the specified grade.
        Grade(grade, res) {
            res = res || new this.constructor();
            for (var i = 0, l = res.length; i < l; i++) {
                if (grades[i] == grade) {
                    res[i] = this[i];
                } else {
                    res[i] = 0;
                }
            }
            return res;
        }
        Even(res) {
            res = res || new this.constructor();
            for (var i = 0, l = res.length; i < l; i++) {
                if (grades[i] % 2 == 0) {
                    res[i] = this[i];
                } else {
                    res[i] = 0;
                }
            }
            return res;
        }

        /// grade creation - convert array with just one grade to full multivector.
        nVector(grade, ...args) {
            this.set(args, grade_start[grade]);
            return this;
        }

        /// Fill in coordinates (accepts sequence of index,value as arguments)
        Coeff() {
            for (var i = 0, l = arguments.length; i < l; i += 2) {
                this[arguments[i]] = arguments[i + 1];
            }
            return this;
        }

        /// Negates specific grades (passed in as args)
        Map(res, ...a) {
            for (var i = 0, l = res.length; i < l; i++) {
                res[i] = (~a.indexOf(grades[i])) ? -this[i] : this[i];
            }
            return res;
        }

        /// Returns the vector grade only.
        get Vector() {
            return this.slice(grade_start[1], grade_start[2]);
        };

        toString() {
            var res = [];
            for (var i = 0; i < basis.length; i++) {
                if (Math.abs(this[i]) > 1e-10) {
                    res.push(
                        ((this[i] == 1) && i ? '' : ((this[i] == -1) && i) ? '-' : (this[i].toFixed(10) * 1)) +
                        (i == 0 ? '' : tot == 1 && q == 1 ? 'i' : basis[i].replace('e', 'e_'))
                    );
                }
            }
            return res.join('+').replace(/\+-/g, '-') || '0';
        }

        /// Reversion, Involutions, Conjugation for any number of grades, component acces shortcuts.
        get Negative() {
            var res = new this.constructor();
            for (var i = 0; i < this.length; i++) {
                res[i] = -this[i];
            }
            return res;
        };

        get Reverse() {
            var res = new this.constructor();
            for (var i = 0; i < this.length; i++) {
                res[i] = this[i] * [1, 1, -1, -1][grades[i] % 4];
            }
            return res;
        };

        get Involute() {
            var res = new this.constructor();
            for (var i = 0; i < this.length; i++) {
                res[i] = this[i] * [1, -1, 1, -1][grades[i] % 4];
            }
            return res;
        };

        get Conjugate() {
            var res = new this.constructor();
            for (var i = 0; i < this.length; i++) {
                res[i] = this[i] * [1, -1, -1, 1][grades[i] % 4];
            }
            return res;
        };

        /// The Dual, Length, non-metric length and normalized getters.

        get Dual() {
            if (r) {
                return this.map(
                    (x, i, a) => a[drm[i]] * drms[i]
                );
            }
            var res = new this.constructor();
            res[res.length - 1] = 1;
            return res.Mul(this);
        };

        get Length() {
            return options.over ? Math.sqrt(Math.abs(this.Mul(this.Conjugate).s.s)) : Math.sqrt(Math.abs(this.Mul(this.Conjugate).s));
        };

        get VLength() {
            var res = 0;
            for (var i = 0; i < this.length; i++) {
                res += this[i] * this[i];
            }
            return Math.sqrt(res);
        };

        get Normalized() {
            var res = new this.constructor(),
            l = this.Length;
            if (!l) {
                return this;
            }
            l = 1 / l;
            for (var i = 0; i < this.length; i++) {
                if (options.over) {
                    res[i] = this[i].Scale(l);
                } else {
                    res[i] = this[i] * l;
                }
            }
            return res;
        };
    }

    /// Convert symbolic matrices to code. (skipping zero's on dot and wedge matrices).
    /// These all do straightforward string fiddling. If the 'mix' option is set they reference basis components using e.g. '.e1' instead of eg '[3]' .. so that
    /// it will work for elements of subalgebras etc.
    generator.prototype.Add = new Function(
        'b,res',
        'res=res||new this.constructor();\n' + basis.map(
            (x, xi) => 'res[' + xi + ']=b[' + xi + ']+this[' + xi + ']'
        ).join(';\n').replace(/(b|this)\[(.*?)\]/g,
            (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
        ) + ';\nreturn res'
    );

    generator.prototype.Scale = new Function(
        'b,res',
        'res=res||new this.constructor();\n' + basis.map(
            (x, xi) => 'res[' + xi + ']=b*this[' + xi + ']'
        ).join(';\n').replace(/(b|this)\[(.*?)\]/g,
            (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
        ) + ';\nreturn res'
    );

    generator.prototype.Sub = new Function(
        'b,res',
        'res=res||new this.constructor();\n' + basis.map(
            (x, xi) => 'res[' + xi + ']=this[' + xi + ']-b[' + xi + ']'
        ).join(';\n').replace(/(b|this)\[(.*?)\]/g,
            (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
        ) + ';\nreturn res'
    );

    generator.prototype.Mul = new Function(
        'b,res',
        'res=res||new this.constructor();\n' + gp.map(
            (r, ri) => 'res[' + ri + ']=' + r.join('+').replace(/\+\-/g, '-').replace(/(\w*?)\[(.*?)\]/g,
                (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
            ).replace(/\+0/g, '') + ';'
        ).join('\n') + '\nreturn res;'
    );

    generator.prototype.LDot = new Function(
        'b,res',
        'res=res||new this.constructor();\n' + cp.map(
            (r, ri) => 'res[' + ri + ']=' + r.join('+').replace(/\+\-/g, '-').replace(/\+0/g, '').replace(/(\w*?)\[(.*?)\]/g,
                (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
            ) + ';'
        ).join('\n') + '\nreturn res;'
    );

    generator.prototype.Dot = new Function(
        'b,res',
        'res=res||new this.constructor();\n' + cps.map(
            (r, ri) => 'res[' + ri + ']=' + r.join('+').replace(/\+\-/g, '-').replace(/\+0/g, '').replace(/(\w*?)\[(.*?)\]/g,
                (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
            ) + ';'
        ).join('\n') + '\nreturn res;'
    );

    generator.prototype.Wedge = new Function(
        'b,res',
        'res=res||new this.constructor();\n' + op.map(
            (r, ri) => 'res[' + ri + ']=' + r.join('+').replace(/\+\-/g, '-').replace(/\+0/g, '').replace(/(\w*?)\[(.*?)\]/g,
                (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
            ) + ';'
        ).join('\n') + '\nreturn res;'
    );

    //    generator.prototype.Vee   = new Function('b,res','res=res||new this.constructor();\n'+op.map((r,ri)=>'res['+drm[ri]+']='+r.map(x=>x.replace(/\[(.*?)\]/g,function(a,b){return '['+(drm[b|0])+']'})).join('+').replace(/\+\-/g,'-').replace(/\+0/g,'').replace(/(\w*?)\[(.*?)\]/g,(a,b,c)=>options.mix?'('+b+'.'+(c|0?basis[c]:'s')+'||0)':a)+';').join('\n')+'\nreturn res;');
    /// Conforms to the new Chapter 11 now.
    generator.prototype.Vee = new Function(
        'b,res',
        (
            'res=res||new this.constructor();\n' + op.map((r, ri) => 'res[' + drm[ri] + ']=' + drms[ri] + '*(' + r.map(
                x => x.replace(/\[(.*?)\]/g, function (a, b) {
                    return '[' + (drm[b | 0]) + ']' + (drms[b | 0] > 0 ? "" : "*-1");
                })
            ).join('+').replace(/\+\-/g, '-').replace(/\+0/g, '').replace(/(\w*?)\[(.*?)\]/g,
                (a, b, c) => options.mix ? '(' + b + '.' + (c | 0 ? basis[c] : 's') + '||0)' : a
            ) + ');').join('\n') + '\nreturn res;'
        ).replace(/(b\[)|(this\[)/g,
            a => a == 'b[' ? 'this[' : 'b['
        )
    );

    /// Add getter and setters for the basis vectors/bivectors etc ..
    basis.forEach(
        (b, i) => Object.defineProperty(
            generator.prototype,
            i ? b : 's', {
                configurable: true,
                get() {
                    return this[i];
                },
                set(x) {
                    this[i] = x;
                }
            }
        )
    );

    return {
        generator,
        drm,
        mulTable,
        metric,
        gp
    };
}
