
// A static collection of elements which can be extended to serve data from ajax
// and other asynchronous sources. A stream does not provide a mechanism to
// model mutable or changing data. Hence any call to `get` with the same index
// must always provide the same element. This initial implementation of streams
// serves an array of elements.

/**
 * A possibly infinite stream of elements.
 * @param {Array} array - array of elements to serve
 */
function Stream(array){
	this.elements = array;
}

// When the number of elements that are streamed is not jet known or when indeed
// an infinite amount of elements is to be served this property returns false. 
// Its value may change from false to true but never the other way around. 

/**
 * Asynchronously returns weather the length is a finite number.
 * @param {function} done - invoked with the result of the method
 */
Stream.prototype.finite = function(done){
	done(null, true);
};

// If this stream is finite the number of elements must be known and the length
// must say constant. When the stream is infinite any number may be returned.

/**
 * The number of elements that this stream will provide.
 * @param {function} done - invoked with the result of the method
 */
Stream.prototype.length = function(done){
	done(null, this.elements.length);
};

// Get may at any request encounter the end of the stream. This is returned to 
// the done callback. Before the callback is invoked this stream must be finite
// and the length must be correct. 

/**
 * Retrieve a child at a particular index. When the third parameter of the done
 * callback is true, the end of the stream was encountered.
 * @param {number} index  - index of the element to be returned
 * @param {function} done - invoked with the result of the method
 */
Stream.prototype.get = function(index, done){
	done(null, this.elements[index], index >= this.elements.length);
};

/**
 * Return the next index that may match the assertions. Implementations may
 * override this to do more concrete enhancements that take the assertions into
 * account while traversing.
 * @param {number} minindex          - the result must be at least this
 * @param {DNF|Assertion} assertions - may be used to improve iteration
 * @param {function} done            - invoked with the result of the method
 */
Stream.prototype.next = function(minindex, assertions, done){
	done(null, minindex, minindex >= this.elements.length);
}

// This can be used to iterate over the indexes in the stream. An assertion
// may be used by a concrete implementation to enhance the iteration.
// ```
// stream.each(function(index, element, next){
//     // use index and element
//     next();
// }, assertions);
// ```

/**
 * Iterate over each element that may match the assertions beginning at the
 * start index.
 * @param {function} each - called for every element found
 * @param {DNF|Assertion} assertions - assertion that may filter elements
 * @param {number} start - starting index where the iteration begins
 * @param {function} done - called when no more elements can be found.
 */
Stream.prototype.each = function(each, assertions, start, done){
	var self  = this;

	self.next(start||0, assertions, function(err, index, ended){
		if(err)return done(err);
		else if(ended) return done && done();	

		self.get(index, function(err, element, ended){
			if(ended){
				return done && done();	
			}else if(err){
				if(err)return done(err);
			}else{
				each(index, element, function(){
					self.each(each, assertions, start+1, done);
				});
			}
		});
	});
};

// This is an 

function Childreen(stream){

}

Childreen.prototype = new Stream([]);
