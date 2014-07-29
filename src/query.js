
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

function Parsable(original){
	this.original = original;
}

Parsable.tokenize = function(string, regex){
	var pos = 0, line = 0;
	return new Parsable(string.match(regex).map(function(token){
		var result = {
			data: token, 
			line: line, 
			pos: pos, 
			assert: function(expected, check){
				if(expected === 'name'){
					if('#:[]=!<>.*{}'.indexOf(token[0])===-1)return true;
				}
				if(this.data === expected ){
					return true;
				}
				if(check)return false;
				var msg = 'Expected "'+expected+'" but found "'+this.data+'"';
				throw new Error(msg+' line:'+this.line+' column:'+this.pos);
			}
		};
		pos += token.length;
		return result;
	}));
};

Parsable.prototype.parse = function(each){
	var status, state = 0;
	return new Parsable(this.original.map(function(token, i){
		if(!token)return token;
		var removed = false;
		var actions = {
			addState: function(s){ state += s; },
			setState: function(s){ state = s; },
			addName: function(value){
				if(status)removed=true;
				else status = {};
				if(!status.name)status.name = [];
				status.name.push(value);
				return status;
			},
			reset: function(){
				//var oldstatus = status;
				status = null;
				//return oldstatus;
			},
			expected: function(expected, check){token.assert(expected, check);},
			remove:   function(){removed=true;}, // deprecated
			attached: function(key, value, noRemove){removed=true;}
		};
		var result  = each.call(actions, token.data, state, status) || token.data;
		return removed ? null : {data: result, line: token.line, pos: token.pos, assert: token.assert};
	}));
};

function foldNames2(string){
	var state = 0, current;
	// 0 -> current may be falsy or the current name
	// 1 -> {{
	// 2 -> {{temp
	// 3 -> {{temp}
	// 4 -> {{temp}}
	return tokenize(string).parse(function(token, state, current){
		switch (state) {
    		case 0:
    			if(token[0] === '*'){
					return this.addName({wildcard: token.length});
				}else if(token !== '{'){
					if(this.expected('name', true)){
						return this.addName({constant: token});
					}
					console.log("!!!!!!!!!!!!!!!!!");
					console.log(token);
					break;
				}
			/* falls through */
    		case 1:
    			this.expected('{');
    			this.addState(1);
    			break;
    		case 2:
    			this.expected('name');
    			this.addName({breakets: token});
    			this.addState(1);
    			break;
    		case 3:
    			this.expected('}');
    			this.addState(1);
    			break;
    		case 4:
    			this.expected('}');
    			this.setState(0);
    			break;
    	}
	});
}

function tokenize(string){
	var r = /\#|\:|\[|\]|[\=\!<>]+|\{|\}|\*+|\.|[^\#\:\[\]\=\!<>\{\}\*\.]+/g;
	return Parsable.tokenize(string, r);
}

exports.parse = function(string){
	var state = 0, current, result = [[]];
	// 0 -> default
	// 1 -> name after #
	// 2 -> name after :
	// 3 -> possibly [ after :
	// 4 -> allready found [
	// 5 -> allready found [name
	// 6 -> allready found [name=
	// 7 -> expect ]

	foldNames2(string).parse(function(token){
		if(!token || token === '.')return;

		//console.log(JSON.stringify(token));

		if(state === 5){
			if('=!<>'.indexOf(token[0])!==-1){
				current.assert = token;
				state = 6;
			}else{
				if(token !== ']')this.expected(']');
				state = 0;
			}
			return this.remove();
		}else if(state === 0 || state === 3){
			console.log(token);
			if(token.name){
				return {type: '_', name: token.name};
			}else if(token === '#'){
				state = 1;
			}else if(token === ':'){
				state = 2;
			}else if(token === '['){
				if(state === 3){
					state = 4;
					return this.remove();
				}else{
					state = 4;
				}
			}else{
				this.expected('#, : or [');
			}
			return (current = {type: token});
		}else if(state === 1 || state === 2){
			if(!token.name)this.expected('name');
			current.name = token.name;
			state = (state === 1 ? 0 : 3);
			this.remove();
		}else if(state === 4 || state === 6){
			if(!token.name)this.expected('name');
			var key = (state === 4 ? 'prop' : 'value');
			current[key] = token.name;
			this.remove();
			state+=1;
		}else if(state === 7){
			if(token !== ']')this.expected(']');
			state = 0;
			return this.remove();
		}
	}).original.map(function(token){
		if(token && token.data === '.'){
			result.push([]);
		}else if(token){
			result[result.length-1].push(token.data);
		}
	});
	if(state!==0){
		throw new Error('Unexpected ending.');
	}

	return result;
};