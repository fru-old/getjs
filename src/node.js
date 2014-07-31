
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

function InternalKeyValue(initial){

}

function InternalChildren(){
	
}

function InternalNode(){
	this.attr = new InternalKeyValue();
	this.prop = new InternalKeyValue();
	this.path = new InternalKeyValue();
	this.tags = new InternalKeyValue();
	this.text = new InternalKeyValue();
	this.children = new InternalChildren();
}



// Add Children from child.js 


// build operation object
//tree.get('').each(function(){}).then(...);
//tree.get('').live(function(){}).then(...);

// read in js, build tree 
// get.json() -> Root






