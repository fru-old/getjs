var Stream = require('../internal/stream');
var Node   = require('../internal/node');
var Query  = require('../query/query');

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
	return Object.prototype.toString.call( object ) === '[object Array]';
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

function isTag(tag){
	tag = tag.split(/^([a-zA-Z]*|\*)/)[1];
	var tags = [
		'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside',
		'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote',
		'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code',
		'col', 'colgroup', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog',
		'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption',
		'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'head',
		'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'html', 'i',
		'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend',
		'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta',
		'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup',
		'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt',
		'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source',
		'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table',
		'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title',
		'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr'
	];
	return tags.indexOf(tag) !== -1;
}


function buildNodes(object, nodedata){
	var result = [];
	if(isArray(object)){
		for(var i = 0; i < object.length; i++){
			result.push(buildHtml(object[i], nodedate && nodedata.clone()));
		}
	}else{
		result.push(buildHtml(object, nodedate));
	}
	return result;
}


function buildHtml(object, nodedata){
	var result   = nodedata || new Node.DefaultData();
	var children = [];

	for(var i in object){
		var value = object[i];
		switch(i){
			case 'id':
				result.set('attr', 'id', value);
				break;
			case 'class':
				var current = result.get('attr', 'class');
				if(!isArray(current))current = [];
				for(var j in value){
					current.push(j);
				}
				result.set('attr', 'class', current);
				break;
			case 'attr':
				for(var k in value){
					result.set('attr', k, value[k]);
				}
				break;
			case 'child':
				children = children.concat(buildNodes(value));
				break;
			default:
				var tag = i.split(/^([a-zA-Z0-9]*|\*)/)[1];
				if(isTag(tag) || tag === '*'){
					var html = buildNodes(value, Query.create(i));
					children = children.concat(html);
				}else{
					throw new Error('Unserialize key in html literal: '+i+'.');
				}
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
			var result = buildNodes(data);
			if(result.length !== 1){
				throw new Error('Could not find root node.');
			}
			return result[0];
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

