/** Ganja.js - Geometric Algebra - Not Just Algebra.
  * @author Enki
  * @link   https://github.com/enkimute/ganja.js
  */

import Algebra from "./Algebra.js";

/*********************************************************************************************************************/
//
// Ganja.js is an Algebra generator for javascript. It generates a wide variety of Algebra's and supports operator
// overloading, algebraic literals and a variety of graphing options.
//
// Ganja.js is designed with prototyping and educational purposes in mind. Clean mathematical syntax is the primary
// target.
//
// Ganja.js exports only one function called *Algebra*. This function is used to generate Algebra classes. (say complex
// numbers, minkowski or 3D CGA). The returned class can be used to create, add, multiply etc, but also to upgrade
// javascript functions with algebraic literals, operator overloading, vectors, matrices and much more.
//
// As a simple example, multiplying two complex numbers 3+2i and 1+4i could be done like this :
//
//  var complex = Algebra(0,1);
//  var a = new complex([3,2]);
//  var b = new complex([1,3]);
//  var result = a.Mul(b);
//
// But the same can be written using operator overloading and algebraic literals. (where scientific notation with
// lowercase e is overloaded to directly specify generators (e1, e2, e12, ...))
//
//   var result = Algebra(0,1,()=>(3+2e1)*(1+4e1));
//
// Please see github for user documentation and examples.
//
/*********************************************************************************************************************/

// Documentation below is for implementors. I'll assume you know about Clifford Algebra's, grades, its products, etc ..
// I'll also assume you are familiar with ES6. My style may feel a bith mathematical, advise is to read slow.

  /** The Algebra class generator. Possible calling signatures :
    *   Algebra([func])                      => algebra with no dimensions, i.e. R. Optional function for the translator.
    *   Algebra(p,[func])                    => 'p' positive dimensions and an optional function to pass to the translator.
    *   Algebra(p,q,[func])                  => 'p' positive and 'q' negative dimensions and optional function.
    *   Algebra(p,q,r,[func])                => 'p' positive, 'q' negative and 'r' zero dimensions and optional function.
    *   Algebra({                            => for custom basis, cayley, mixing, etc pass in an object as first parameter.
    *     [p:p],                             => optional 'p' for # of positive dimensions
    *     [q:q],                             => optional 'q' for # of negative dimensions
    *     [r:r],                             => optional 'r' for # of zero dimensions
    *     [metric:array],                    => alternative for p,q,r. e.g. ([1,1,1,-1] for spacetime)
    *     [basis:array],                     => array of strings with basis names. (e.g. ['1','e1','e2','e12'])
    *     [Cayley:Cayley],                   => optional custom Cayley table (strings). (e.g. [['1','e1'],['e1','-1']])
    *     [mix:boolean],                     => Allows mixing of various algebras. (for space efficiency).
    *     [graded:boolean],                  => Use a graded algebra implementation. (automatic for +6D)
    *     [baseType:Float32Array]            => optional basetype to use. (only for flat generator)
    *   },[func])                            => optional function for the translator.
   **/

if (window) {
    window.Algebra = Algebra;
}

export default Algebra;
