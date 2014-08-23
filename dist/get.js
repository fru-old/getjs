;(function(global, undefined){ 
 "use strict"; 

var modules   = {};
var factories = {};
var original  = {};

/**
 * This converts relative paths into absolute module names
 */
function normalize(id, base){
	
	// Some code golf to get the number of "directories" of the id back.
	var dots = /(\.?\.\/?)*/.exec(id)[0];
	var dirCount = Math.floor(dots.replace(/\//g, '').length/1.9 + 0.99);

	if(dirCount){
		// Reduce base by found number of "directories"
		var reduced = base.split('/');
		reduced = reduced.slice(0, reduced.length - dirCount);
		reduced = reduced.join('/');
		
		if(reduced){
			id = reduced + '/' + id.slice(dots.length);
		}
	}
	return id.replace(/\/$/, '');
}

/**
 * @Public
 */
function define(id, factory) { 
	var newid = id.replace(/\/index$/, '');

	// store mapped id to resolve path relative to old path
	if(newid !== id) original[newid] = id;

	// store factory under both new and old ids
	factories[id] = factories[newid] = factory;
}

/**
 * @Public
 */
function require(id) {
	if (!modules[id]){		
		var message = "Could not load module: '"+id+"'";
		if(!factories[id])throw new Error(message);

		// creates custome require function
		var customeRequire = function(newid){
			return require(normalize(newid, original[id] || id));
		};
		
		// This stops infinite recursion with circular dependencies
		var module = {exports: modules[id] = {}};

		// Build module
		factories[id](customeRequire, module.exports, module);
		modules[id] = module.exports;
	}
	
	return modules[id];
}
// Define get
function get(){

}

get.define  = define;
get.require = require;

get.plugin = function(object){

	function extend(target, key, map){
		var functions = (object||{})[key];
		for(var i in functions){
			target[i] = map ? map(functions[i]) : functions[i];
		}
	}

	extend(get, 'static');
};

/**
 * Executed after every module has been defined
 */
function afterDefine(){
	get.plugin(get.require('./plugins/serialize.js'));
	get.plugin(get.require('./plugins/curry.js'));
}

// Make get globally available
if(typeof exports === "undefined"){
	window.get = get;
}else{
	module.exports = get;
}
;define("src/node", function(require, exports, module){

function expired(){
	throw new Error('This reference has expired.');
}

// The context wraps the child stream and nodedata access to support the 
// following features
// - being notified before nodedata or the child stream is changed to clone the
//   node if this is needed
// - expiring the context when done counting
// - No default interceptors
// - hidden nodes & read-only
// - clone already iterates the tree as an operation on all recursive children
// Last:
// - mapping / intercepting the nodes methods; this may be done by intercepting the context

/**
 * Wraps access to a node 
 */
function Context(node, timestamp, count){

	/**
	 *
	 */
	this.clone = function(){
		if(count.expired())expired();
		/*var root = cloning()
		function doClone(context, n){
			root = cloning(n, !root);
			return doClone;
		}
		*/


		/// TODO how to integrate sub each/find in execute???

		var root;
		execute(node, function(context, node){
			root = cloning(node, true);
			return function recurse(context, node){
				cloning(node);
				return recursive;
			};
		}, timestamp);
		// On this operation execute MUST return immediately
		return new Node.Root(root);
	};

	this.internal = function(){
		return node;
	};

	this.isRoot = function(){
		if(count.expired())expired();
		return node.detached;
	};

	this.isInfinite = function(){
		if(count.expired())expired();
		return !!(node.children||{}).infinite;
	};

	this.set = function(type, key, value){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		node.onchange();
		return node.nodedata[type].set(key, value);
	};

	this.get = function(type, key){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		return node.nodedata[type].get(key);
	};

	this.all = function(type){
		if(count.expired())expired();
		if(!node.nodedata[type])throw new Error('Unknown type.');
		return node.nodedata[type].clone(true);
	};

	function iterator(find, iterate, each, done){
		count.start();
		var _error, _ended;
		var branch = count.branch(function(){
			if(done)done(_error, _ended);
			count.close();
		});
		branch.start();

		find(function(err, i, element, ended){
			if(ended || err){
				_error = err;
				_ended = ended;
				branch.close();
			}else{
				resolve(node, element, timestamp, function(){
					each(new Context(element, timestamp, branch), i);
					iterate(branch);
				});
			}
		});
	}

	this.next = function(start, assertion, each, done){
		if(count.expired())expired();

		iterator(function(found){
			node.children.next(start, assertion, found);
		}, function(branch){
			branch.close();
		}, each, done);
	};

	this.find = function(start, assertion, each, done){
		if(count.expired())expired();
		if(this.isInfinite()){
			if(done)done(null, {length: 0});
			return;
		}
		var recurse;

		iterator(function(found){
			recurse = function(){
				node.children.next(start, assertion, found);
			};
			recurse();
		}, function(){
			start += 1;
			recurse();
		}, each, done);
	};

}

// TODO
// 1: simple: get, set & next
// 2: hidden nodes & infinite nodes

// Immediate
//root() // bool
//set(type, key, value)
//get(type, key)
//all(type) clone raw
//detach -> context
//...

// Async
//next(start, assertion, done)
//find(start, assertion, each, done)

//tags.readonly
//tags.infinite

Node.Root = function(node){
	node.detached = true;
	this.execute = function(operation, done){
		if(!node.detached)expired();
		execute(node, operation, ID.ascending(), done);
	};
};

function Roots(stream){
	this.prependTo = function(context, index){
		
	};
	this.appendTo = function(context){

	};
}

module.exports = Node;});
;define("src/public", function(require, exports, module){var Query = require('./query');


function Public(){
	this.root  = null;
	this.query = new Query();
}

Public.prototype.get = function(){
	this.query.concat(new Query(arguments));
	return this;
};

Public.prototype.has = function(){
	this.query.concat(new Query(arguments, {
		isHas: true
	}));
	return this;
};

Public.prototype.from = function(root){
	this.root = root;
	return this;
};


Public.prototype.each = function(func){
	if(this.query.matchesRoot()){
		this.root.execute(function(node){
			func(node);
		});
	}else{
		var state = this.query.buildStateMachine();
		this.root.execute(function(){
			return function iterate(node){
				state = state.transition(node);
				if(state.resolve()){
					func(node);
				}
				if(!state.isDone())return iterate;
			};
		});
	}
};

Public.prototype.live = function(func, done){
	
};









module.exports = Public;
});afterDefine(); 
 }(Function("return this")()));