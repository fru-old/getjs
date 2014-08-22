var Stream = get.require('src/stream');

function toArray(children, done, array){
	if(!array)array = [];
	children.next(array.length, null, function(err, i, element, ended){
		if(ended){
			done(array);
		}else{
			array.push(element);
			toArray(children, done, array);
		}
	});
}

QUnit.test('Test toArray.', function(assert) {
	var array  = [1,2,3,4,5]; 
	var simple = new Stream.Array(array);

	toArray(simple, function(result){
		assert.deepEqual(array, result);
	});
});

QUnit.test('Test concat.', function(assert) {
	var a1 = new Stream.Array([1,2]);
	var a2 = new Stream.Array([3,4]);

	toArray(a1.append(a2), function(result){
		assert.deepEqual([1,2,3,4], result);
	});
});

QUnit.test('Test concat twice.', function(assert) {
	var a1 = new Stream.Array([1,2]);
	var a2 = new Stream.Array([3]);
	var a3 = new Stream.Array([4]);

	toArray(a1.append(a2).append(a3), function(result){
		assert.deepEqual([1,2,3,4], result);
	});
});

QUnit.test('Test insert.', function( assert ) {
	var a1 = new Stream.Array([1,4]);
	var a2 = new Stream.Array([2,3]);
	
	toArray(a1.prepend(1, a2), function(result){
		assert.deepEqual([1,2,3,4], result);
	});
});

QUnit.test('Test insert after end.', function( assert ) {
	var a1 = new Stream.Array([1]);
	var a2 = new Stream.Array([3,4]);

	toArray(a1.prepend(2, a2), function(result){
		assert.deepEqual([1,undefined,3,4], result);
	});
});

QUnit.test('Test detach.', function( assert ) {
	var a1 = new Stream.Array([1,2,3,4]);
	var re = a1.detach(2,2);

	toArray(re.target, function(result){
		assert.deepEqual([1,2], result);
	});

	toArray(re.result, function(result){
		assert.deepEqual([3,4], result);
	});
});
