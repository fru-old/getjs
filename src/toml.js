

/**
 * Filters comments from a single line of toml 
 * @expose uncomment
 * @examples
 * uncomment.exec('code# comment')[1]      // 'code'
 * uncomment.exec('test# # comment')[1]    // 'test'
 * uncomment.exec('"test#" # comment')[1]  // '"test#" '
 */
var uncomment = (function(){

	var comment = '(?:#.*)?';
	var string  = '("([^\\\\"]|(\\\\.))*("|$))';
	var single  = string.replace(/\"/g, '\'');
	var regexp  = string.replace(/\"/g, '/');
	var other   = '([^"\\/\\\'#]*)';
	var isline  = [string, single, regexp, other].join('|');
	
	return new RegExp('^(('+isline+')*)'+comment+'$');
}());

/**
 * RegExp to find and parse table entities
 * @expose isTable
 * @examples
 * isTable.test('[table]')         // true
 * isTable.exec(' [[table]]')[1]   // ' '
 * isTable.exec(' [[table]]')[2]   // '['
 * isTable.exec(' [[table]]')[3]   // 'table'
 */
var isTable   = /^(\s*)\[(\[?)([^\[\]]*)\]\]?\s*(?:#.*)?$/;

/**
 * Attribute lines allways start with a name followed by an equals.
 * @expose canBeLine
 * @examples 
 * canBeLine.test('test=xyz')    // true
 * canBeLine.exec('test=xyz')[1] // 'test'
 * canBeLine.exec('test=xyz')[2] // 'xyz'
 */
var canBeLine = /^\s*([^ \t\[\]]*)\s*=(.*)$/;

// Random string to escape dollar (other types of escaping may fail)
var dollar = 'DollarWWbpyfvjYHaPCXNRW2YTjqj4AvxrC4mZ9BBHFJZ9VNyp';

function unescape(string){
	return string.replace(dollar, '$$');
}

exports.parse = function (code, walker){

	// We are going to use replace - so escape dollar	
	code = code.replace(/\$/g, dollar);

	// Split into lines and normalize whitespace
	code = code.replace(/\r/g, '').split('\n');

	for(var i = 0; i < code.length; i++){

		var table = isTable.exec(code[i]);
		if(!table){
			// Remove all comments table does this 
			code[i] = code[i].replace(uncomment,'$1');
		}
		
		code[i] = code[i].trim();
		if(!code[i])continue;
		
		var line  = canBeLine.exec(code[i]);
		parseLine(table, line, i, code[i], false, walker);
	}

	parseLine(null, null, code.length, null, true, walker);

	return walker.result();
};

// Current expression (can span multiple lines)
var lastExpr  = '';
// Current table
var lastTable = null;
// Current attribute name
var lastAttr  = null;
// Current attributes store
var lastAttrs = null;

function parseLine(table, line, i, current, end, walker){
	var valid = walker.parseExpression(unescape(lastExpr));

	if(lastAttr){ 
		
		// has propertie that neeeds to be valid.
		if((table || end) && !valid){
			walker.error('Expression invalid', i, lastExpr);
			// if walker didnt throw Exception
			lastAttr = null;
			lastExpr = '';
			
		}else if((table || end || line) && valid){
			if(!lastAttrs)lastAttrs = {};
			lastAttrs[lastAttr] = valid.value;
			lastAttr = null;
			lastExpr = '';

		}else{ 
			lastExpr += '\n' + current;
		}
	}

	if(!lastAttr){

		if(table || end){
			if(lastTable){
				var tabspace = walker.smallTabs ? '  ' : '    ';
 				var indent   = lastTable[1].replace(/\t/g, tabspace);
 				var isDouble = !!lastTable[2].length;

 				var name = lastTable[3].trim();
 				name = name.replace(/(^\.+)|(\.+$)/g, '');
 				name = unescape(name.replace(/\.+/g, '.'));

 				if(name !== lastTable[3]){
 					walker.error('Invalid tablename', i, lastTable[3]);
 				}

				sendTable(indent.length, isDouble, name, lastAttrs,  walker);
			}else if(lastAttrs){
				walker.root(lastAttrs);
			}
			lastTable = table;
			lastAttrs = {};
		}else if(line){

			lastAttr = unescape(line[1]).trim();
			lastExpr = line[2]; 
		}else{

			walker.error('Can not parse', i, current);
		}
	}
}

// Previously indented tables
var indentions = [];

// Keys found in the root
var rootkeys = {};

/**
 * The walker must at least support these methods:
 * - parseKey() -> {id: , attr: {}}
 * - push(key {id,attr}, attr, leaf, duplicate)
 * - pop()
 * - parseExpression() -> {value: } or. false
 * - error(message, linenumber)
 * - smallTabs = false
 */
function sendTable(indent, isArray, name, attr, walker){

	while((indentions[indentions.length-1]||{}).indent >= indent){
		var count = indentions.pop().level;
		for(var i = 0; i < count; i++){
			walker.pop();
		}
	}

	name = name.split('.');
	
	var childreen;
	if(indentions.length > 0){
		childreen = indentions[indentions.length-1].childreen;
	}else{
		childreen = rootkeys;
	}	

	indentions.push({
		level: name.length,
		indent: indent,
		childreen: {}
	});

	var keys = '';
	for(var k = 0; k < name.length; k++){
		var key = walker.parseKey(name[k]);
		keys += '.'+key.key;
		var duplicate = !!childreen[keys];
		childreen[keys] = true;
		walker.push(key, attr, k === name.length - 1, duplicate, isArray);
	}
}

