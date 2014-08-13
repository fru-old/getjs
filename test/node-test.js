var Node   = get.require('src/node');
var Stream = get.require('src/stream');

function InfiniteStream(){
	var result = [];
	this.next = function(index, assertions, done){
		if(!result[index]){
			result[index] = new Node(null, new InfiniteStream());
			result[index].nodedata.tags.set('name', index);
		}
		done(null, index, result[index]);
	};
}

function getFirstFive(node, done){
	var result = [];
	(function recurse(index){
		node.next(index, null, function(element, i){
			result.push(element.get('tags','name'));
			if(result.length>=5)return done(result);
			recurse(i+1);
		}, function(){});
	})(0);
}

QUnit.test('Resolve operation.', function(assert){
	var root = new Node.Root(new Node(null, new InfiniteStream(), true));
	root.execute(function(){
		return function recursive(context){
			getFirstFive(context, function(result){
				//console.log(result);
			});
			return recursive;
		};
	}, function(){
		root.execute(function(context){
			context.next(0,null,function(element){
				element.next(0,null,function(){
					
				});
			});
		});
	});

	assert.ok(Node);
});