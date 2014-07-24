
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

// special mode for demo
get.always_immediate = true;


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


