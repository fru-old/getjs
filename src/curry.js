/**
 * Special currying implementation that uses the _ character.
 * 
 * @setup
 * var print = get.curry(function(a, b, c){
 *   return '' + a + b + (c||'?');
 * });
 * 
 * // An underscore used as a parameter means that all other parameter are
 * // bound to the function. That function is returned and can be called again
 * // with more parameters.
 * 
 * @example print(1,2,3)    // '123' 
 * @example print(1,2,_)(3) // '123' 
 * @example print(1,_)(2,3) // '123' 
 * @example print(_)(1,2,3) // '123' 
 * 
 * // The Underscore placeholder can be used in between other parameters.
 * 
 * @example print(1,_,3)(2)   // '123'
 * @example print(_,2,_)(1,3) // '123'
 *
 * // The number of parameters that the function print was declared with does
 * // not influence currying.
 *
 * @example print(_,2)(1) // '12?'
 * @example print(1,2)    // '12?'
 *
 * It is possible to curry multiple times.
 * 
 * @example print(1,_)(2,_)(3) // '123' 
 */


// To make this compatible with underscore or any other js utility belt the _ 
// variable is only declared when it doesn't already exist.

var underscore = global._ || (global._ = {});

// We only add a reserved key to the underscore object to make it identifiable
// when used for currying.

var reservedKey = '_getjs_internals_currying';

// Now we can construct a function that checks if a parameter is the underscore 

function isUnderscore(target){
  return target && target[reservedKey] === isUnderscore;
}
underscore[reservedKey] = isUnderscore;

/**
 * This transforms a function into a curry-able function.
 * @param {function} func - the function that is curried
 * @returns {function}    - the result
 */
function curry(func){

  return function(){
    var args = Array.prototype.slice.call(arguments, 0);
    var self = this;

    // Find the positions of underscores in the arguments and whether the last
    // argument is an underscore.
    var found = [];
    var last  = false;
    for(var i = 0; i < args.length; i++){
      if(isUnderscore(args[i])){
        if(i === args.length-1){
          last = true;
          args.pop();
        }else{
          found.push(i);
        }
      }
    }

    // When there are no underscores then run the function directly.
    if(!last && found.length === 0){
      return func.apply(self, args);
    }

    // Returns a curry-able function because one can curry multiple times.
    return curry(function(){

      // Checks that the number of arguments is correct.
      var expected = found.length;
      
      if(arguments.length < expected){
        throw new Error("Expect at least " + expected + " arguments.");
      }

      if(!last && arguments.length > expected){
        throw new Error("Expect no more then " + expected + " arguments.");
      }

      // Insert the arguments into the args array
      for(var i = 0; i < arguments.length; i++){
        var value = arguments[i];
        if(i < expected){
          args[found[i]] = value;
        }else{
          args.push(value);
        }
      }

      return func.apply(self, args);
    });
  };
}

module.exports = {
  "static": {
    curry: curry
  }, 
  "query" : {
    
  }
};

