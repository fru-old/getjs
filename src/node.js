
/**
 * Global id generator to return ascending ids. 
 */
var ID = {
	current: 1,
	ascending: function(){
		return ID.current++;
	} 
};

/**
 * Any cloned node can have multiple simultaneous versions
 */
function VersionedNode(initial){
	this[initialVersion] = initial;
}

// Global initial Version
var initialVersion = ID.ascending();

// Used during iteration
VersionedNode.prototype.getVersion = function(id){
	if(!this[id]){
		throw new Error('Sanity Check Failed: Wrong Version');
	}else if(this[id] instanceof Node){
		return this[id];
	}else{
		return this[this[id]];
	}
};

// Internal operation on the node
VersionedNode.prototype.cloneVersion = function(original, id){
	if(this[original] instanceof Node){
		this[id] = original;
	}else if(this[this[original]] instanceof Node){
		this[id] = this[original];
	}else{
		throw new Error('Sanity Check Failed: No Original Version');
	}
};

// Used during iteration when a match was found
VersionedNode.prototype.changeVersion = function(id, clonefunc){
	if(this[id] instanceof Number){
		this[id] = clonefunc(this[this[id]]);
	}
};

/**
 * Versioned root
 */
function VersionedRoot(vnode, version){
	this.getRoot = function(){
		vnode.getVersion(version || initialVersion);
	};
}

// Intermediate.each(...) -> Intermediate
// Node.iterate() -> Runs directly




function Node(){

}



function Root(){
	var version;
}


function extend(original, param, mapping){
	for(var key in param){
		if (param.hasOwnProperty(key) && !original.hasOwnProperty(key)){
			original[key] = mapping ? mapping(param[key]) : param[key];
		}
	}
	return original;
}

function KeyValue(initial){
	var store = initial || {};
	
	// The result of this constructor
	var result =  function(key){
		if(arguments.length > 1){
			store[key] = arguments[1];
		}
		return store[key];
	};

	result.clone = function(){
		return new KeyValue(extend({}, store));
	};

	result.extend = function(values){
		extend(store, values);
	};

	return result;
}


function InternalNode(){
	this.attr = {};
	this.prop = {};
	this.path = {};
	this.tags = {};
	this.text = {};
	this.children = null;
}

var get = {};


// tags.index = [0,4,1]
// tags.name = 'xyz'
// tags.root = true

// prop.1 = 1

var Stream = require('./child');

get.json = function(object, options){
	var flatten = (options||{}).flatten;

	var root = makenode(object);
	if(!root){
		throw new Error('Expected toplevel array or object.')
	}
	root.tags['root'] = true;
	return root;

	function makenode(object){
		var result = new InternalNode();
		var children = [];
		function iterator(index, found, tag){
			var node = makenode(found);
			if(node){
				node.tags[tag] = index;
				children.push(node);
			}else{
				result.prop[index] = found;
			}
		}

		if(typeof object.length === 'number'){
			result.tags['array'] = true;
			arraysearch(object, [], iterator);
		}else if(object.constructor === Object){
			objectsearch(object, iterator);
		}else{
			return null;
		}

		result.children = new Stream(children)
		return result;
	}

	function objectsearch(object, cb){
		for(var i in object){
			if(object.hasOwnProperty(i)){
				cb(i, object[i], 'name');
			}
		}
	}

	function arraysearch(array, index, cb){
		for(var i = 0; i < array.length; i++){
			var nindex = index.slice(0).push(i);
			if(flatten && array[i].length){
				arraysearch(array[i], nindex, cb);
			}else{
				cb(nindex, array[i], 'index');
			}
		}
	}
}



function convert(object, )





// Add Children from child.js 


// build operation object
//tree.get('').each(function(){}).then(...);
//tree.get('').live(function(){}).then(...);

// read in js, build tree 
// get.json() -> Root






