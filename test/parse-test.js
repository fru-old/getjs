var parse = run.require('src/parse');



QUnit.test('Simple.', function(assert) {
	var template = "test.#test:id[test].{{test}}"; 
	assert.deepEqual(parse(template), [
	[   // test{{test2test}}
		{type: '_', name: [{constant: 'test'}]}
	],[ // ***
		{type: '#', name: [{constant: 'test'}]},
		{type: ':', name: [{constant: 'id'}], prop: [{constant: 'test'}]}
	],[ // test:id[test={{test}}]
		{type: '_', name: [{breakets: 'test'}]}
	]]);
});

QUnit.test('Check Template AST.', function(assert) {
	var template = "test{{test2test}}.***.test:id[test={{test}}].[test]";
	assert.deepEqual(parse(template), [
	[   // test{{test2test}}
		{type: '_', name: [{constant: 'test'},{breakets: 'test2test'}]}
	],[ // ***
		{type: '_', name: [{wildcard: 3}]}
	],[ // test:id[test={{test}}]
		{type: '_', name: [{constant: 'test'}]},
		{type: ':', name: [{constant: 'id'}], 
			prop: [{constant: 'test'}], assert: '=', value: [{breakets: 'test'}]},
	],[ // [test]
		{type: '[', prop: [{constant: 'test'}]}
	]]);
});