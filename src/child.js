
// A static collection of elements which can be extended to serve data from ajax
// and other asynchronous sources. A stream does not provide a mechanism to
// model mutable or changing data. Hence any call to a stream with the same
// arguments must always return the same result. This initial implementation of
// streams serves an array of elements.

/**
 * A possibly infinite stream of elements.
 * @constructor
 * @param {Array} array      - array of elements to serve
 * @param {function=} mapper - all elements are lazily mapped with this function
 */
function Stream(array, mapper){
	this.elements = array || [];
	this.mapper = mapper;
}

/**
 * Asynchronous, return the next element that may match the assertions. This may
 * be overrided to do more concrete enhancements that take the assertions into
 * account while traversing.
 * @param {number} minindex          - the result must be at least this
 * @param {DNF|Assertion} assertions - may be used to improve iteration
 * @param {function} done            - invoked with the result of the method
 */
Stream.prototype.next = function(minindex, assertions, done){
	if(minindex >= this.elements.length){
		done(null, minindex, null, {length: this.elements.length});
	}else{
		var element = this.elements[minindex];
		if(this.mapper)element = this.mapper(element);
		done(null, minindex, element);
	}
};

// This can be used to iterate over the indexes in the stream. Assertions may be
// used by a concrete implementation to enhance the iteration.
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
 * @param {number} start  - starting index where the iteration begins
 * @param {function} done - called when no more elements can be found.
 */
Stream.prototype.each = function(each, assertions, start, done){
	var self  = this;

	self.next(start||0, assertions, function(err, index, element, ended){
		if(err)return done(err);
		else if(ended) return done && done();	
		
		each(index, element, function(){
			self.each(each, assertions, index+1, done);
		});
	});
};


/**
 * Next element at index and offset all indexes by a given number.
 * @param {Stream|Children} target   - 
 * @param {function} cb   - 
 * @param {number} index  - 
 * @param {DNF|Assertion} assertions -
 * @param {number} offset - 
 */
function next(target, cb, index, assertions, offset){
	if(!offset)offset = 0;
	function offsetCb(err, i, element, ended){
		if(ended)ended.length -= offset;
		cb(err, i - offset, element, ended);
	}
	target.next(index + offset, assertions, offsetCb);
}

/**
 * Build a stream that is a concatination of two existing streams.
 * @constructor
 */
function AppendStream(original, stream){

	this.next = function(minindex, assertions, done){
		next(original, function(err, i, element, ended){
			if(err)return done(err);
			if(!ended){
				done(err, i, element, null);
			}else{
				next(stream, done, minindex, assertions, -ended.length);
			}
		}, minindex, assertions);
	};
}

/**
 * Build a substream of an existing stream.
 * @constructor
 */
function SubStream(original, index, count, fill){

	this.next = function(minindex, assertions, done){
		if(minindex >= count && fill){
			return done(null, null, null, {length: count});
		}
		next(original, function(err, i, element, ended){
			if(err)return done(err);
			if((!ended || fill) && i >= count){
				done(err, null, null, {length: count});
			}else{
				if(fill && ended){
					done(err, i, undefined, null);
				}else{
					done(err, i, element, ended);
				}
			}
		}, minindex, assertions, index);
	};
}

var infity = Number.POSITIVE_INFINITY;

/**
 * Childreen class that contains a collection of nodes and exposes all basic
 * transformations that can be executed on the collection.
 */
function Children(initial){
	if(!(initial instanceof Stream)){
		initial = null;
	}
	this.stream = initial || new Stream();
}

Children.prototype = new Stream();

Children.prototype.get = function(index, done){
	return this.stream.next(index, null, function(){
		
	});
};

Children.prototype.next = function(minindex, assertions, done){
	return this.stream.next(minindex, assertions, done);
};

Children.prototype.each = function(each, assertions, start, done){
	return this.stream.each(each, assertions, start, done);
};

Children.prototype.append = function(element){
	if(!(element instanceof Stream)){
		element = new Stream([element]);
	}
	this.stream = new AppendStream(this.stream, element);
};

Children.prototype.insert = function(index, element){
	if(!(element instanceof Stream)){
		element = new Stream([element]);
	}
	var head = new SubStream(this.stream, 0, index, true);
	var tail = new SubStream(this.stream, index, infity);
	tail = new AppendStream(element, tail);
	this.stream = new AppendStream(head, tail);
};

Children.prototype.detach = function(index, length){
	var head = new SubStream(this.stream, 0, index, true);
	var tail = new SubStream(this.stream, index+length, infity);
	var mid  = new SubStream(this.stream, index, length);
	this.stream = new AppendStream(head, tail);
	return mid;
};

Children.Stream = Stream;

module.exports = Children;



