
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

}