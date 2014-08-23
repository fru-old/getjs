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