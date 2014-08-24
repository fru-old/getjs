var Stream = require('../internal/stream');
var Node   = require('../internal/node');

/**
 * Call cb for every property in the object.
 */
function objectSearch(object, cb){
	for(var i in object){
		if(object.hasOwnProperty(i)){
			cb(i, object[i], false);
		}
	}
}

/**
 * Check if object is an array.
 */
function isArray(object){
	return (typeof object !== 'string') && (typeof object.length === 'number');
}

/**
 * Call cb for every element in array.
 */
function arraySearch(array, index, flatten, cb){
	for(var i = 0; i < array.length; i++){
		var nindex = index.slice(0);
		nindex.push(i);
		if(flatten && isArray(array[i])){
			arraySearch(array[i], nindex, flatten, cb);
		}else{
			cb(nindex, array[i], true);
		}
	}
}

/**
 * Build node from object.
 */
function makeNode(object, flatten){
	var result   = new Node.DefaultData();
	var children = [];

	function iterator(index, found, array){
		var node = makeNode(found);
		if(node){
			var tag = array ? 'index' : 'name';
			node.nodedata.tags.set(tag, index);
			children.push(node);
		}else{
			result.prop.set(index, found);
		}
	}

	if(isArray(object)){
		result.tags.set('array', true);
		arraySearch(object, [], flatten, iterator);
	}else if(object.constructor === Object){
		objectSearch(object, iterator);
	}else{
		return null;
	}
	return new Node(result, new Stream.Array(children));
}

function fillArray(context, js, result, rest){
	var index = context.get('tags', 'index');
	function recurse(n){
		if(index.length <= n+1){
			result[index[n]] = js;
		}else{
			result[index[n]] = [];
			recurse(n+1);
		}
	}

	if(index && typeof index[0] === 'number'){
		recurse(0);
	}else{
		rest.push(js);
	}
}

function fillObject(context, js, result, rest){
	var name = context.get('tags', 'name');
	if(name){
		result[name] = js;
	}else{
		rest.push(js);
	}
}

/**
 * Convert runjs root back to a js object
 */
function toJS(context, done){
	var isArray = context.get('tags', 'array');
	var rest    = [];
	var result  = isArray?[]:{};
	context.find(0, null, function(child){
		toJS(child, function(js){
			if(isArray){
				fillArray(child, js, result, rest);
			}else{
				fillObject(child, js, result, rest);
			}
		});
	}, function(){
		if(isArray){
			result = result.concat(rest);
		}
		var prop = context.all('prop');
		for(var i in prop){
			result[i] = prop[i];
		}
		done(result);
	});
}

function buildHtml(object){
	var result   = new Node.DefaultData();
	var children = [];

	// TODO

	for(var i in object){
		switch(i){
			case 'id':

				break;
			case 'class':

				break;
			case 'attr':

				break;
			case 'child':

				break;
			default:
				return null;
		}
	}

	return new Node(result, new Stream.Array(children));
}



module.exports = {
	"static": {

		/**
		 * Static method to build a getjs root node from js objec.
		 */
		read: function(data, options){
			if(!options)options = {};

			var root = makeNode(data, !!options.flatten);
			if(!root){
				throw new Error('Expected toplevel array or object.');
			}
			return new Node.Root(root);
		},

		/**
		 * Static method to build html tree from js object
		 */
		html: function(data){
			var result = buildHtml(data);
			if(!result){
				throw new Error('Could not find root node.');
			}
			return result;
		},

		/**
		 * Build js object from getjs root node.
		 */
		toJS: function(root, done){
			root.execute(function(context){
				toJS(context, function(result){
					done(result);
				});
			});
		}
	}
};

