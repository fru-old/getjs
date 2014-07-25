
var interoperability = {
    "ResultSet": {
        "totalResultsAvailable": "1827221",
        "totalResultsReturned": 2,
        "firstResultPosition": 1,
        "Result": [
            {
                "Title": "potato jpg",
                "Summary": "Kentang Si bungsu dari keluarga Solanum tuberosum L ini ternyata memiliki khasiat untuk mengurangi kerutan  jerawat  bintik hitam dan kemerahan pada kulit  Gunakan seminggu sekali sebagai",
                "Url": "http://www.mediaindonesia.com/spaw/uploads/images/potato.jpg",
                "ClickUrl": "http://www.mediaindonesia.com/spaw/uploads/images/potato.jpg",
                "RefererUrl": "http://www.mediaindonesia.com/mediaperempuan/index.php?ar_id=Nzkw",
                "FileSize": 22630,
                "FileFormat": "jpeg",
                "Height": "362",
                "Width": "532",
                "Thumbnail": {
                    "Url": "http://thm-a01.yimg.com/nimage/557094559c18f16a",
                    "Height": "98",
                    "Width": "145"
                }
            },
            {
                "Title": "potato jpg",
                "Summary": "Introduction of puneri aloo This is a traditional potato preparation flavoured with curry leaves and peanuts and can be eaten on fasting day  Preparation time   10 min",
                "Url": "http://www.infovisual.info/01/photo/potato.jpg",
                "ClickUrl": "http://www.infovisual.info/01/photo/potato.jpg",
                "RefererUrl": "http://sundayfood.com/puneri-aloo-indian-%20recipe",
                "FileSize": 119398,
                "FileFormat": "jpeg",
                "Height": "685",
                "Width": "1024",
                "Thumbnail": {
                    "Url": "http://thm-a01.yimg.com/nimage/7fa23212efe84b64",
                    "Height": "107",
                    "Width": "160"
                }
            }
        ]
    }
};


// Only global object is get

// get.func    -> Type: FunctionWrapper
// get.json    -> Type: Pointer
// get.toml    -> Type: Pointer
// get('path') -> Type: Pointer

// pointer.get(['path', 'or'])
// pointer.filter();
// pointer.json(); // or read??
// pointer.toml();
// pointer.prop();
// pointer.attr();
// pointer.tags();
// pointer.path();
// pointer.each();
// pointer.text();

// pointer.toJSON({}) // seperate from read so that options can be passed 

// pointer.version();
// pointer.clone(); 
// pointer.restore();
// pointer.extend(); // (clone coud be version + extend)
// pointer.component();

// Pointer only store: roots, paths and operations 
// Never stores any nodes
// Immediate runs these directly but doesnt store found nodes
// Except => detached roots
// pointer.immediate();
// pointer.prop('propname').immediate() -> returns result;
// When not run used immediate filter for propname

// apply operation op with timestamp to node n
// 1. Check than n has never run this op -> otherwise skip all 
// 2. When node was detached after op was issued -> increase counter
// 3. Prepare meta data
// 4. Match selector and if it matches run op
// 5. Add timestamp to op.previous = {}
// 6. Add operation to op.pending = Queue if op is still matchable
// 7. If n is no root increase op counter on parent
// Whenever any end is reached -> cleanup finished operations

// Objects: Operation is passed to n this has a counter which is increased
// Operation is matched and cloned (reset counter) and stored in n 



// pointer.append(); === each(function(){this.append();})
// pointer.before();
// pointer.after();
// pointer.detach();
// pointer.wrap();
// pointer.replace();
// pointer.unwrap();



// TODO thinking
// 1. Can we have an operation that runs for every newly attached node (e.g set every node to span)
// 2. Can we bind to mutations in node and execute action when change 
// in attr or e.g. children was detected
// 3. meta information
// - index of current node
// - depth in tree (stored for every op and increased on cloning)
// - NO contextual information or scopes
// 4. how does extend work lazily 
// - maybe node.intercept(...) can intercept all calls to children, attr, ...

