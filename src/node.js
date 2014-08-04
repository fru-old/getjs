// tags.index = [0,4,1]
// tags.name = 'xyz'
// tags.root = true

// prop.1 = 1

var Stream = require('./child');

get.json = function(object, options){
	var flatten = (options||{}).flatten;

	var root = makenode(object);
	if(!root){
		throw new Error('Expected toplevel array or object.');
	}
	root.tags.root = true;
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
			result.tags.array = true;
			arraysearch(object, [], iterator);
		}else if(object.constructor === Object){
			objectsearch(object, iterator);
		}else{
			return null;
		}

		result.children = new Stream(children);
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
};

