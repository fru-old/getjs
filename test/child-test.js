var Steam = run.require('src/child');

function nextToArray(children, done, array){
	if(!array)array = [];
	children.next(array.length, null, function(err, i, element, ended){
		if(ended){
			done(array);
		}else{
			array.push(element);
			nextToArray(children, done, array);
		}
	});
}

function toArray(assert, children, done){
	nextToArray(children, function(result){
		done(result);
	});
}

QUnit.test('Test toArray.', function(assert) {
	var array  = [1,2,3,4,5]; 
	var simple = new Children.Stream(array);

	toArray(assert, simple, function(result){
		assert.deepEqual(array, result);
	});
});

QUnit.test('Test concat.', function(assert) {
	var a1 = new Children.Stream([1,2]);
	var a2 = new Children.Stream([3,4]);
	var ch = new Children(a1);
	ch.append(a2);

	toArray(assert, ch, function(result){
		assert.deepEqual([1,2,3,4], result);
	});
});

QUnit.test('Test concat twice.', function(assert) {
	var a1 = new Children.Stream([1,2]);
	var a2 = new Children.Stream([3]);
	var a3 = new Children.Stream([4]);
	var ch = new Children(a1);
	ch.append(a2);
	ch.append(a3);

	toArray(assert, ch, function(result){
		assert.deepEqual([1,2,3,4], result);
	});
});

QUnit.test('Test insert.', function( assert ) {
	var a1 = new Children.Stream([1,4]);
	var a2 = new Children.Stream([2,3]);
	var ch = new Children(a1);
	ch.insert(1, a2);

	toArray(assert, ch, function(result){
		assert.deepEqual([1,2,3,4], result);
	});
});

QUnit.test('Test insert after end.', function( assert ) {
	var a1 = new Children.Stream([1]);
	var a2 = new Children.Stream([3,4]);
	var ch = new Children(a1);
	ch.insert(2, a2);

	toArray(assert, ch, function(result){
		assert.deepEqual([1,undefined,3,4], result);
	});
});

QUnit.test('Test detach.', function( assert ) {
	var a1 = new Children.Stream([1,2,3,4]);
	var ch = new Children(a1);
	var a2 = ch.detach(2, 2);

	toArray(assert, ch, function(result){
		assert.deepEqual([1,2], result);
	});

	toArray(assert, a2, function(result){
		assert.deepEqual([3,4], result);
	});
});

QUnit.test('Test each.', function( assert ) {
	var stream = new Children.Stream([1,2,3,4]);
	var result = [];
	stream.each(function(index, element, next){
		result.push(element);
		next();
	}, null, 0, function(){
		toArray(assert, stream, function(array){
			assert.deepEqual(array, result);
		});
	});
});
