
// A static collection of elements which can be extended to serve data from ajax
// and other asynchronous sources. A stream does not provide a mechanism to
// model mutable or changing data. Hence any call to a stream with the same
// arguments must always return the same result. This initial implementation of
// streams serves an array of elements.

/**
 * A possibly infinite stream of elements.
 * @param {Array} array      - array of elements to serve
 * @param {function=} mapper - all elements are lazily mapped with this function
 */
function Stream(array, mapper){
	this.elements = array || [];
	this.mapper = mapper;
}

// Get may encounter the end of the stream. The third argument of the callback
// is set to the actual length of the stream when this happens.

/**
 * Asynchronous, retrieve a child at a particular index. When the third
 * parameter of the done callback is a number, the end of the stream was 
 * encountered.
 * @param {number} index  - index of the element to be returned
 * @param {function} done - invoked with the result of the method
 */
Stream.prototype.get = function(index, done){
	if(index >= this.elements.length){
		done(null, null, {length: this.elements.length});
	}else{
		var element = this.elements[index];
		if(this.mapper)element = this.mapper(element);
		done(null, element);
	}
	
};

/**
 * Asynchronous, return the next element that may match the assertions. This may
 * be overrided to do more concrete enhancements that take the assertions into
 * account while traversing.
 * @param {number} minindex          - the result must be at least this
 * @param {DNF|Assertion} assertions - may be used to improve iteration
 * @param {function} done            - invoked with the result of the method
 */
Stream.prototype.next = function(minindex, assertions, done){
	self.get(minindex, function(err, element, ended){
		done(err, minindex, element, ended);
	});
}

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

// This is an 

function ConcatStream(original, index, stream){

	this.get = function(getindex, done){
		if(getindex < index){
			original.get(getindex, function(err, element, ended){
				if(err)return done(err);

				if(ended)done(null, undefined);
				else done(null, element);
			});
		}else{
			stream.get(getindex - index, function(err, element, ended){
				if(err)return done(err);
				if(!ended){
					done(null, element);
				}else{
					original.get(getindex-ended.length, done);
				}
			});
		}
	};

	this.next = function(minindex, assertions, done){
		function next(target, cb, offset){
			target.next(minindex+(offset||0), assertions, cb);
		}
		function afterIndex(){
			next(stream, function(err, i, element, ended){
				if(err){
					done(err);
				}else if(!ended){
					done(err, i, element, ended);
				}else{
					next(original, done, ended.length);
				}
			});
		}

		if(minindex < index){
			next(original, function(err, i, element, ended){
				if(err){
					done(err);
				}else if(i < index){
					done(err, i, element, ended);
				}else{
					afterIndex();
				}
			});
		}else{
			afterIndex();
		}
	}
}

function RemoveStream(original, index, count){
	var ending = index + count - 1;

	this.get = function(getindex, done){
		if(getindex >= index){
			getindex += count;
		}
		original.get(getindex, function(err, element, ended){
			if(ended){
				var length = ended.length;
				if(length>index){
					if(length<index+count)length = index;
					else length -= count;
				}
				ended.length = length;
			}
			done(err, element, ended);
		});
	};

	this.next = function(minindex, assertions, done){
		function nextAfterRemove(){
			if(minindex < index + count)minindex = index + count;
			original.next(minindex, assertions, function(err, i, e, ended){
				done(err, i - count, e, ended);
			});
		}
		if(minindex < index){
			original.next(minindex, assertions, function(err, i, e, ended){
				if(err)done(err);
				else if(i < index)done(err, i, e, ended);
				else nextAfterRemove();
			});
		}else{
			nextAfterRemove();
		}
	};
}








this.maxlength = function(done){
		original.maxlength(function(err, length1){
			if(err)return done(err);
			// When the index is longer then the stream size the stream is
			// lengthened.
			var length = (index && index >= length1) ? index : length1;
			stream.maxlength(function(err, length2){
				if(err)return done(err);

				done(null, length + length2);
			});
		});
	};

	var placeholder = undefined;

		original.maxlength(function(err, length){
			if(err)return done(err);
			if(length > getindex){
				original.get(getindex, function(err, element, ended){
					if(err) {
						done(err);
						doneCalled = true;
					} else if(!ended) {
						done(null, element);
						doneCalled = true;
					} else {
						length = ended.length;
					}
				});
			}
			if(!doneCalled){
				stream.get(getindex - length, function(err, element, ended){
					if(ended) ended.length += length;
					done(err, element, ended);
				});
			}
		});


function RemoveStream(original, stream, index, removed){

	var placeholder = undefined;

	if(!(!stream != !removed) || !original || (!index && !stream)){
		// Asserts that (stream xor removed)
		// Asserts that (has original)
		// Asserts that (no index => has stream)
		throw new Error("Wrong usage.");
	}
	
	this.maxlength = function(done){
		original.maxlength(function(err, length1){
			if(err)return done(err);
			// When the index is longer then the stream size the stream is
			// lengthened.
			var length = (index && index >= length1) ? index : length1;
			if(stream){
				stream.maxlength(function(err, length2){
					if(err)return done(err);

					done(null, length + length2);
				});
			}else{
				// The stream is long enough to remove the elements.
				if(index + removed <= length)length -= removed;
				// The tail of the stream is removed.
				else length = index;

				done(null, length);
			}
		});
	};

	this.get = function(getindex, done){
		var exit   = false;

		original.maxlength(function(err, length){
			if(err)return done(err);
			if(length > getindex){
				original.get(getindex, function(err, element, ended){
					if(err) {
						done(err);
						exit = true;
					} else if(!ended) {
						done(null, element);
						exit = true;
					} else {
						length = ended.length;
					}
				});
			}
			if(!exit && !stream){
				done(null, null, {length: length});
			}else if(!exit){
				stream.get(getindex - length, function(err, element, ended){
					if(ended) ended.length += length;
					done(err, element, ended);
				});
			}
		});
	};
	


}

ProductStream.prototype   = new Stream(); 

function Children(initial){
	this.stream = initial || new Stream();
}


// When the number of elements that are streamed is not known or when indeed
// an infinite amount of elements is to be served, maxlength returns infinite.
// When not infite this MUST corespond to the actual number of elements in the
// stream.

/**
 * Asynchronous, the number of elements that this stream will return.
 * @param {function} done - invoked with the result of the method
 */
Stream.prototype.maxlength = function(done){
	done(null, this.elements.length);
};





Children.prototype = new Stream();

Children.prototype.append = function(stream){
	var original = this.stream;
	var product  = new Stream();

	product.length = function(done){
		original.length(function(err, length1){
			if(err)return done(err);
			stream.length(function(err, length2){
				done(err, length1 + length2);
			});
		});
	};
};

Children.prototype.insert = function(index, stream){

};

Children.prototype.detach = function(index, length){

};
