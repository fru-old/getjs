var Query = require('./query');


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
