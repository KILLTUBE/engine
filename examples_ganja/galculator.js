import Algebra from "../src/ganja/index.js";

function Galculator() {
    // Minimal calculator implementation. Globals for our current algebra, mode, history, variables etc ..  
    this.Al = Algebra();
    this.mode = 0;
    this.histor = '';
    this.cur = '';
    this.store = false;
    this.help = false;
    this.x1 = undefined;
    this.x2 = undefined;
    this.x3 = undefined;
    this.x4 = undefined;
    this.x5 = undefined;
    this.x6 = undefined;
    this.x7 = undefined;
    this.x8 = undefined;
    this.x9 = undefined;
    this.x10 = undefined;
    
    // Grab some of our elements.  
    this.graph = document.getElementById('graph');
    this.hist  = document.getElementById('hist');
    this.title = document.getElementById('title');
    this.calcBody = document.getElementById('calcBody');

    this.graph.style.opacity = '0.3';

    this.buttons = this.getButtons();

    // Add all the buttons and install mouse and touch handlers. 
    var j = 0;
    var p;
    for (var i in this.buttons) {
        var buttonObject = this.buttons[i];
        // Every 8 buttons, start a new group.
        if (j%8 == 0) {
            p = this.calcBody.appendChild(
                Object.assign(document.createElement('div'), {
                    className: 'group'
                })
            );
        }
        // Add the button to the current group.
        var button = p.appendChild(
            Object.assign(document.createElement('div'), {
                className: "numButton noselect " + (buttonObject.color || ''),
                innerHTML: buttonObject.label
            })
        );
        buttonObject.el = button;
        button.ontouchend = this.ontouchend(buttonObject);
        button.ontouchstart = button.onmouseup = this.onmouseup(buttonObject);
        j++;
    }
    
    this.buttons.up.el.classList.add('disabled');
    this.buttons.dwn.el.classList.add('disabled');

    this.E();
    this.e();

    // patch for cocoon.io
    document.body.ontouchstart = function(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    document.body.ontouchmove  = function(e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

/**
 * 
 * @param {GalculatorButtonObject} buttonObject 
 * @returns {(e:MouseEvent) => void}
 */
Galculator.prototype.onmouseup = function(buttonObject) {
    var self = this;
    return function(e) {
        e.preventDefault();
        e.stopPropagation();
        // Show touch response and vibrate on mobile.
        if (window.TouchEvent && e instanceof TouchEvent) {
            this.classList.add('active');
        }
        navigator.vibrate && navigator.vibrate(50);
        // Show help if needed. 
        if (self.help) {
            self.help = false;
            self.histor = '';
            return self.print(buttonObject.help || 'no help for this button.');
        }
        // Call button click handler.  
        buttonObject.click.bind(self)();
    }
}

/**
 * 
 * @param {GalculatorButtonObject} buttonObject 
 * @returns {(e:TouchEvent) => void}
 */
Galculator.prototype.ontouchend = function(buttonObject) {
    var self = this;
    return function(e) {
        this.classList.remove('active');
    }
}

/**
 * Shorthand to enable/disable buttons depending on mode.
 * @param {any} [x0] 
 * @param {any} [x1] 
 * @param {any} [x2] 
 * @param {any} [x3] 
 * @param {any} [x4] 
 * @param {any} [x5] 
 */
Galculator.prototype.e = function(x0, x1, x2, x3, x4, x5) {
    ['Conj','dual','rev','pss'].forEach(
        x => this.buttons[x].el.classList[(arguments.length==0)?'add':'remove']('disabled')
    );
    ['ori','inf'/*,'up','dwn'*/].forEach(
        x => this.buttons[x].el.classList[(this.mode ==5 || this.mode == 6)?'remove':'add']('disabled')
    );
    for (var i=0; i<6; i++) {
        this.buttons['e' + i].el.classList[arguments[i]?'remove':'add']('disabled');
    }
}

/**
 * 
 * @param {any} [x0] 
 * @param {any} [x1] 
 * @param {any} [x2] 
 * @param {any} [x3] 
 * @param {any} [x4] 
 * @param {any} [x5] 
 */
Galculator.prototype.E = function(x0, x1, x2, x3, x4, x5) {
    ["^","V","."].forEach(
        x => this.buttons[x].el.classList[(arguments.length==0)?'add':'remove']('disabled')
    );
    this.e(x0,x1,x2,x3,x4,x5);
    for (var i=0; i<6; i++) {
        this.buttons['E' + i].el.classList[arguments[i]?'remove':'add']('disabled');
    }
}

/**
 * @returns {GalculatorButtonObject[]}
 */
Galculator.prototype.getButtons = function() {
    
    // Our calculator buttons.   
    var buttons = {
        // metric selection.
        "R" : {
            color:'green',
            label : "<SPAN CLASS='outline'>R</SPAN>",
            click : this.buttonR,
            help: "<I CLASS='outline'>R</I>: Real Numbers."
        },
        "C" : {
            color:'green',
            label: "<SPAN CLASS='outline'>C</SPAN><DIV CLASS='mini'>0,1</DIV>",
            click: this.buttonC,
            help: '<I CLASS="outline">C</I>: Complex Numbers.'
        },
        "D" : {
            color:'green',
            label : "<SPAN CLASS='outline'>D</SPAN><DIV CLASS='mini'>0,0,1</DIV>",
            click : this.buttonD,
            help: '<I CLASS="outline">D</I>: Dual Numbers.'
        },
        "M" : {
            color:'green',
            label : "<SPAN CLASS='outline'>M</SPAN><DIV CLASS='mini'>1,3</DIV>",
            click : this.buttonM,
            help:'<I CLASS="outline">M</I> : <I CLASS="outline">R</I><SUB>1,3</SUB> : Minkowski spacetime.'
        },
        "P2D" : {
            color:'green',
            label : "P2D<DIV CLASS='mini'>2,0,1</DIV>",
            click : this.buttonP2D,
            help: this.toHelp(`PGA2D Cheat Sheet<HR><TABLE CLASS="help" STYLE="position:relative; display:table" WIDTH=100%><TR><TD>point at (x,y)<TD>E0_-xE1_+yE2<TR><TD>line ax + by + c = 0<TD>ae1_+be2_+ce0<TR><TD>join points P,Q<TD>P_&Q<TR><TD>intersect lines a,b<TD>a_^b<TR><TD>line through P ortho to a<TD>a_.P<TR><TD>project P onto a<TD>a_.P_*a<TR><TD>line through P parallel to a<TD>a_.P_*P<TR><TD>Rotator &alpha; around P<TD>_(&alpha;_*P_/<i>2</i>_)<i style="width:40px" class="blue">exp</i><TR><TD>Motor x,y<TD><i>1</i>_+xE1_+yE2</TABLE><HR>`)
        },
        "P3D" : {
            color:'green',
            label: "P3D<DIV CLASS='mini'>3,0,1</DIV>",
            click : this.buttonP3D,
            help: this.toHelp(`PGA3D Cheat Sheet<HR><TABLE CLASS="help" STYLE="position:relative; display:table" WIDTH=100%><TR><TD>point at (x,y,z)<TD>E0_-xE1_+yE2_+zE3<TR><TD>plane ax + by + cz + d = 0<TD>ae1_+be2_+ce3_+de0<TR><TD>join elements x,y<TD>x_&y<TR><TD>intersect elements x,y<TD>x_^y<TR><TD>plane through P ortho to a<TD>a_.P<TR><TD>project x onto y<TD>x_.y_*y<TR><TD>plane through P parallel to a<TD>a_.P_*P<TR><TD>Rotator &alpha; around L<TD>_(&alpha;_*L_/<i>2</i>_)<i style="width:40px" class="blue">exp</i><TR><TD>Motor x*2,y*2,z*2<TD><i>1</i>_+xE1_+yE2_+zE3</TABLE><HR>`)
        },
        "C2D" : {
            color:'green',
            label : "C2D<DIV CLASS='mini'>3,1</DIV>",
            click : this.buttonC2D,
            help:"C(<I CLASS='outline'>R</I><SUB>3,1</SUB>): Conformal 2D Geometric Algebra."
        },
        "C3D" : {
            color:'green',
            label : "C3D<DIV CLASS='mini'>4,1</DIV>",
            click : this.buttonC3D,
            help: "C(<I CLASS='outline'>R</I><SUB>4,1</SUB>): Conformal 3D Geometric Algebra."
        },
        // basis vectors + store
        "e0" :  {
            label: "e0",
            click: this.button_e0,
            help: "e<sub>0</sub> basisvector."
        },
        "e1" :  {
            label : "e1",
            click : this.button_e1,
            help: "e<sub>1</sub> basisvector."
        },
        "e2" :  {
            label : "e2",
            click : this.button_e2,
            help: "e<sub>2</sub> basisvector."
        },
        "e3" :  {
            label : "e3",
            click : this.button_e3,
            help: "e<sub>3</sub> basisvector."
        },
        "e4" :  {
            label : "e4",
            click : this.button_e4,
            help: "e<sub>4</sub> basisvector."
        },
        "e5" :  {
            label : "e5",
            click : this.button_e5,
            help: "e<sub>5</sub> basisvector."
        },
        "ori":  {
            label: "ori",
            click : this.button_ori,
            help: "origin : 0.5e<sub>+</sub> + 0.5e<sub>-</sub>"
        },
        "_?" :  {
            color:'blue',
            label : "?",
            click : this.button_help,
            help: "Click help and any button for more help."
        },
        // basis dual vectors + x1
        "E0" :  {
            label : "E0",
            click : this.button_E0,
            help: "dual of e<sub>0</sub> basisvector."
        },
        "E1" :  {
            label : "E1",
            click : this.button_E1,
            help:"dual of e<sub>1</sub> basisvector."
        },
        "E2" :  {
            label : "E2",
            click : this.button_E2,
            help: "dual of e<sub>2</sub> basisvector."
        },
        "E3": {
            label: "E3",
            click: this.button_E3,
            help: "dual of e<sub>3</sub> basisvector."
        },
        "E4": {
            label : "E4",
            click : this.button_E4,
            help:"dual of e<sub>4</sub> basisvector."
        },
        "E5" :  {
            label : "E5",
            click : this.button_E5,
            help:"dual of e<sub>5</sub> basisvector."
        },
        "inf":  {
            label : "inf",
            click : this.button_inf,
            help: "infinity : e<sub>-</sub> - e<sub>+</sub>"
        },
        "st" :  {
            color:'purple',
            label : "st",
            click : this.button_st,
            help: "ST : Store variable. (follow by x1 to x10)"
        },
        // pss, dual, reverse, .. 
        "pss":  {
            label : "pss",
            click : this.button_pss,
            help: "Pseudo-Scalar"
        },
        "inv":  {
            color:'blue',
            label : "x<sup>-1</sup>",
            click : this.button_inv,
            help:"Inverse"
        },
        "up":   {
            color:'blue',
            label : "&#x21E7;",
            click : this.button_up,
            help: "from euclidean to conformal space"
        },
        "dwn":  {
            color: 'blue',
            label : "&#x21E9",
            click  : this.button_dwn,
            help:"from conformal to euclidean space"
        },
        "dual": {
            color:'blue',
            label : "Dual",
            click : this.button_dual,
            help: "Multivector Dual"
        },
        "rev":  {
            color:'blue',
            label : "Rev",
            click : this.button_rev,
            help: "Multivector Reverse"
        },
        "x1" :  {
            color:'purple',
            label : "x<sub>1</sub>",
            click : this.button_x1,
            help:"x1 variable"
        },
        "x6" :  {
            color:'purple',
            label : "x<sub>6</sub>",
            click : this.button_x6,
            help:"x6 variable"
        },
        // 7,8,9,-,/,Exp,x2
        "_7" :  {
            label : "7",
            click : this.button_7
        },
        "_8" :  {
            label : "8",
            click : this.button_8
        },
        "_9" :  {
            label : "9",
            click : this.button_9
        },
        "-"  :  {
            color:'blue',
            label : "-",
            click : this.button_substract,
            help: "subtract"
        },
        "/"  :  {
            color:'blue',
            label : "/",
            click : this.button_divide,
            help: "divide"
        },
        "Exp":  {
            color:'blue',
            label : "Exp",
            click : this.button_exponentiate,
            help: "exponentiate"
        },
        "x2" :  {
            color:'purple',
            label : "x<sub>2</sub>",
            click : this.button_x2,
            help: "x2 variable"
        },
        "x7" :  {
            color:'purple',
            label : "x<sub>7</sub>",
            click : this.button_x7,
            help:"x7 variable"
        },
        // 4,5,6,+,*,Conjugate,x3
        "_4" :  {
            label : "4",
            click : this.button_4,
            help: 'P(<I CLASS="outline">R</I>*<SUB>2,0,1</SUB>): Projective 2D Geometric Algebra. (euclidian plane).<HR>Solve the system of equations : x+y-0.5=0 and 2x-y=0<HR><DIV class="help" style="position:relative"> <i class="green" STYLE="width:60px">P2D</i><i>e<sub>1</sub></i><i class="blue">+</i><i>e<sub>2</sub></i><i class="blue">-</i><i>0</i><i>.</i><i>5</i><i>e<sub>0</sub></i><i class="purple">ST</i><i class="purple">x1</i><BR><i class="green">Cl</i><i>2</i><i>e<sub>1</sub></i><i class="blue">-</i><i>e<sub>2</sub></i><i class="purple">ST</i><i class="purple">x2</i><BR><i class="green">Cl</i><i class="purple">x1</i><i class="blue">&#x2227;</i><i class="purple">x2</i><i class="purple">ST</i><i class="purple">x3</i><BR><i class="green">Cl</i><i class="purple">x3</i><i class="blue">/</i><i class="blue">(</i><i class="blue">-</i><i>E<sub>0</sub></i><i class="blue">&#x25cf;</i><i class="purple">x3</i><i class="blue">)</i><i class="red">=</i> </DIV><HR>'
        },
        "_5" :  {
            label : "5",
            click : this.button_5
        },
        "_6" :  {
            label : "6",
            click : this.button_6
        },
        "_+" :  {
            color:'blue',
            label : "+",
            click : this.button_add,
            help: "add"
        },
        "_*" :  {
            color:'blue',
            label : "&#x2217;",
            click : this.button_mul,
            help: "multiply (Geometric Product)"
        },
        "Conj": {
            color:'blue',
            label : "Conj",
            click : this.button_conj,
            help: "Clifford Conjugate"
        },
        "x3" :  {
            color:'purple',
            label : "x<sub>3</sub>",
            click : this.button_x3,
            help: "x3 variable"
        },
        "x8" :  {
            color:'purple',
            label : "x<sub>8</sub>",
            click : this.button_x8,
            help:"x8 variable"
        },
        // 1,2,3,^,.,(,x4
        "_1" :  {
            label : "1",
            click : this.button_1,
            help: '<I CLASS="outline">C</I>: Complex Numbers.<HR>Example: calculate (3+2i)*(1+4i)<HR><DIV class="help" style="position:relative"><i class="green"><SPAN CLASS="outline">C</SPAN></i><i class="blue">(</i><i>3</i><i class="blue">+</i><i>2</i><i>e<sub>1</sub></i><i class="blue">)</i><i class="blue">*</i><i class="blue">(</i><i>1</i><i class="blue">+</i><i>4</i><i>e<sub>1</sub></i><i class="blue">)</i><i class="red">=</i></DIV><HR>'
        },
        "_2" :  {
            label : "2",
            click : this.button_2,
            help:'<I CLASS="outline">D</I>: Dual Numbers.<HR>Example: Calculate the value of the function and first derivative at x=3<BR>x<sup>3</sup>-2x<sup>2</sup>+3<HR><DIV class="help" style="position:relative"><i class="green"><SPAN CLASS="outline">D</SPAN></i><i>3</i><i class="blue">+</i><i>e<sub>0</sub></i><i class="purple">ST</i><i class="purple">x1</i><BR><i class="green">Cl</i><i class="purple">x1</i><i class="blue">*</i><i class="purple">x1</i><i class="blue">*</i><i class="purple">x1</i><i class="blue">-</i><i>2</i><i class="blue">*</i><i class="purple">x1</i><i class="blue">*</i><i class="purple">x1</i><i class="blue">+</i><i>3</i><i class="red">=</i></DIV><HR>'
        },
        "_3" :  {
            label : "3",
            click : this.button_3,
            help: '<I CLASS="outline">M</I> : <I CLASS="outline">R</I><SUB>1,3</SUB> : Minkowski spacetime.<HR>You see two simultaneous lightning strikes in 10 microseconds, one where you are, one 20 km in the x-direction. Are these events simultaneous for a spaceship flying at 0.5c in the x-direction? (given : atanh(0.5)=0.5493)<HR><DIV class="help" style="position:relative"><i class="green"><SPAN CLASS="outline">M</SPAN></i><i>0</i><i>.</i><i>0</i><i>0</i><i>0</i><i>0</i><i>1</i><i>e<sub>1</sub></i><i class="purple">ST</i><i class="purple">x1</i><BR><i class="blue">+</i><i>2</i><i>0</i><i>e<sub>2</sub></i><i class="blue">/</i><i>3</i><i>0</i><i>0</i><i>0</i><i>0</i><i>0</i><i class="purple">ST</i><i class="purple">x2</i><BR><i class="green">Cl</i><i class="blue">(</i><I>0</i><I>.</i><I>5</i><I>4</i><I>9</i><I>3</i><i class="blue">*</i><i>.</i><i>5</i><i>e<sub>1</sub></i><i>e<sub>2</sub></i><i class="blue">)</i><i class="blue" STYLE="width:50px">Exp</i><i class="purple">ST</i><i class="purple">x3</i><BR><i class="green">Cl</i><i class="purple">x3</i><i class="blue">*</i><i class="purple">x1</i><i class="blue">*</i><i class="purple">x3</i><i class="blue">x&#772;</i><i class="purple">ST</i><i class="purple">x4</i><BR><i class="green">Cl</i><i class="purple">x3</i><i class="blue">*</i><i class="purple">x2</i><i class="blue">*</i><i class="purple">x3</i><i class="blue">x&#772;</i><i class="purple">ST</i><i class="purple">x5</i></DIV><HR>'
        },
        "^"  :  {
            color:'blue',
            label : "&#x2227;",
            click : this.button_outerProduct,
            help: "outer product"
        },
        "."  :  {
            color:'blue',
            label : "&#x25cf;",
            click : this.button_innerProduct,
            help: "inner product (left contraction)"
        },
        "("  :  {
            color:'blue',
            label : "(",
            click : this.button_bracketOpen
        },
        "x4" :  {
            color:'purple',
            label : "x<sub>4</sub>",
            click : this.button_x4,
            help:"x4 variable"
        },
        "x9" :  {
            color:'purple',
            label : "x<sub>9</sub>",
            click : this.button_x9,
            help:"x9 variable"
        },
        // Cl,0,.,
        "Cl" :  {
            color:'green',
            label : "Cl",
            click : this.button_clear,
            help: "Cl : clear last result / all"
        },
        "_0" :  {
            label : "0",
            click : this.button_0
        },
        "_." :  {
            label : ".",
            click : this.button_point
        },
        "V"  :  {
            color:'blue',
            label : "&#x2228;",
            click : this.button_dualOuterProduct,
            help: "dual outer product."
        },
        "="  :  {
            color:'red',
            label : "=",
            click: this.button_equals
        },
        ")"  :  {
            color:'blue',
            label : ")",
            click : this.button_bracketClose
        },
        "x5" :  {
            color:'purple',
            label: "x<sub>5</sub>",
            click: this.button_x5,
            help: "x5 variable"
        },
        "x10" :  {
            color:'purple',
            label: "x<sub>10</sub>",
            click: this.button_x10,
            help: "x10 variable"
        }
    }
    return buttons;
}

/**
 * Pretty print into the numerical and graphical displays.
 * @param {*} x 
 */
Galculator.prototype.show = function(x) {
    x=x.replace(/e([012345]+)/g,'e<sub>$1</sub>').replace(/&/g,'&#x2228;').replace(/\^/g,'&#x2227;').replace(/\<\</,'&#x25cf;')
    document.getElementById('screen').innerHTML=x||'0';
    if ((this.mode == 3 || this.mode == 4 || this.mode == 5) && [this.x1,this.x2,this.x3,this.x4,this.x5].filter(x=>x).length) {
        var options = {};
        if (this.mode == 5) {
            options.conformal = true;
        }
        while (this.graph.firstChild) {
            this.graph.removeChild(this.graph.firstChild);
        }
        var c = this.graph.appendChild(this.Al.graph([this.x1,this.x2,this.x3,this.x4,this.x5].filter(x=>x).map(x=>x.slice()),options));
        c.style.width = c.style.height = '100%';
        c.style.backgroundColor='transparent';
    }
}

/**
 * Print into the history.
 * @param {any} x 
 */
Galculator.prototype.print = function(x) {
    this.histor += '<BR>' + x;
    this.hist.innerHTML = this.histor.split('<BR>').slice(-10).join('<BR>');
}

/**
 * Patch up of ganja.js asciimath output to our input format.
 * @example
 * galculator.patch("e_1+e_2");
 * 
 * tmp will be: =1e<sub>1</sub>+1e<sub>2</sub>
 * will return: "1e1+1e2"
 * @param {any} x
 */

Galculator.prototype.patch = function(x) {
    //console.log("patch input: x=", x)
    var tmp = ((!x.match(/=/))?this.cur+'=':'') + x;
    tmp = tmp.replace(/i/g,'e_1');
    tmp = tmp.replace(/([^\d])e_|^e_/g,'$11e_');
    tmp = tmp.replace(/e_/g,'e');
    tmp = tmp.replace(/e([012345]+)/g,'e<sub>$1</sub>');
    tmp = tmp.replace(/&/g,'&#x2228;');
    tmp = tmp.replace(/\^/g,'&#x2227;');
    tmp = tmp.replace(/\<\</,'&#x25cf;');
    this.print(tmp);
    //console.log("tmp", tmp);
    x = x.replace(/([^\d]*\d*\.\d\d\d\d\d\d)(\d*)/g,'$1')
    x = x.replace(/i/g,'e_1')
    x = x.replace(/([^\d])e_|^e_/g,'$11e_')
    x = x.replace(/e_/g,'e');
    //console.log("patch x end: ", x);
    return x;
}

/**
 * Helper to display pretty help.
 * @param {any} x
 */
Galculator.prototype.toHelp = function(x) {
    x = x.replace(/([eE])(\d+)/g,'<i>$1<SUB>$2</SUB></i>')
    x = x.replace(/_([\+\-\/\?\(\)])/g,'<i class="blue">$1</i>')
    x = x.replace(/_\^/g,'<i class="blue">&#x2227;</i>')
    x = x.replace(/_\&/g,'<i class="blue">&#x2228;</i>')
    x = x.replace(/_\./g,'<i class="blue">&#x25cf;</i>')
    x = x.replace(/_\*/g,'<i class="blue">&#x2217;</i>');
    return x;
}

// Welcome message 
Galculator.prototype.hello = function() {
    this.print(this.toHelp('Enki\'s GAlculator - Geometric Algebra Pocket Calculator<DIV class="help" style="position:relative"><HR>Cheat sheet : _? + <i class="green" STYLE="width:40px">P2D</i>,<i class="green" STYLE="width:40px">P3D</i> &nbsp;<BR>Examples : _? + <I>1</I>, <I>2</I>, <i>3</i>, <i>4</i>&nbsp;<HR>'))
}
    

    /**
    * Mode 0: Real Numbers
    * Mode 1: Complex Numbers
    * Mode 2: Minkowski spacetime
    * Mode 3: P2D (2,0,1)
    * Mode 4: P3D (3,0,1)
    * Mode 5: C2D (3,1)
    * Mode 6: C3D (4,1)
    * Mode 7: Dual Numbers
    */

Galculator.prototype.buttonR = function() {
    this.E();
    this.e();
    this.Al=Algebra();
    this.graph.style.opacity = "0.3";
    this.hist.style.visibility='visible';
    this.mode=0;
    this.title.innerHTML="<SPAN CLASS='outline'>R</SPAN>";
}

Galculator.prototype.buttonC = function() {
    this.mode=1;
    this.E();
    this.e(0,1,0,0,0,0);
    this.Al=Algebra(0, 1);
    this.graph.style.opacity = "0.3";
    this.hist.style.visibility='visible';
    this.title.innerHTML="<SPAN CLASS='outline'>C</SPAN> - <SPAN CLASS='outline'>R</SPAN><sub>0,1</sub>";
}

Galculator.prototype.buttonD = function() {
    this.mode=7;
    this.E();
    this.e(1,0,0,0,0,0);
    this.Al=Algebra(0,0,1);
    this.graph.style.opacity = "0.3";
    this.hist.style.visibility='visible';
    this.title.innerHTML = "<SPAN CLASS='outline'>D</SPAN> - <SPAN CLASS='outline'>R</SPAN><sub>0,0,1</sub>";
}

Galculator.prototype.buttonM = function() {
    this.mode=2;
    this.E(0,1,1,1,1,0);
    this.Al=Algebra(1,3);
    this.graph.style.opacity = "0.3";
    this.hist.style.visibility='visible';
    this.title.innerHTML = "<SPAN CLASS='outline'>M</SPAN> - <SPAN CLASS='outline'>R</SPAN><sub>1,3</sub>";
}

Galculator.prototype.buttonP2D = function() {
    this.mode=3;
    this.E(1,1,1,0,0,0);
    this.Al = Algebra(2,0,1);
    this.graph.style.opacity = "1";
    this.hist.style.visibility='visible';
    this.title.innerHTML="P2D - P(<SPAN CLASS='outline'>R</SPAN>*<sub>2,0,1</sub>)";
}

Galculator.prototype.buttonP3D = function() {
    this.mode=4;
    this.E(1,1,1,1,0,0);
    this.Al=Algebra(3,0,1);
    this.graph.style.opacity = "1";
    this.hist.style.visibility='visible';
    this.title.innerHTML="P3D - P(<SPAN CLASS='outline'>R</SPAN>*<sub>3,0,1</sub>)";
}

Galculator.prototype.buttonC2D = function() {
    this.mode=5;
    this.E(0,1,1,1,1,0);
    this.Al=Algebra(3,1,0);
    this.graph.style.opacity = "1";
    this.hist.style.visibility='visible';
    this.title.innerHTML = "C2D - C(<SPAN CLASS='outline'>R</SPAN><sub>3,1</sub>)";
}

Galculator.prototype.buttonC3D = function() {
    this.mode=6;
    this.E(0,1,1,1,1,1);
    this.Al=Algebra(4,1,0);
    this.graph.style.opacity = "0.3";
    this.hist.style.visibility='visible';
    this.title.innerHTML="C3D - C(<SPAN CLASS='outline'>R</SPAN><sub>4,1</sub>)";
}

Galculator.prototype.button_e0 = function() {
    this.cur += this.cur.match(/e\d+$/)?'0':this.cur.match(/\d+$/)?'e0':'1e0';
    this.show(this.cur);
}

Galculator.prototype.button_e1 = function() {
    this.cur += this.cur.match(/e\d+$/)?'1':this.cur.match(/\d+$/)?'e1':'1e1';
    this.show(this.cur);
}

Galculator.prototype.button_e2 = function() {
    this.cur += this.cur.match(/e\d+$/)?'2':this.cur.match(/\d+$/)?'e2':'1e2';
    this.show(this.cur);
}

Galculator.prototype.button_e3 = function() {
    this.cur += this.cur.match(/e\d+$/)?'3':this.cur.match(/\d+$/)?'e3':'1e3';
    this.show(this.cur);
}

Galculator.prototype.button_e4 = function() {
    this.cur += this.cur.match(/e\d+$/)?'4':this.cur.match(/\d+$/)?'e4':'1e4';
    this.show(this.cur);
}

Galculator.prototype.button_e5 = function() {
    this.cur += this.cur.match(/e\d+$/)?'5':this.cur.match(/\d+$/)?'e5':'1e5';
    this.show(this.cur);
}

Galculator.prototype.button_ori = function() {
    this.cur += (this.cur.match(/\d$/)?'*':'')+'(.5e3+.5e4)';
    this.show(this.cur);
}

Galculator.prototype.button_help = function() {
    this.print('Click any button for help.');
    this.help = true;
}

Galculator.prototype.button_E0 = function() {
    var s=this.Al.inline('1e0.Dual')().toString().replace('_','');
    this.cur += this.cur.match(/e\d+$/)?'0':this.cur.match(/\d+$/)?s:('1'+s);
    this.show(this.cur);
}

Galculator.prototype.button_E1 = function() {
    var s=this.Al.inline('1e1.Dual')().toString().replace('_','');
    this.cur += this.cur.match(/e\d+$/)?'1':this.cur.match(/\d+$/)?s:('1'+s);
    this.show(this.cur);
}

Galculator.prototype.button_E2 = function() {
    var s=this.Al.inline('1e2.Dual')().toString().replace('_','');
    this.cur += this.cur.match(/e\d+$/)?'2':this.cur.match(/\d+$/)?s:('1'+s);
    this.show(this.cur);
}

Galculator.prototype.button_E3 = function() {
    var s=this.Al.inline('1e3.Dual')().toString().replace('_','');
    this.cur += this.cur.match(/e\d+$/)?'3':this.cur.match(/\d+$/)?s:('1'+s);
    this.show(this.cur);
}

Galculator.prototype.button_E4 = function() {
    var s = this.Al.inline('1e4.Dual')().toString().replace('_','');
    this.cur += this.cur.match(/e\d+$/)?'4':this.cur.match(/\d+$/)?s:('1'+s);
    this.show(this.cur);
}

Galculator.prototype.button_E5 = function() {
    var s = this.Al.inline('1e5.Dual')().toString().replace('_','');
    this.cur += this.cur.match(/e\d+$/)?'5':this.cur.match(/\d+$/)?s:('1'+s);
    this.show(this.cur);
}

Galculator.prototype.button_inf = function() {
    this.cur += (this.cur.match(/\d$/)?'*':'')+'(1e4-1e3)';
    this.show(this.cur);
}

Galculator.prototype.button_st = function() {
    this.store = true;
}

Galculator.prototype.button_pss = function() {
    this.cur = this.cur.match(/\d+$/)?'':'1'+['','e1','e1234','e012','e0123','e1234','e12345'][this.mode];
    this.show(this.cur);
}

Galculator.prototype.button_inv = function() {
    this.cur += '**-1';
    this.show(this.cur);
}

Galculator.prototype.button_up = function() {
    this.cur += '';
    this.show(this.cur);
}

Galculator.prototype.button_dwn = function() {
    this.cur += '';
    this.show(this.cur);
}

Galculator.prototype.button_dual = function() {
    this.cur += '.Dual';
    this.show(this.cur);
}

Galculator.prototype.button_rev = function() {
    this.cur += '.Reverse';
    this.show(this.cur);
}

Galculator.prototype.button_x1 = function() {
    if (this.store) {
        this.store = false;
        this.x1 = this.Al.inline(new Function('return ' + this.cur))();
        this.patch('x1=' + this.x1.toString());
        return this.show(this.cur);
    }
    this.cur += 'x1';
    this.show(this.cur);
}

Galculator.prototype.button_x6 = function() {
    if (this.store) {
        this.store = false;
        this.x6 = this.Al.inline(new Function('return ' + this.cur))();
        this.patch('x6=' + this.x6.toString());
        return this.show(this.cur);
    }
    this.cur += 'x6';
    this.show(this.cur);
}

Galculator.prototype.button_7 = function() {
    this.cur += '7';
    this.show(this.cur);
}

Galculator.prototype.button_8 = function() {
    this.cur += '8';
    this.show(this.cur);
}

Galculator.prototype.button_9 = function() {
    this.cur += '9';
    this.show(this.cur);
}

Galculator.prototype.button_substract = function() {
    this.cur += '-';
    this.show(this.cur);
}

Galculator.prototype.button_divide = function() {
    this.cur += '/';
    this.show(this.cur);
}

Galculator.prototype.button_exponentiate = function() {
    this.cur += '.Exp()';
    this.show(this.cur);
}

Galculator.prototype.button_x2 = function() {
    if (this.store) {
        this.store = false;
        this.x2 = this.Al.inline(new Function('return '+this.cur))();
        this.patch('x2=' + this.x2.toString());
        return this.show(this.cur);
    }
    this.cur += 'x2';
    this.show(this.cur);
}

Galculator.prototype.button_x7 = function() {
    if (this.store) {
        this.store = false;
        this.x7 = this.Al.inline(new Function('return '+this.cur))();
        this.patch('x7=' + this.x7.toString());
        return this.show(this.cur);
    }
    this.cur += 'x7';
    this.show(this.cur);
}

Galculator.prototype.button_4 = function() {
    this.cur += '4';
    this.show(this.cur);
}

Galculator.prototype.button_5 = function() {
    this.cur += '5';
    this.show(this.cur);
}

Galculator.prototype.button_6 = function() {
    this.cur += '6';
    this.show(this.cur);
}

Galculator.prototype.button_add = function() {
    this.cur += '+';
    this.show(this.cur);
}

Galculator.prototype.button_mul = function() {
    this.cur += '*';
    this.show(this.cur);
}

Galculator.prototype.button_conj = function() {
    this.cur += '.Conjugate';
    this.show(this.cur);
}

Galculator.prototype.button_x3 = function() {
    if (this.store) {
        this.store = false;
        this.x3 = this.Al.inline(new Function('return ' + this.cur))();
        this.patch('x3=' + this.x3.toString());
        return this.show(this.cur);
    }
    this.cur += 'x3';
    this.show(this.cur);
}

Galculator.prototype.button_x8 = function() {
    if (this.store) {
        this.store = false;
        this.x8 = this.Al.inline(new Function('return '+this.cur))();
        this.patch('x8=' + this.x8.toString());
        return this.show(this.cur);
    }
    this.cur += 'x8';
    this.show(this.cur);
}

Galculator.prototype.button_1 = function() {
    this.cur += '1';
    this.show(this.cur);
}

Galculator.prototype.button_2 = function() {
    this.cur += '2';
    this.show(this.cur);
}

Galculator.prototype.button_3 = function() {
    this.cur += '3';
    this.show(this.cur);
}

Galculator.prototype.button_outerProduct = function() {
    this.cur += '^';
    this.show(this.cur);
}

Galculator.prototype.button_innerProduct = function() {
    this.cur += '<<';
    this.show(this.cur);
}

Galculator.prototype.button_bracketOpen = function() {
    this.cur += '(';
    this.show(this.cur);
}

Galculator.prototype.button_x4 = function() {
    if (this.store) {
        this.store = false;
        this.x4 = this.Al.inline(new Function('return ' + this.cur))();
        this.patch('x4=' + this.x4.toString());
        return this.show(this.cur);
    }
    this.cur += 'x4';
    this.show(this.cur);
}

Galculator.prototype.button_x9 = function() {
    if (this.store) {
        this.store = false;
        this.x9 = this.Al.inline(new Function('return '+this.cur))();
        this.patch('x9=' + this.x9.toString());
        return this.show(this.cur);
    }
    this.cur += 'x9';
    this.show(this.cur);
}

Galculator.prototype.button_clear = function() {
    if (this.cur == '') {
        if (this.histor == '') {
            while(this.graph.firstChild) {
                this.graph.removeChild(this.graph.firstChild);
            }
            this.x1=this.x2=this.x3=this.x4=this.x5=this.x6=this.x7=this.x8=this.x9=this.x10=undefined;
            return this.hello();
        }
        this.histor='';
        this.hist.innerHTML = this.histor;
    };
    this.cur = '';
    this.show(this.cur);
}

Galculator.prototype.button_0 = function() {
    this.cur += '0';
    this.show(this.cur);
}

Galculator.prototype.button_point = function() {
    this.cur += '.';
    this.show(this.cur);
}

Galculator.prototype.button_dualOuterProduct = function() {
    this.cur += '&';
    this.show(this.cur);
}

Galculator.prototype.button_equals = function() {
    this.cur = this.patch(this.Al.inline(new Function('return ' + this.cur))().toString());
    this.show(this.cur);
}

Galculator.prototype.button_bracketClose = function() {
    this.cur += ')';
    this.show(this.cur);
}

Galculator.prototype.button_x5 = function() {
    if (this.store) {
        this.store = false;
        this.x5 = this.Al.inline(new Function('return ' + this.cur))();
        this.patch('x5=' + this.x5.toString());
        return this.show(this.cur);
    }
    this.cur += 'x5';
    this.show(this.cur);
}

Galculator.prototype.button_x10 = function() {
    if (this.store) {
        this.store = false;
        this.x10 = this.Al.inline(new Function('return ' + this.cur))();
        this.patch('x10=' + this.x10.toString());
        return this.show(this.cur);
    }
    this.cur += 'x10';
    this.show(this.cur);
}

export default Galculator;
