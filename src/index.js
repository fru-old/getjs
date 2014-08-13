
// Define get
function get(){

}

get.define  = define;
get.require = require;

// Make get globally available

if(typeof exports === "undefined"){
	window.get = get;
}else{
	module.exports = get;
}


/**
 * Executed after every module has been defined
 */
function afterDefine(){
	get.require('src/static')(get);	
}