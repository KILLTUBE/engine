/**
 * 
 * @param {*} intxt 
 * @param {*} res 
 * @param {Options} options
 * @param {*} Element
 * @param {*} simplify 
 * @param {*} basis 
 */

export default function Element_inline(
    intxt,
    res,
    options,
    Element,
    simplify,
    basis
) {
    //console.log("intxt", intxt);

    // If we are called as a template function.
    /*
    // TODO: fix, arguments.length > 1 is always true since rewrite
    if (arguments.length > 1 || intxt instanceof Array) {
        var args = [].slice.call(arguments, 1);
        return res.inline(new Function(args.map((x, i) => '_template_' + i).join(), 'return (' + intxt.map((x, i) => (x || '') + (args[i] && ('_template_' + i) || '')).join('') + ')')).apply(res, args);
    }
    */
    // Get the source input text.
    var txt = (intxt instanceof Function) ? intxt.toString() : `function(){return (${intxt})}`;
    // Our tokenizer reads the text token by token and stores it in the tok array (as type/token tuples).
    var tok = [];
    var resi = [];
    var t;
    var tokens = [
        // 0: whitespace/comments
        /^[\s\uFFFF]|^[\u000A\u000D\u2028\u2029]|^\/\/[^\n]*\n|^\/\*[\s\S]*?\*\//g,
        // 1: literal strings
        /^\"\"|^\'\'|^\".*?[^\\]\"|^\'.*?[^\\]\'|^\`[\s\S]*?[^\\]\`/g,
        // 2: literal numbers in scientific notation (with small hack for i and e_ asciimath)
        /^\d+[.]{0,1}\d*[ei][\+\-_]{0,1}\d*|^\.\d+[ei][\+\-_]{0,1}\d*|^e_\d*/g,
        // 3: literal hex, nonsci numbers and regex (surround regex with extra brackets!)
        /^\d+[.]{0,1}\d*[E][+-]{0,1}\d*|^\.\d+[E][+-]{0,1}\d*|^0x\d+|^\d+[.]{0,1}\d*|^\.\d+|^\(\/.*[^\\]\/\)/g,
        // 4: punctuator
        /^(\.Normalized|\.Length|\.\.\.|>>>=|===|!==|>>>|<<=|>>=|=>|\|\||[<>\+\-\*%&|^\/!\=]=|\*\*|\+\+|\-\-|<<|>>|\&\&|\^\^|^[{}()\[\];.,<>\+\-\*%|&^!~?:=\/]{1})/g,
        // 5: identifier
        ///^[A-Za-z0-9_]*/g,
        // Same as 5, but supporting unicode identifiers
        /^[$_\p{L}][$_\p{L}\p{Mn}\p{Mc}\p{Nd}\p{Pc}\u200C\u200D]*/gu
    ];
    while (txt.length) {
        for (t in tokens) {
            if (resi = txt.match(tokens[t])) {
                var len = resi[0].length;
                if (len == 0) {
                    debugger;
                //    var charCodes = [];
                //    for (var i=0; i<txt.length; i++) {
                //        var charCode = txt.charCodeAt(i);
                //        if (charCode > 255 || txt.match(/^[a-zA-Z0-9_]/g)) {
                //            charCodes.push(charCode);
                //        } else {
                //            break;
                //        }
                //    }
                //    var codeString = String.fromCharCode(...charCodes);
                //    //console.log("codeString", codeString);
                //    tok.push([t | 0, codeString]);
                //    txt = txt.slice(charCodes.length);
                //    //console.log("tok", tok)
                //    //console.log("txt", txt)
                } else {
                    tok.push([t | 0, resi[0]]);
                    txt = txt.slice(resi[0].length);
                }
                break;
            } // tokenise
        }
    }
    // Translate algebraic literals. (scientific e-notation to "this.Coeff"
    tok = tok.map(t => (t[0] == 2) ? [2, 'Element.Coeff(' + basis.indexOf((!options.Cayley ? simplify : (x) => x)('e' + t[1].split(/e_|e|i/)[1] || 1).replace('-', '')) + ',' + (simplify(t[1].split(/e_|e|i/)[1] || 1).match('-') ? "-1*" : "") + parseFloat(t[1][0] == 'e' ? 1 : t[1].split(/e_|e|i/)[0]) + ')'] : t);
    // String templates (limited support - needs fundamental changes.).
    tok = tok.map(t => (t[0] == 1 && t[1][0] == '`') ? [1, t[1].replace(/\$\{(.*?)\}/g, a => "${" + Element.inline(a.slice(2, -1)).toString().match(/return \((.*)\)/)[1] + "}")] : t);
    // We support two syntaxes, standard js or if you pass in a text, asciimath.
    var syntax = (intxt instanceof Function) ? [
        [
            ['.Normalized', 'Normalize', 2],
            ['.Length', 'Length', 2]
        ], [
            ['~', 'Conjugate', 1],
            ['!', 'Dual', 1]
        ], [
            ['**', 'Pow', 0, 1]
        ], [
            ['^', 'Wedge'],
            ['&', 'Vee'],
            ['<<', 'LDot']
        ], [
            ['*', 'Mul'],
            ['/', 'Div']
        ], [
            ['|', 'Dot']
        ], [
            ['>>>', 'sw', 0, 1]
        ], [
            ['-', 'Sub'],
            ['+', 'Add']
        ], [
            ['%', '%']
        ], [
            ['==', 'eq'],
            ['!=', 'neq'],
            ['<', 'lt'],
            ['>', 'gt'],
            ['<=', 'lte'],
            ['>=', 'gte']
        ]
    ]
        : [
            [['pi', 'Math.PI'], ['sin', 'Math.sin']], [['ddot', 'this.Reverse'], ['tilde', 'this.Involute'], ['hat', 'this.Conjugate'], ['bar', 'this.Dual']], [['^', 'Pow', 0, 1]], [['^^', 'Wedge'], ['*', 'LDot']], [['**', 'Mul'], ['/', 'Div']], [['-', 'Sub'], ['+', 'Add']], [['<', 'lt'], ['>', 'gt'], ['<=', 'lte'], ['>=', 'gte']]];
    // For asciimath, some fixed translations apply (like pi->Math.PI) etc ..
    tok = tok.map(t => (t[0] != 5) ? t : [].concat.apply([], syntax).filter(x => x[0] == t[1]).length ? [5, [].concat.apply([], syntax).filter(x => x[0] == t[1])[0][1]] : t);
    // Now the token-stream is translated recursively.
    function translate(tokens) {
        // helpers : first token to the left of x that is not of a type in the skip list.
        var left = (x = ti - 1, skip = [0]) => {
            while (x >= 0 && ~skip.indexOf(tokens[x][0])) {
                x--;
            }
            return x;
        };
        // first token to the right of x that is not of a type in the skip list.
        var right = (x = ti + 1, skip = [0]) => {
            while (x < tokens.length && ~skip.indexOf(tokens[x][0])) {
                x++;
            }
            return x;
        };
        // glue from x to y as new type, optionally replace the substring with sub.
        var glue = (x, y, tp = 5, sub) => {
            tokens.splice(x, y - x + 1, [tp, ...(sub || tokens.slice(x, y + 1))]);
        };
        // match O-C pairs. returns the 'matching bracket' position
        var match = (O = "(", C = ")") => {
            var o = 1;
            var x = ti + 1;
            while (o) {
                if (tokens[x][1] == O) {
                    o++;
                }
                if (tokens[x][1] == C) {
                    o--;
                }
                x++;
            }
            return x - 1;
        };
        // grouping (resolving brackets).
        for (var ti = 0, t, si; t = tokens[ti]; ti++) {
            if (t[1] == "(") {
                glue(ti, si = match(), 6, [[4, "("], ...translate(tokens.slice(ti + 1, si)), [4, ")"]]);
            }
        }
        // [] dot call and new
        for (var ti = 0, t, si; t = tokens[ti]; ti++) {
            if (t[1] == "[") {
                glue(ti, si = match("[", "]"), 6, [[4, "["], ...translate(tokens.slice(ti + 1, si)), [4, "]"]]);
                if (ti) {
                    ti--;
                }
            }    // matching []
            else if (t[1] == ".") {
                glue(left(), right());
                ti--;
            }                                                                   // dot operator
            else if (t[0] == 6 && ti && left() >= 0 && tokens[left()][0] >= 5 && tokens[left()][1] != "return") {
                glue(left(), ti--)
            }     // collate ( and [
            else if (t[1] == 'new') {
                glue(ti, right())
            };                                                                           // collate new keyword
        }
        // ++ and --
        for (var ti = 0, t; t = tokens[ti]; ti++) {
            if (t[1] == "++" || t[1] == "--") {
                glue(left(), ti);
            }
        }
        // unary - and + are handled seperately from syntax ..
        for (var ti = 0, t, si; t = tokens[ti]; ti++) {
            if (t[1] == "-" && (left() < 0 || (tokens[left()] || [4])[0] == 4)) {
                glue(ti, right(), 5, ["Element.Sub(", tokens[right()], ")"]);   // unary minus works on all types.
            } else if (t[1] == "+" && (tokens[left()] || [0])[0] == 4 && (tokens[left()] || [0])[1][0] != ".") {
                glue(ti, ti + 1);                   // unary plus is glued, only on scalars.
            }
        }
        // now process all operators in the syntax list ..
        for (var si = 0, s; s = syntax[si]; si++) {
            for (var ti = s[0][3] ? tokens.length - 1 : 0, t; t = tokens[ti]; s[0][3] ? ti-- : ti++) {
                for (var opi = 0, op; op = s[opi]; opi++) {
                    if (t[1] == op[0]) {
                        // exception case .. ".Normalized" and ".Length" properties are re-routed (so they work on scalars etc ..)
                        if (op[2] == 2) {
                            var arg = tokens[left()];
                            glue(ti - 1, ti, 5, ["Element." + op[1], "(", arg, ")"]);
                        }
                        // unary operators (all are to the left)
                        else if (op[2]) {
                            var arg = tokens[right()];
                            glue(ti, right(), 5, ["Element." + op[1], "(", arg, ")"]);
                        }
                        // binary operators
                        else {
                            var l = left();
                            var r = right();
                            var a1 = tokens[l];
                            var a2 = tokens[r];
                            if (op[0] == op[1]) {
                                glue(l, r, 5, [a1, op[1], a2]);
                            } else {
                                glue(l, r, 5, ["Element." + op[1], "(", a1, ",", a2, ")"]);
                            }
                            ti--;
                        }
                    }
                }
            }
        }
        return tokens;
    }
    // Glue all back together and return as bound function.
    return eval(('(' + (function f(t) {
        return t.map(t => t instanceof Array ? f(t) : typeof t == "string" ? t : "").join('');
    })(translate(tok)) + ')'));
}
