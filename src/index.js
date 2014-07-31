var curry = require('./curry');

/**
 * Map Shim - https://gist.github.com/jed/1031568
 */
if(![].map)Array.prototype.map = function(func){
	var self   = this;
	var length = self.length;
	var result = [];
	for (var i = 0; i < length; i++){
		if(i in self){
			result[i] = func.call(
				arguments[1], // an optional scope
				self[i],
				i,
				self
			);
		}
	}
	result.length = length;
	return result;
};