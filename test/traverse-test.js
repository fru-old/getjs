var curry = run.require('src/curry');

QUnit.test( 'Underscore has runid.', function( assert ) {
	assert.ok( !!_.runid );
});