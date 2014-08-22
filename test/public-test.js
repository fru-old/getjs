var Get = get.require('src/public');

QUnit.test('Plain object serialization.', function(assert) {
	var json = {a: {
		b :{
			c: {
				test: 'value'
			}
		}
	}};
	var root = get.read(json);

	var counter = 0;
	new Get().get('**.c', 'a.b', 'a').from(root).each(function(node){
		var name = node.get('tags', 'name');
		var test = node.get('prop', 'test');
		counter++;

		if(counter === 1)assert.equal(name, 'a');
		if(counter === 2)assert.equal(name, 'b');
		if(counter === 3)assert.equal(name, 'c');

		if(counter === 1)assert.equal(test, undefined);
		if(counter === 2)assert.equal(test, undefined);
		if(counter === 3)assert.equal(test, 'value');
	});

	get.toJS(root, function(result){
		assert.deepEqual(result, json);
	});
});

QUnit.test('Check Root.', function(assert) {
	var root = get.read({
		a: {}
	});

	new Get().get().from(root).each(function(node){
		assert.ok(node.isRoot());
	});
});


QUnit.test('Set value.', function(assert) {
	var root = get.read({
		a: {
			b :{
				c: {
					test: 'value'
				}
			}
		}
	});

	new Get().get('**.c').from(root).each(function(node){
		node.set('prop', 'test', 'value2');
	});

	get.toJS(root, function(result){
		assert.deepEqual(result.a.b.c.test, 'value2');
	});
});


QUnit.test('Clone tree.', function(assert) {
	var root = get.read({
		a: {
			b :{
				c: {
					test: 'value'
				}
			}
		}
	});

	var a;
	new Get().get('a').from(root).each(function(node){
		a = node.clone();
	});
	new Get().get('**.c').from(root).each(function(node){
		node.set('prop', 'test', 'value2');
		console.log("!!!!!!!!");
	});
	get.toJS(root, function(result){
		//console.log(a);
		get.toJS(a, function(a){
			console.log(JSON.stringify(a, null, 2));
			assert.deepEqual(a.b.c.test, 'value');
		});
		console.log(JSON.stringify(result, null, 2));
		//assert.deepEqual(result.a.b.c.test, 'value2');
	});
});