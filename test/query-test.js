var Query  = get.require('src/query');
var parse  = get.require('src/parse');
var Stream = get.require('src/stream');

QUnit.test('Transition state machine.', function(assert){

	var first = {
		get: function(type, key){
			assert.equal(type, 'tags');
			assert.equal(key, 'name');
			return '1';
		}
	}

	var traces = [parse('1')];
	var result = Query.buildStateMachine(traces);

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

	var traces = [parse('3')];
	var result = Query.buildStateMachine(traces);

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

	var traces = [parse('1.2')];
	var result = Query.buildStateMachine(traces);

	assert.ok(!result.resolve());
	result = result.transition(first);
	assert.ok(!result.resolve());
	result = result.transition(second);
	assert.ok(result.resolve());
});