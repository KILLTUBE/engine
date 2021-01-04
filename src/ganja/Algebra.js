import MultiVectorExtendsFloat32Array from "./MultiVectorExtendsFloat32Array.js";
import MultiVectorExtendsArray from "./MultiVectorExtendsArray.js";
import ElementExtendsGenerator from "./ElementExtendsGenerator.js";

/**
 * 
 * @param {Options} [p]
 * @param {*} [q]
 * @param {*} [r]
 */

export default function Algebra(p,q,r) {
    // Resolve possible calling signatures so we know the numbers for p,q,r. Last argument can always be a function.
    var fu = arguments[arguments.length-1];
    var options = p;

    if (options instanceof Object) {
        q = (p.q || (p.metric && p.metric.filter(x=>x==-1).length))| 0;
        r = (p.r || (p.metric && p.metric.filter(x=>x==0).length)) | 0;
        p = p.p === undefined ? (p.metric && p.metric.filter(x=>x==1).length) || 0 : p.p || 0;
    } else {
        options = {};
        p = p | 0;
        r = r | 0;
        q = q | 0;
    }
  
    // Support for multi-dual-algebras
    if (options.dual || (p==0 && q==0 && r<0)) {
        r = options.dual = options.dual || -r; // Create a dual number algebra if r<0 (old) or options.dual set(new)
        options.basis  = [...Array(r+1)].map((a,i)=>i?'e0'+i:'1');
        options.metric = [1,...Array(r)];
        options.tot = r + 1;
        options.Cayley = [...Array(r+1)].map((a,i)=>[...Array(r+1)].map((y,j)=>i*j==0?((i+j)?'e0'+(i+j):'1'):'0'));
    }

    if (options.over) {
        options.baseType = Array;
    }
  
    // Calculate the total number of dimensions.
    var tot = options.tot = (options.tot||(p||0)+(q||0)+(r||0)||(options.basis&&options.basis.length))|0;
  
    // Unless specified, generate a full set of Clifford basis names. We generate them as an array of strings by starting
    // from numbers in binary representation and changing the set bits into their relative position.
    // Basis names are ordered first per grade, then lexically (not cyclic!).
    // For 10 or more dimensions all names will be double digits ! 1e01 instead of 1e1 ..
    var basis=(options.basis&&(options.basis.length==2**tot||r<0||options.Cayley)&&options.basis)||[...Array(2**tot)]           // => [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined]
                .map((x,xi)=>(((1<<30)+xi).toString(2)).slice(-tot||-1)                                                           // => ["000", "001", "010", "011", "100", "101", "110", "111"]  (index of array in base 2)
                .replace(/./g,(a,ai)=>a=='0'?'':String.fromCharCode(66+ai-(r!=0))))                                               // => ["", "3", "2", "23", "1", "13", "12", "123"] (1 bits replaced with their positions, 0's removed)
                .sort((a,b)=>(a.toString().length==b.toString().length)?(a>b?1:b>a?-1:0):a.toString().length-b.toString().length) // => ["", "1", "2", "3", "12", "13", "23", "123"] (sorted numerically)
                .map(x=>x&&'e'+(x.replace(/./g,x=>('0'+(x.charCodeAt(0)-65)).slice(tot>9?-2:-1) ))||'1')                          // => ["1", "e1", "e2", "e3", "e12", "e13", "e23", "e123"] (converted to commonly used basis names)
  
    // See if the basis names start from 0 or 1, store grade per component and lowest component per grade.
    var low         = basis.length == 1 ? 1 : basis[1].match(/\d+/g)[0] * 1;
    var grades      = options.grades || (options.dual && basis.map((x,i)=>i?1:0)) || basis.map(x=>tot>9?(x.length-1)/2:x.length-1);
    var grade_start = grades.map((a,b,c)=>c[b-1]!=a?b:-1).filter(x=>x+1).concat([basis.length]);
  
    /**
     * String-simplify a concatenation of two basis blades. (and supports custom basis names e.g. e21 instead of e12)
     * This is the function that implements e1e1 = +1/-1/0 and e1e2=-e2e1. The brm function creates the remap dictionary.
     * 
     * Calling it with p,q,r==undefined is possible, if you don't need to have the sign,
     * which amounts to the comparisons always false, aka the signature of basis vectors always +1,
     * that is the index will never be >= p+r nor < r .. i.e. always positive
     * 
     * Calling it with p,q,r undefined defaults to all basis vectors having a +1 metric,
     * and can be used to find if something is an even or odd permutation of the corresponding element in the basis.
     * (E.g. if the basis contains 'e21' then simplify('e12') will return '-e21',
     * if the basis contains instead 'e12' it will return 'e12')
     * 
     * @param {string} s_
     * @param {number} [p]
     * @param {number} [q]
     * @param {number} [r]
     * @returns {string}
     */
    var simplify = (s_, p, q, r) => {
        var sign = 1;
        var c;
        var l;
        var t = [];
        var f = true;
        var ss = s_.match(tot>9?/(\d\d)/g:/(\d)/g);
        if (!ss) {
            return s_;
        }
        var s = ss;
        l = s.length;
        while (f) {
            f = false;
            // implement Ex*Ex = metric.
            for (var i=0; i<l;)
                if (s[i] === s[i+1]) {
                    if (options.metric)
                        sign *= options.metric[s[i] - basis[1][1]];
                    else if ((s[i]-low) >= (p+r))
                        sign *= -1;
                    else if ((s[i]-low) < r)
                        sign = 0;
                    i += 2;
                    f = true;
                } else t.push(s[i++]);
            // implement Ex*Ey = -Ey*Ex while sorting basis vectors.
            for (var i=0; i<t.length-1; i++)
                if (t[i] > t[i+1]) {
                    c      = t[i];
                    t[i]   = t[i+1];
                    t[i+1] = c;
                    sign *= -1;
                    f = true;
                    break;
                }
            if (f) {
                s = t;
                t = [];
                l = s.length;
            }
        }
        var ret  = (sign==0)?'0':((sign==1)?'':'-')+(t.length?'e'+t.join(''):'1');
        var ret2 = (brm && brm[ret]) || (brm && brm['-'+ret] && '-' + brm['-' + ret]) || ret;
        //console.log(`equals(simplify('${s_}', ${p}, ${q}, ${r}), '${ret2}');`);
        return ret2;
    };
    // Todo: export as function and do something about unused `x`
    var brm = (
        x => {
            var ret = {};
            for (var i in basis) {
                ret[basis[i]=='1'?'1':simplify(basis[i],p,q,r)] = basis[i];
            }
            return ret;
        }
    )(basis);
  
    // As an alternative to the string fiddling, one can also bit-fiddle. In this case the basisvectors are represented by integers with 1 bit per generator set.
    var simplify_bits = (A,B,p2) => {
        var n = p2 || (p+q+r);
        var t = 0;
        var ab = A&B;
        var res = A^B;
        if (ab & ((1<<r)-1)) {
            return [0, 0];
        }
        while (n--) {
            t ^= (A=A>>1);
        }
        t &= B;
        t ^= ab >> (p+r);
        t ^= t >> 16;
        t ^= t >>  8;
        t ^= t >>  4;
        return [1-2*(27030>>(t&15)&1), res];
    };
    var bc = (v) => {
        v = v-((v>>1)& 0x55555555);
        v = (v&0x33333333) + ((v>>2)&0x33333333);
        var c = ((v+(v>>4)&0xF0F0F0F)*0x1010101)>>24;
        return c;
    };
  
    var basisg;
    if (!options.graded && tot <= 6 || options.graded===false || options.Cayley) {
        // Graded generator for high-dimensional algebras.
        var {generator, drm, mulTable, metric, gp} = MultiVectorExtendsFloat32Array(basis, options, simplify, grades, grade_start, tot, p, q, r);
    } else {
        // This generator is UNDER DEVELOPMENT - I'm publishing it so I can test on observable.
        var {generator, counts, basisg} = MultiVectorExtendsArray(basis, simplify_bits, grades, grade_start, tot, low, bc);
    }
  
    var res = ElementExtendsGenerator(
        generator,
        options,
        tot,
        drm,
        counts,
        simplify,
        basis,
        p,
        q,
        r,
        metric,
        mulTable,
        grades,
        gp,
        basisg
    );
  
    if (options.dual) {
        Object.defineProperty(
            res.prototype,
            'Inverse', {
                configurable: true,
                get() {
                    var s = 1 / this.s ** 2;
                    return this.map(
                        (x,i) => i ? -x*s : 1/x
                    );
                }
            }
        );
    } else {
        // Matrix-free inverses up to 5D. Should translate this to an inline call for readability.
        // http://repository.essex.ac.uk/17282/1/TechReport_CES-534.pdf
        Object.defineProperty(
            res.prototype,
            'Inverse', {
                configurable: true,
                get() {
                    return (tot==0)?new this.constructor.Scalar([1/this[0]]):
                    (tot==1)?this.Involute.Mul(this.constructor.Scalar(1/this.Mul(this.Involute)[0])):
                    (tot==2)?this.Conjugate.Mul(this.constructor.Scalar(1/this.Mul(this.Conjugate)[0])):
                    (tot==3)?this.Reverse.Mul(this.Involute).Mul(this.Conjugate).Mul( this.constructor.Scalar(1/this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse)[0])):
                    (tot==4)?this.Conjugate.Mul(this.Mul(this.Conjugate).Map(3,4)).Mul( this.constructor.Scalar(1/this.Mul(this.Conjugate).Mul(this.Mul(this.Conjugate).Map(3,4))[0])):
                          this.Conjugate.Mul(this.Involute).Mul(this.Reverse).Mul(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Map(1,4)).Mul(this.constructor.Scalar(1/this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Mul(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Map(1,4))[0]));
                }
            }
        );
    }
  
    if (options.over) {
        // experimental. do not use.
        res.over = options.over;
        ["Mul","Add","Sub","Scale","Dot","Wedge","LDot","Vee"].forEach(
            x => res.prototype[x] = options.over.inline(res.prototype[x])
        );
        res.prototype.Coeff   = function() {
            for (var i=0,l=arguments.length; i<l; i+=2)
                this[arguments[i]]=(arguments[i+1] instanceof options.over)?arguments[i+1]:options.over.Scalar(arguments[i+1]);
            return this;
        }
        res.prototype.upgrade = function () {
            for (var i=0; i<this.length; i++)
                this[i] = options.over.Scalar(0);
        }
        Object.defineProperty(
            res.prototype,
            'Conjugate', {
                configurable: true,
                get() {
                    var res = new this.constructor();
                    for (var i=0; i<this.length; i++)
                        res[i] = this[i].slice().Scale([1,-1,-1,1][grades[i]%4]);
                    return res;
                }
            }
        );
        Object.defineProperty(
            res.prototype,
            'Reverse', {
                configurable: true,
                get() {
                    var res = new this.constructor();
                    for (var i=0; i<this.length; i++)
                        res[i]= this[i].slice().Scale([1,1,-1,-1][grades[i]%4]);
                    return res;
                }
            }
        );
        Object.defineProperty(
            res.prototype,
            'Involute', {
                configurable: true,
                get() {
                    var res = new this.constructor();
                    for (var i=0; i<this.length; i++)
                        res[i] = this[i].slice().Scale([1,-1,1,-1][grades[i]%4]);
                    return res;
                }
            }
        );
        Object.defineProperty(
            res.prototype,
            'Inverse', {
                configurable: true,
                get() {
                    return (tot==0)?new this.constructor.Scalar([this[0].Inverse]):
                    (tot==1)?this.Involute.Mul(this.constructor.Scalar(this.Mul(this.Involute)[0].Inverse)):
                    (tot==2)?this.Conjugate.Mul(this.constructor.Scalar(this.Mul(this.Conjugate)[0].Inverse)):
                    (tot==3)?this.Reverse.Mul(this.Involute).Mul(this.Conjugate).Mul( this.constructor.Scalar(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse)[0].Inverse)):
                    (tot==4)?this.Conjugate.Mul(this.Mul(this.Conjugate).Map(3,4)).Mul( this.constructor.Scalar(this.Mul(this.Conjugate).Mul(this.Mul(this.Conjugate).Map(3,4))[0].Inverse)):
                          this.Conjugate.Mul(this.Involute).Mul(this.Reverse).Mul(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Map(1,4)).Mul(this.constructor.Scalar(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Mul(this.Mul(this.Conjugate).Mul(this.Involute).Mul(this.Reverse).Map(1,4))[0].Inverse));
                }
            }
        );
        res.prototype.toString = function() {
            return [...this].map((x,i)=>x==0?undefined:(i?'('+x+')'+basis[i]:x.toString())).filter(x=>x).join(' + ');
        }
    }
  
    // Experimental differential operator.
    var _D;
    var _DT;
    var _DA;
    var totd = basis.length;
    function makeD(transpose=false) {
        // same algebra, but over dual numbers.
        _DA = _DA || Algebra({
            p: p,
            q: q,
            r: r,
            basis: options.basis,
            even: options.even,
            over: Algebra({dual:totd})
        });
        return (func) => {
            // convert input function to dual algebra
            var dfunc = _DA.inline(func);
            // return a new function (the derivative w.r.t 1st param)
            return (val,...args) => {
                // allow to be called with scalars.
                if (!(val instanceof res)) {
                    val = res.Scalar(val);
                }
                // upcast args.
                args = args.map(
                    x => {
                        var r = _DA.Scalar(0);
                        for (var i=0; i<totd; i++) {
                            r[i][0]=x[i];
                        }
                        return r;
                    }
                );
                // fill in coefficients and dual components
                for (var dval=_DA.Scalar(0),i=0; i<totd; i++) {
                    dval[i][0]   = val[i];
                    dval[i][1+i] = 1;
                };
                // call the function in the dual algebra.
                var rval = dfunc(dval,...args);
                var r = [...Array(totd)].map(x=>val.slice());
                // downcast transpose from dual algebra to Jacobian vector.
                if (transpose) {
                    for (var i=0; i<totd; i++) {
                        for (var j=0; j<totd; j++) {
                            r[i][j] = rval[i][j+1];
                        }
                    }
                // downcast from dual algebra to Jacobian vector.
                } else {
                    for (var i=0; i<totd; i++) {
                        for (var j=0; j<totd; j++) {
                            r[j][i] = rval[i][j+1];
                        }
                    }
                }
                // return derivative or jacobian.
                return r.length<=2?r[0]:r;
            }
        }
    }
    Object.defineProperty(
        res,
        'D', {
            configurable: true,
            get() {
                if (_D) {
                    return _D;
                }
                _D = makeD(false);
                return _D;
            }
        }
    );
    Object.defineProperty(
        res,
        'Dt', {
            configurable: true,
            get() {
                if (_DT) {
                    return _DT;
                }
                _DT = makeD(true);
                return _DT;
            }
        }
    );
  
    // If a function was passed in, translate, call and return its result. Else just return the Algebra.
    if (fu instanceof Function) {
        return res.inline(fu)();
    } else {
        return res;
    }
}
