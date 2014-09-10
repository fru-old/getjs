// A static collection of elements which can be extended to serve data from ajax
// and other asynchronous sources. A stream does not provide a mechanism to
// model mutable or changing data. Hence any call to a stream with the same
// arguments must always return the same result. This initial implementation of
// streams serves an array of elements.

/**
 * A possibly infinite stream of elements.
 * @constructor
 * @param {Array} array    - array of elements to serve
 * @param {bool=} infinite - all elements are lazily mapped with this function
 */
function Stream(infinite){
	this.infinite = !!infinite;
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
	throw new Error('Not implemented.');
};

/**
 *
 */
Stream.prototype.undo = function(){
	return false;
};

/**
 * Stream constructed from array.
 * @constructor
 */
Stream.Array = function(array){
	if(array && !(array instanceof Array)){
		array = [array];
	}
	this.elements = array || [];
};

Stream.Array.prototype = new Stream();

Stream.Array.prototype.next = function(minindex, assertions, done){
	if(minindex >= this.elements.length){
		done(null, minindex, null, {length: this.elements.length});
	}else{
		var element = this.elements[minindex];
		if(this.mapper)element = this.mapper(element);
		done(null, minindex, element);
	}
};

/**
 * Offset the stream by 'moving' the elements of the stream.
 * @constructor
 */
function Offset(original, extend){
	this.original = original;
	this.extend   = extend;
}

Offset.prototype = new Stream();

Offset.prototype.next = function(minindex, assertions, done){
	var self = this;
	function result(err, i, element, ended){
		if(ended){
			ended.length += self.extend;
		}
		done(err, i + self.extend, element, ended);
	}
	this.original.next(minindex - this.extend, assertions, result);
};

/**
 * Wraps an existing stream and lazily maps all values. Can be used to map
 * children recursive when the passed mapper replaces children with a new 
 * Stream.Mapper instance.
 * @constructor
 */
function Mapper(original, mapper, context){
	var hasRun = false;
	this.next = function(minindex, assertions, done){
		hasRun = true;
		function result(err, i, element, ended){
			if(element)mapper(element, context);
			done(err, i, element, ended);
		}
		this.original.next(minindex, assertions, result);
	};

	/**
	 * Special function that can be used to cheaply undo a node mapping.
	 */
	this.undo = function(matchMapper, matchContext){
		if(!hasRun && mapper === matchMapper && context === matchContext){
			return original;
		}else{
			return false;
		}
	};
}

Mapper.prototype = new Stream(); 

/**
 * Build a stream that is a concatination of two existing streams.
 * @constructor
 */
function Append(original, stream){
	this.original = original;
	this.stream   = stream;
}

Append.prototype = new Stream();

Append.prototype.next = function(minindex, assertions, done){
	var self = this;
	this.original.next(minindex, assertions, function(err, i, element, ended){
		if(err)return done(err);
		if(!ended){
			done(err, i, element, null);
		}else{
			if(!self.offset){
				self.offset = new Offset(self.stream, ended.length);
			}
			self.offset.next(minindex, assertions, done);
		}
	});
};

/**
 * Build a substream of an existing stream.
 * @constructor
 */
function Sub(original, index, count, fill){
	this.reduced = new Offset(original, -index);
	this.count   = count;
	this.fill    = fill;
}

Sub.prototype = new Stream();

Sub.prototype.next = function(minindex, assertions, done){
	if(minindex >= this.count && this.fill){
		return done(null, null, null, {length: this.count});
	}
	var self = this;
	this.reduced.next(minindex, assertions, function(err, i, element, ended){
		if(err)return done(err);
		if((!ended || self.fill) && i >= self.count){
			done(err, null, null, {length: self.count});
		}else{
			if(self.fill && ended){
				done(err, i, undefined, null);
			}else{
				done(err, i, element, ended);
			}
		}
	});
};

/**
 * The Infinity number is used to build Sub streams.
 */
var infity = Number.POSITIVE_INFINITY;

/**
 *
 */
Stream.prototype.append = function(nodes){
	if(nodes.appendTo){
		return nodes.appendTo(this);
	}
	if(!(nodes instanceof Stream)){
		nodes = new Stream.Array(nodes);
	}
	return new Append(this, nodes);
};

/**
 *
 */
Stream.prototype.map = function(mapper){
	return new Stream.Mapper(this, mapper);
};

/**
 *
 */
Stream.prototype.prepend = function(index, nodes){
	if(nodes.prependTo){
		return nodes.prependTo(index, this);
	}
	if(!(nodes instanceof Stream)){
		nodes = new Stream.Array(nodes);
	}
	var head = new Sub(this, 0, index, true);
	var tail = new Sub(this, index, infity);
	return new Append(head, new Append(nodes, tail));
};

/**
 *
 */
Stream.prototype.detach = function(index, length){
	var head = new Sub(this, 0, index, true);
	var tail = new Sub(this, index+length, infity);
	return {
		target: new Append(head, tail),
		result: new Sub(this, index, length)
	};
};

module.exports = Stream;