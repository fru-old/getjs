var toml = run.require('src/toml');

QUnit.test( 'Parse comment simple', function( assert ) {
	var code    = 'code';
	var comment = 'comment';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});

QUnit.test( 'Parse comment double quotes', function( assert ) {
	var code    = '"code"';
	var comment = 'comment';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});

QUnit.test( 'Parse comment double quotes difficult', function( assert ) {
	var code    = '"co\'#de"';
	var comment = 'comment';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});

QUnit.test( 'Parse comment single quotes difficult', function( assert ) {
	var code    = '\'co\"#de\'';
	var comment = 'comment';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});

QUnit.test( 'Unfinished single quote', function( assert ) {
	var code    = '\'co\"#de';
	var comment = '';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});

QUnit.test( 'Unfinished double quote', function( assert ) {
	var code    = '"co\'#de';
	var comment = '';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});

QUnit.test( 'Parse regexp difficult', function( assert ) {
	var code    = '/co\"#de/';
	var comment = 'comment';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});


QUnit.test( 'Parse regexp difficult', function( assert ) {
	var code    = '/co\"#de/';
	var comment = 'comment';
	var full = code + (comment ? '#'+comment : '');
	assert.equal( full.replace(uncomment,'$1') , code);
});