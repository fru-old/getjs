var toml = run.require('src/toml');

var walker = {
	parseExpression: function(value){
		try{
			return {value: JSON.parse(value)};
		}catch(e){
			return null;
		}
	},
	error: function(message, i, value){
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
		console.log('pop');
	},
	push: function(key, attr, leaf, duplicate){
		leaf = leaf ? ' leaf' : ''; 
		duplicate = duplicate ? ' duplicate' : '';
		console.log('push '+key.key+leaf+duplicate);
	}
};


QUnit.test( 'Parse simple', function( assert ) {
	var result = toml.parse(' 	\n\
	 	[.test.test.]			\n\
	 	at1 = {"d": ""}	      	\n\
	[test]					   	\n\
	 	[test.test]				\n\
	 	at1 = {               	\n\
	 		"d": ""           	\n\
	 	}	      			  	\n\
	', walker);

	assert.equal( result , "done");
});