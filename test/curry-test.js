var curry = get.require('src/curry');

var twiceadd = curry(function(a, b){
	return a + b*2;
});

QUnit.test( 'Simple Curry', function( assert ) {
	assert.equal( twiceadd(_, 3)(2) , 2+6);
});

QUnit.test( 'Curry at end', function( assert ) {
	assert.equal( twiceadd(3, _)(2) , 3+4);
});

QUnit.test( 'Excessive argmunents', function( assert ) {
	assert.equal( twiceadd(3, _)(2, 4) , 3+4);
});

QUnit.test( 'Direct call', function( assert ) {
	assert.equal( twiceadd(2, 3) , 2+6);
});