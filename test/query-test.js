var Query  = get.require('src/query');
var Stream = get.require('src/stream');

QUnit.test('Tokenize.', function(assert) {
	var result = new Query(['test[xyz==345-35].tes.**.test.[test=={tes}]']);
	//console.log(JSON.stringify(result.traces));
	// Filter functions
	result.traces = JSON.parse(JSON.stringify(result.traces));
	assert.deepEqual([[
		[
			{type: '_', value: 'test'},
			{type: '[', name: 'xyz', value: '345-35'}
		],
		[
			{type: '_', value: 'tes'}
		],
		{
			type: '**'
		},
		[
			{type: '_', value: 'test'}
		],
		[
			{type: '[', name: 'test', value: 'tes', lookup: true}
		]
	]], result.traces);
});

QUnit.test('Transition state machine.', function(assert){

	var first = {
		get: function(type, key){
			assert.equal(type, 'tags');
			assert.equal(key, 'name');
			return '1';
		}
	}

	var result = new Query(['1']).buildStateMachine();

	assert.ok(!result.resolve());
	result = result.transition(first);
	assert.ok(result.resolve());
});

QUnit.test('Transition state machine negative.', function(assert){

	var first = {
		get: function(type, key){
			assert.equal(type, 'tags');
			assert.equal(key, 'name');
			return '1';
		}
	}

	var result = new Query(['3']).buildStateMachine();

	assert.ok(!result.resolve());
	result = result.transition(first);
	assert.ok(!result.resolve());
});

QUnit.test('Transition state machine twice.', function(assert){

	var first = {
		get: function(type, key){
			assert.equal(type, 'tags');
			assert.equal(key, 'name');
			return '1';
		}
	}

	var second = {
		get: function(type, key){
			assert.equal(type, 'tags');
			assert.equal(key, 'name');
			return '2';
		}
	}

	var result = new Query(['1.2']).buildStateMachine();

	assert.ok(!result.resolve());
	result = result.transition(first);
	assert.ok(!result.resolve());
	result = result.transition(second);
	assert.ok(result.resolve());
});