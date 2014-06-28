var toml = run.require('src/toml');

var walker = {
	parseExpression: function(value){

		if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(value.trim())){
			return {value: new Date(value.trim())};
		}

		try{
			return {value: JSON.parse(value)};
		}catch(e){
			return null;
		}
	},
	error: function(message, i, value){
		if(message === 'Expression invalid'){
			if(value && /,[\s\n]*(\}|\])/.test(value)){
				message += ' (Trailing commas not allowed)';
			}
		}

		if(arguments.length < 3){
			value = '';
		}
		if(value.toString()){
			value = ' "' +  value + '"';
		}
		console.log(message +  value + '.');
		// ignore
	},
	parseKey: function(key){
		return {key: key, attr: {}};
	},
	smallTabs: false,
	result: function(){
		return "done"
	},
	pop: function(){
		//console.log('pop');
	},
	root: function(attr){
		//console.log("Root arguments:");
		for(var j in attr){
			//console.log('    ' + j + ' = ' + attr[j]);
		}
	},
	push: function(key, attr, leaf, duplicate, double){
		leaf = leaf ? ' leaf' : ''; 
		duplicate = duplicate ? ' duplicate' : '';
		double = double ? ' double' : '';
		//console.log('push '+key.key+leaf+duplicate+double);
		if(leaf)
		for(var j in attr){
			//console.log('    ' + j + ' = ' + attr[j]);
		}
	}
};


QUnit.test( 'Parse simple', function( assert ) {
	var input = document.getElementById('example').innerHTML;
	var result = toml.parse(input, walker);

	assert.equal( result , "done");
});