// TODO
// 1. path expression parser
// 2. child.js rethink use of indexes!!!!
// titles.each(function(node, next){
//  node may only be accessed until next is called -> afterwards it throws exception
// });
// detached nodes do not expire

// wrap called on a detached node should makes the formerly detached node expire.
// => Explicit Root Type on which root may be called without expiring -> just the node in .root is changed and expired

// Why no two way binding
// Because of shared state -> far more versatile and concise
// html templates have no for or ifs and only very basic {{binding}}
// -> because there are only usefull to avoid a flash of unstyled content
// -> when all data has arived we can draw from json anyway




var titles = get('ResultSet.Result.[Title]').json(interoperability, {
	// ResultSet checks tags.name and then tags.prop
	// [Title] checks attr first and then prop
	// ResultSet.Result.:prop(Title)
	// ResultSet.Result.*
	// ResultSet.Result.:tags(type=='Object')
	// :tags(prop=='ResultSet').Result.:tags(prop falsey)
	flatten: false  // arrays in arrays become node and are not flattened
});

//Could also do: get.read(interoperability).get('');

titles.prop('Title', 'New title');
titles.prop('Title', function(value){
	return value + ' dom link';
});
titles.each(function(){
	this.prop('Title', this.prop('Title') + " dom link");
});

titles.prop('Title'); // Error: Can only get prop of resolved nodes
titles.immediate().prop('Title');

// Set function
titles.prop('Title', get.func(alert));
titles.prop('Title'); // -> alert




titles.each(function(node){
	this.append({
		name: 'title',
		text: this.prop('Title'),
		attr: {
			'class': ['custome', 'title']
		}
	});
});

titles.each('[Title]',function(){
	var node = this.append({});
	node.text(this.prop('Title'));
});

titles.filter(':single').each(function(){
	// ResultSet.Result.[Title]:single
	// Returns a single instance - which may not be the first instance in the document
	// !== titles.each(':single',function(){ this filters just before each is run
});

titles.each(function(){

	// Special cases here first and each work different
	var node = this.first('title'); // actual node
	this.each('title', function(){ // runs immediately and in order
		//this.detach(); // is this possible
	});

	this.before('selector:any', { // usual case. Doesnt support any . or ** selectors...
		text: 'text'
	});
	// !!!! might not be the same position as when gotten...
	this.after(node, { // most imperative control
		text: 'text'
	});

	// ResultSet.Result.[Title]:any
});

// When resolved with .immediate() meta data contains the position??

// Differenece between node in each loop or pointer???


// Global plugin setTag:

titles.setTag({
	'div:c1': 'ResultSet.Result.[Title].title'
});

// Components

titles.append({ name: '' });

get('ResultSet.Result').make(new XYComponent({
	'test': 'value',
	'test2.path': 'path'
}));

// virtual paths
// path : { 'xy', 'path'} // called with test.xy.

get('xyz').toml('# and no newlines and maxlength', {
	walker: custome_walker
});


var old = titles.version({recurse: false});
old.restore();

// Maybe not needed
get('xyz').html('<div> </div>');


// extend, ...


// How can the elements found under #result be merged into titles?
titles.draw('#result');


// close tree insertion
titles.each(function(node){
    other.append(node.detach());
}).immediate();




// Get syntax

get('{{title}}.name.{{other}}', {
    title: 'title',
    other: 'other'
});

get('title').get(1).get('x.y').get(-1)

get('title1', 'title2', '{{title}}', {
    title: 'title3'
});

get(['title1', 'title2', '{{title}}', {
    title: 'title3'
}]);

// !!! There is a difference between first child element and first match
// !!! get(1) works but get('title:1.xyz') does not! 



// While in an each difference between each and get
titles.each(function(){
    this.each('filter',...) // runs immediate
    this.get('filter').each(...) // runs later
    this.first() // runs immediate
    this.nth(3) // runs immediate
    this.nth(-1) // runs immediate
    this.last() // runs immediate 
})

// Children Length ??
// nth(-1) & last() & get(-1) can only run when the size of 
// children length is known or a search is started...



// Global matches
// Components may 'require' global matches 
// If a component is added to a root so are the global path matchers
// The component can then access them. 
// Is div / span inline seperator also component ??

