
QUnit.test('Plain object serialization.', function(assert) {
	var json = {};
	var root = get.read(json);
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Plain object serialization.', function(assert) {
	var json = [];
	var root = get.read(json);
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Simple property serialization.', function(assert) {
	var json = {
		test: 34
	};
	var root = get.read(json);
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Subnode object serialization.', function(assert) {
	var json = {
		test: {
			test: 123
		}
	};
	var root = get.read(json);
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Node array serialization.', function(assert) {
	var json = {
		test: [{test: 1}, {test: 2}, {test: 3}]
	};
	var root = get.read(json);
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Node array serialization.', function(assert) {
	var json = {
		test: [[[{test: 1}]], {test: 2}, {test: 3}]
	};
	var root = get.read(json, {flatten: true});
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Node array serialization.', function(assert) {
	var json = {
		test: [[[{test: 1}]], {test: 2}, {test: 3}]
	};
	var root = get.read(json);
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Simple array values.', function(assert) {
	var json = {
		test: [1,2,3]
	};
	var root = get.read(json);
	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	})
});

QUnit.test('Flatten array values.', function(assert) {
	var json = {
		test: [[1,2,3, {test: [123]}]]
	};
	var root = get.read(json);
	var flat = get.read(json, {flatten: true});

	get.toJS(root, function(result){
		get.toJS(flat, function(result2){
			assert.deepEqual(result, json);
			assert.deepEqual(result2, json);
		});
	});
});