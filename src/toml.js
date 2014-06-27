

/**
 * Filters comments from a sinle line of toml 
 * @expose uncomment
 */
var uncomment = (function(){

	var comment = '(?:#.*)?';
	var string  = '("([^\\\\"]|(\\\\.))*("|$))';
	var single  = string.replace(/\"/g, '\'');
	var regexp  = string.replace(/\"/g, '/');
	var other   = '([^"/\'#]*)';
	var isline  = [string, single, regexp, other].join('|');
	
	return new RegExp('^('+isline+')'+comment+'$');
}());

var isTable   = /^(\s*)\[(\[?)([^\[\]]*)\]\]?\s*$/;
var canBeLine = /^\s*([^ \t\[\]]*)\s*=(.*)$/;


/**
 * The walker must at least support these methods:
 * - parseKey() -> {id: , attr: {}}
 * - push(key, attr, leaf, duplicate)
 * - pop()
 * - parseExpression() -> {value: } or. false
 */
function parse(code, walker){

	// Split into lines and normalize whitespace
	code = code.split('\n').replace(/\r/g, '');

	
	for(var i = 0; i < code.length; i++){
		var line = code[i];
		// Remove all comments
		line = line.replace(uncomment,'$1');

		if(isTable.match(line)){
			//var table = 
		}



	}

	// Parse header []

}