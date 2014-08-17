var newparse = get.require('src/newparse');

QUnit.test('Tokenize.', function(assert) {
	var queryParser = newparse(newparse.querylang);
	var result = queryParser('test[xyz==345-35]');
	//console.log(JSON.stringify(result, null, 2));
	assert.ok(true);
});