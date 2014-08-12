/**
 * A parsable stream of tokens
 * @constructor
 */
function Parsable(original){
	this.original = original;
}

/**
 * Create a stream of tokens from a regex
 */
Parsable.tokenize = function(string, regex){
	var pos = 0;
	return new Parsable(string.match(regex).map(function(token){
		var result = {
			data: token, 
			pos: pos, 
			assert: function(expected, returnResult){
				var token = this.data;
				if(expected === 'name'){
					if(token.name || '#:[]=!<>.*{}'.indexOf(token[0])===-1){
						return true;
					}
				}else if(token === expected ){
					return true;
				}
				if(returnResult)return false;
				throw new Error([
					'Unexpected symbol "'+token+'" ',
					'expected "'+expected+'" ',
					'at column: '+this.pos
				].join(''));
			}
		};
		pos += token.length;
		return result;
	}));
};

/**
 * Map a stream of tokens.
 */
Parsable.prototype.parse = function(each){
	var current, state = 0;
	var parsable = new Parsable(this.original.map(function(token, i){
		if(!token)return token;
		var removed = false;
		var actions = {
			// Modify current state
			setState: function(s){ state = s; },
			setCurrent: function(c){ current = c; },
			// Remove the current token from the parsable stream
			remove: function(){ removed = true; },
			// Validate the type of the current token
			expected: function(expected, returnResult){
				return token.assert(expected, returnResult);
			}
		};
		var result = each.call(actions, token.data, state, current);
		return removed ? null : {
			data: result, 
			pos: token.pos, 
			assert: token.assert
		};
	}));
	if(state > 0)throw new Error('Unexpected ending.');
	return parsable;
};

module.exports = function(string){

	var parsed = Parsable.tokenize(string,
		/\#|\:|\[|\]|[\=\!<>]+|\{|\}|\*+|\.|[^\#\:\[\]\=\!<>\{\}\*\.]+/g

	).parse(function(token, state, current){

		var name;

		// 0 -> current may be falsy or the current name array
		// 1 -> {{
		// 2 -> {{temp
		// 3 -> {{temp}
		// 4 -> {{temp}}
		
		switch (state) {
    		case 0:
    			if(token[0] === '*'){
    				name = {wildcard: token.length};
    				break;
				}else if(this.expected('name', true)){
					name = {constant: token};
					break;
				}else if(token === '{'){
    				this.setState(1);
				}else{
					this.setCurrent(null);
					return token;
				}
				break;
    		case 1:
    			this.expected('{');
    			this.setState(2);
    			break;
    		case 2:
    			this.expected('name');
    			name = {breakets: token};
    			this.setState(3);
    			break;
    		case 3:
    			this.expected('}');
    			this.setState(4);
    			break;
    		case 4:
    			this.expected('}');
    			this.setState(0);
    			break;
    	}
    	
    	if(!current){
    		this.setCurrent(current = (name ? [name] : []));
    		return {name: current};
    	}else{
    		this.remove();
    		if(name)current.push(name);
    	}

	}).parse(function(token, state, current){

		var newCurrent;

		// -1 -> possibly [ after :
		// 0  -> default
		// 1  -> name after #
		// 2  -> name after :
		// 3  -> allready found [
		// 4  -> allready found [name
		// 5  -> allready found [name=
		// 6  -> expect ]

		switch (state) {
			case -1:
				if(token === '['){
					this.setState(3);
					break;
				}
			/* falls through */
			case 0:
				if(token.name){
					newCurrent = {type: '_', name: token.name};
				}else{
					switch (token) {
						case '.':
							return token;
						case '#':
							this.setState(1);
							break;
						case ':':
							this.setState(2);
							break;
						case '[':
							this.setState(3);
							break;
						default:
							this.expected('#, : or [');
					}
					newCurrent = {type: token};
				}
				break;
			case 1:
			case 2:
				this.expected('name');
				current.name = token.name;
				this.setState(state === 1 ? 0 : -1);
				break;
			case 3:
				this.expected('name');
				current.prop = token.name;
				this.setState(4);
				break;
			case 4:
				if('=!<>'.indexOf(token[0])!==-1){
					current.assert = token;
					this.setState(5);
				}else{
					this.expected(']');
					this.setState(0);
				}
				break;
			case 5:
				this.expected('name');
				current.value = token.name;
				this.setState(6);
				break;
			case 6:
				this.expected(']');
				this.setState(0);
				break;
		}

		if(newCurrent){
			this.setCurrent(newCurrent);
    		return newCurrent;
		}else{
			this.remove();
		}
	});

	// 

	var result = [[]];

	parsed.parse(function(token){
		if(token === '.'){
			result.push([]);
		}else{
			result[result.length-1].push(token);
		}
	});
	
	return result;
};
