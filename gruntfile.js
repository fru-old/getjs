
module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-qunit-examples');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-closure-tools');

	var pkg = grunt.file.readJSON('package.json');

	grunt.registerTask('size', 'Display file sizes.', function() {
		var max = grunt.file.read('dist/run.js');
		var min = grunt.file.read('dist/run-'+pkg.version+'.min.js');
		console.log(require('maxmin')(max, min, true));
	});

	var args = [
		'(typeof exports === "undefined" ? window.run={} : exports)',
		'Function("return this")()'
	].join(',');

	function wrap(src, path){
		path = path.replace(/.js$/, '')
		src  = 'function(require, exports, module){' + src + '}';
		return ';define("' + path + '", '+ src + ');';
	}

	grunt.initConfig({
		concat: {
			dist: {
				src: ['src/require.js', 'src/*.js'],
				dest: 'dist/run.js',
				options: {
					process: function(src, path){
						if(path === 'src/require.js')return src;
						return wrap(src, path);
					},
					banner: ';(function(run, global, undefined){ \n "use strict"; \n',
					footer: '\n run.require("src"); \n }(' + args + '));'
				}
			}
		},

		qunit: {
			options: {
				force: true,
				'--web-security': 'no',
				coverage: {
					instrumentedFiles: '/temp',
					disposeCollector: true,
					src: ['dist/run.js'],
					htmlReport: 'report/coverage'
				},
				addJSDocExamples: 'test/test.html'
			},
			all: ['test/test.html']
		},

		jshint: {
			options: {
				force: true
			},
			all: ['src/*.js']
		},

		watch: {
			scripts: {
				files: ['src/*.js', 'test/**/*'],
				tasks: ['build'],
				options: {
					spawn: false,
				}
			}
		},
		
		closureCompiler: {
		  	options: {
				compilerFile: require('closure-compiler').JAR_PATH,
				compilation_level: 'SIMPLE_OPTIMIZATIONS'
			},
			all: {
				src: 'dist/run.js',
				dest: 'dist/run-'+pkg.version+'.min.js'
			}
		},

		jsdoc : {
			dist : {
				src: ['src/*.js'], 
				options: {
					destination: 'report/jsdocs'
				}
			}
		}
	});
	
	grunt.registerTask('build', ['concat', 'jshint', 'qunit']);
	grunt.registerTask('default', ['build', 'closureCompiler', 'size', 'watch']);
};