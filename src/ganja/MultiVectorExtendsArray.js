/**
 * 
 * @param {*} basis 
 * @param {*} simplify_bits 
 * @param {*} grades 
 * @param {*} grade_start 
 * @param {*} tot 
 * @param {*} low 
 * @param {*} bc 
 */
export default function MultiVectorExtendsArray(basis, simplify_bits, grades, grade_start, tot, low, bc) {
    // extra graded lookups.
    var basisg = grade_start.slice(0,grade_start.length-1).map((x,i)=>basis.slice(x,grade_start[i+1]));
    var counts = grade_start.map((x,i,a)=>i==a.length-1?0:a[i+1]-x).slice(0,tot+1);
    var basis_bits = basis.map(x=>x=='1'?0:x.slice(1).match(tot>9?/\d\d/g:/\d/g).reduce((a,b)=>a+(1<<(b-low)),0));
    var bits_basis = [];
    basis_bits.forEach(
        (b,i) => bits_basis[b] = i
    );
    var metric = basisg.map((x,xi)=>x.map((y,yi)=>simplify_bits(basis_bits[grade_start[xi]+yi],basis_bits[grade_start[xi]+yi])[0]));
    var drms   = basisg.map((x,xi)=>x.map((y,yi)=>simplify_bits(basis_bits[grade_start[xi]+yi],(~basis_bits[grade_start[xi]+yi])&((1<<tot)-1))[0]));

    /**
     * Flat Algebra Multivector Base Class.
     */
    var generator = class MultiVector extends Array {
        /**
         * constructor - create a floating point array with the correct number of coefficients.
         * @param {*} a 
         */
        constructor(a) {
            super(a || tot);
        }

        /**
         * grade selection - return a only the part of the input with the specified grade.
         * @param {*} grade 
         * @param {*} res 
         * @returns {MultiVector}
         */
        Grade(grade, res) {
            res = new this.constructor();
            res[grade] = this[grade];
            return res;
        }

        /**
         * grade creation - convert array with just one grade to full multivector.
         * @param {*} grade 
         * @param  {...any} args 
         * @returns {MultiVector}
         */
        nVector(grade, ...args) {
            this[grade] = args;
            return this;
        }

        /**
         * Fill in coordinates (accepts sequence of index, value as arguments)
         * @returns {MultiVector}
         */
        Coeff() {
            for (var i=0,l=arguments.length; i<l; i+=2) {
                if (arguments[i+1]) {
                    var gi = grades[arguments[i]];
                    if (this[gi]==undefined)
                        this[gi]=[];
                    this[gi][arguments[i]-grade_start[gi]]=arguments[i+1];
                }
            }
            return this;
        }

        /**
         * Negates specific grades (passed in as args)
         * @param {*} res 
         * @param  {...any} a 
         */
        Map(res, ...a) {
            /* tbc */
        }

        /**
         * Returns the vector grade only.
         */
        get Vector() {
            return this[1];
        };

        /**
         * multivector addition
         * @param {*} b 
         * @param {*} r 
         * @returns {MultiVector}
         */
        Add(b, r) {
            r = r || new this.constructor();
            for (var i=0,l=Math.max(this.length,b.length);i<l;i++) {
                if (!this[i] ^ !b[i])
                    r[i] = (!this[i]) ? b[i].slice():this[i].slice();
                else if (!(this[i]||b[i])) {
                    // nothing
                } else {
                    if (r[i] == undefined) {
                        r[i]=[];
                    }
                    for(var j=0,m=Math.max(this[i].length,b[i].length);j<m;j++) {
                        if (typeof this[i][j]=="string" || typeof r[i][j]=="string" || typeof b[i][j]=="string") {
                            if (!this[i][j])
                                r[i][j] = ""+b[i][j];
                            else if (!b[i][j])
                                r[i][j] = ""+this[i][j];
                            else
                                r[i][j] = "("+(this[i][j]||"0")+(b[i][j][0]=="-"?"":"+")+(b[i][j]||"0")+")";
                        } else {
                            r[i][j] = (this[i][j]||0)+(b[i][j]||0);
                        }
                    }
                }
            }
            return r;
        }

        /**
         * multivector subtraction
         * @param {*} b 
         * @param {*} r
         * @returns {MultiVector}
         */
        Sub(b, r) {
            r = r || new this.constructor();
            for (var i=0,l=Math.max(this.length,b.length);i<l;i++) {
                if (!this[i] || !b[i]) {
                    r[i] = (!this[i]) ? (b[i]?b[i].map(
                        x => (typeof x=="string")?"-"+x:-x
                    ):undefined):this[i];
                } else {
                    if (r[i] == undefined) {
                        r[i] = [];
                    }
                    for (var j=0,m=Math.max(this[i].length,b[i].length);j<m;j++) {
                        if (typeof this[i][j]=="string" || typeof r[i][j]=="string" || typeof b[i][j]=="string") {
                            r[i][j] = "("+(this[i][j]||"0")+"-"+(b[i][j]||"0")+")";
                        } else {
                            r[i][j] = (this[i][j]||0)-(b[i][j]||0);
                        }
                    }
                }
            }
            return r;
        }

        /**
         * scalar multiplication
         * @param {*} s 
         */
        Scale(s) {
            return this.map(
                x => x && x.map(
                    y => typeof y=="string"?y+"*"+s:y*s
                )
            );
        }

        /**
         * geometric product.
         * @param {*} b 
         * @param {*} r 
         * @returns {MultiVector}
         */
        Mul(b, r) {
            r = r || new this.constructor();
            var gotstring=false;
            for (var i=0,x,gsx; gsx=grade_start[i],x=this[i],i<this.length; i++) {
                if (x) {
                    for (var j=0,y,gsy;gsy=grade_start[j],y=b[j],j<b.length; j++) {
                        if (y) {
                            for (var a=0; a<x.length; a++) {
                                if (x[a]) {
                                    for (var bb=0; bb<y.length; bb++) {
                                        if (y[bb]) {
                                            if (i==j && a==bb) {
                                                r[0] = r[0] || (typeof x[0]=="string" || typeof y[bb]=="string"?[""]:[0]);
                                                if (typeof x[a]=="string" || typeof r[0][0]=="string" || typeof y[bb]=="string") {
                                                    r[0][0] = (r[0][0]?(r[0][0]+(x[a][0]=="-"?"":"+")):"")+ x[a]+"*"+y[bb]+(metric[i][a]!=1?"*"+metric[i][a]:"");
                                                    gotstring=true;
                                                } else {
                                                    r[0][0] += x[a]*y[bb]*metric[i][a];
                                                }
                                            } else {
                                                var rn = simplify_bits(basis_bits[gsx+a],basis_bits[gsy+bb]);
                                                var g = bc(rn[1]);
                                                var e = bits_basis[rn[1]] - grade_start[g];
                                                if (!r[g]) {
                                                    r[g]=[];
                                                }
                                                if (typeof r[g][e]=="string"||typeof x[a]=="string"||typeof y[bb]=="string") {
                                                    r[g][e] = (r[g][e]?r[g][e]+"+":"") + (rn[0]!=1?rn[0]+"*":"")+ x[a]+(y[bb]!=1?"*"+y[bb]:""); gotstring=true;
                                                } else {
                                                    r[g][e] = (r[g][e]||0) + rn[0]*x[a]*y[bb];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }   
            }
            if (gotstring) {
                return r.map(
                    g => g.map(
                        e => e && '('+e+')'
                    )
                )
            }
            return r;
        }
        
        /**
         * outer product.
         * @param {*} b 
         * @param {*} r 
         * @returns {MultiVector}
         */
        Wedge(b, r) {
            r = r || new this.constructor();
            for (var i=0,x,gsx; gsx=grade_start[i],x=this[i],i<this.length; i++) {
                if (x) {
                    for (var j=0,y,gsy;gsy=grade_start[j],y=b[j],j<b.length; j++) {
                        if (y) {
                            for (var a=0; a<x.length; a++) {
                                if (x[a]) {
                                    for (var bb=0; bb<y.length; bb++) {
                                        if (y[bb]) {
                                            if (i!=j || a!=bb) {
                                                var n1 = basis_bits[gsx+a];
                                                var n2 = basis_bits[gsy+bb];
                                                var rn = simplify_bits(n1,n2,tot);
                                                var g = bc(rn[1]);
                                                var e = bits_basis[rn[1]] - grade_start[g];
                                                if (g == i+j) {
                                                    if (!r[g]) {
                                                        r[g]=[];
                                                    }
                                                    r[g][e] = (r[g][e]||0) + rn[0]*x[a]*y[bb];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return r;
        }
        
        /**
         * outer product glsl output.
         * @param {*} b 
         * @param {*} point_source 
         * @returns {string}
         */
        OPNS_GLSL(b, point_source) {
            var r = '';
            var count = 0;
            var curg;
            for (var i=0,x,gsx; gsx=grade_start[i],x=this[i],i<this.length; i++) {
                if (x) {
                    for (var j=0,y,gsy;gsy=grade_start[j],y=b[j],j<b.length; j++) {
                        if (y) {
                            for (var a=0; a<counts[i]; a++) {
                                for (var bb=0; bb<counts[j]; bb++) {
                                    if (i!=j || a!=bb) {
                                        var n1 = basis_bits[gsx+a];
                                        var n2 = basis_bits[gsy+bb];
                                        var rn = simplify_bits(n1,n2,tot);
                                        var g  = bc(rn[1]);
                                        var e  = bits_basis[rn[1]] - grade_start[g];
                                        if (g == i+j) {
                                            curg = g;
                                            r += `res[${e}]${rn[0]=='1'?"+=":"-="}(${point_source[a]})*b[${bb}]; //${count++}\n`;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            r = r.split('\n').filter(x=>x).sort(
                (a,b) => ((a.match(/\d+/)[0]|0)-(b.match(/\d+/)[0]|0)) || ((a.match(/\d+$/)[0]|0)-(b.match(/\d+$/)[0]|0))
            ).map(
                x => x.replace(/\/\/\d+$/,'')
            );
            var r2 = 'float sum=0.0; float res=0.0;\n';
            var g = 0;
            r.forEach(
                x => {
                    var cg = x.match(/\d+/)[0]|0;
                    if (cg != g) {
                        r2 += "sum "+(((metric[curg][g]==-1))?"-=":"+=")+" res*res;\nres = 0.0;\n";
                    }
                    r2 += x.replace(/\[\d+\]/,'') + '\n';
                    g = cg;
                }
            );
            r2+= "sum "+((metric[curg][g]==-1)?"-=":"+=")+" res*res;\n";
            return r2;
        }

        /**
         * Left contraction.
         * @param {*} b 
         * @param {*} r 
         * @returns {MultiVector}
         */
        LDot(b, r) {
            r = r || new this.constructor();
            for (var i = 0, x, gsx; gsx=grade_start[i], x=this[i], i<this.length;  i++) if (x)
            for (var j = 0, y, gsy; gsy=grade_start[j], y=b[j]   , j<   b.length;  j++) if (y)
            for (var a = 0        ;                                   a<x.length;  a++) if (x[a ])
            for (var bb= 0        ;                                  bb<y.length; bb++) if (y[bb]) {
                if (i==j && a==bb) {
                    r[0] = r[0]||[0];
                    r[0][0] += x[a]*y[bb]*metric[i][a];
                } else {
                    var rn = simplify_bits(basis_bits[gsx+a],basis_bits[gsy+bb]);
                    var g = bc(rn[1]);
                    var e = bits_basis[rn[1]] - grade_start[g];
                    if (g == j-i) {
                        if (!r[g]) {
                            r[g]=[];
                        }
                        r[g][e] = (r[g][e]||0) + rn[0]*x[a]*y[bb];
                    }
                }
            }
            return r;
        }

        /**
         * Symmetric contraction.
         * @param {*} b 
         * @param {*} r 
         * @returns {MultiVector}
         */
        Dot(b, r) {
            r = r || new this.constructor();
            for (var i = 0, x, gsx; gsx=grade_start[i],x=this[i],i<this.length;  i++) if (x)
            for (var j = 0, y, gsy; gsy=grade_start[j],y=b[j],      j<b.length;  j++) if (y)
            for (var a = 0        ;                              a  < x.length;  a++) if (x[a])
            for (var bb= 0        ;                              bb < y.length; bb++) if (y[bb]) {
                if (i==j && a==bb) {
                    r[0] = r[0]||[0];
                    r[0][0] += x[a]*y[bb]*metric[i][a];
                } else {
                    var rn = simplify_bits(basis_bits[gsx+a],basis_bits[gsy+bb]);
                    var g = bc(rn[1]);
                    var e = bits_basis[rn[1]] - grade_start[g];
                    if (g == Math.abs(j-i)) {
                        if (!r[g]) {
                            r[g]=[];
                        }
                        r[g][e] = (r[g][e]||0) + rn[0]*x[a]*y[bb];
                    }
                }
            }
            return r;
        }

        /**
         * Should be optimized..
         * @param {*} b 
         * @param {*} r 
         * @returns {MultiVector}
         */
        Vee(b,r) {
            return (this.Dual.Wedge(b.Dual)).Dual;
        }

        // Output, lengths, involutions, normalized, dual.

        /**
         * @returns {string}
         */

        toString() {
            return [...this].map(
                (g, gi) => g && g.map(
                    (c,ci) => !c?undefined:c+basisg[gi][ci]
                ).filter(x=>x).join('+')
            ).filter(x=>x).join('+').replace(/\+\-/g,'-');
        }

        /**
         * 
         */
        get s() {
            if (this[0]) {
                return this[0][0] || 0;
            }
            return 0;
        }

        /**
         * 
         */
        get Length() {
            var res=0;
            this.forEach((g,gi)=>g&&g.forEach((e,ei)=>res+=(e||0)**2*metric[gi][ei]));
            return Math.abs(res)**.5;
        }

        /**
         * 
         */
        get VLength() {
            var res=0;
            this.forEach((g,gi)=>g&&g.forEach((e,ei)=>res+=(e||0)**2));
            return Math.abs(res)**.5;
        }

        /**
         * @returns {MultiVector}
         */
        get Reverse() {
            var r=new this.constructor();
            this.forEach(
                (x,gi)=>x&&x.forEach(
                    (e, ei) => {
                        if (!r[gi]) {
                            r[gi] = [];
                        }
                        r[gi][ei] = this[gi][ei]*[1,1,-1,-1][gi%4];
                    }
                )
            );
            return r;
        }

        /**
         * @returns {MultiVector}
         */
        get Involute() {
            var r = new this.constructor();
            this.forEach(
                (x, gi) => x && x.forEach(
                    (e, ei) => {
                        if (!r[gi]) {
                            r[gi] = [];
                        }
                        r[gi][ei] = this[gi][ei]*[1,-1,1,-1][gi%4];
                    }
                )
            );
            return r;
        }

        /**
         * @returns {MultiVector}
         */
        get Conjugate() {
            var r = new this.constructor();
            this.forEach(
                (x, gi) => x && x.forEach(
                    (e, ei) => {
                        if (!r[gi]) {    
                            r[gi]=[];
                        }
                        r[gi][ei] = this[gi][ei]*[1,-1,-1,1][gi%4];
                    }
                )
            );
            return r;
        }

        /**
         * @returns {MultiVector}
         */
        get Dual() {
            var r = new this.constructor();
            this.forEach(
                (g, gi) => {
                    if (!g) {
                        return;
                    }
                    r[tot - gi] = [];
                    g.forEach(
                        (e, ei) => r[tot-gi][counts[gi]-1-ei] = drms[gi][ei]*e
                    );
                }
            );
            return r;
        }

        /**
         * 
         */
        get Normalized() {
            return this.Scale(1/this.Length);
        }
    }

    return {
        generator,
        counts,
        basisg
    };
}
