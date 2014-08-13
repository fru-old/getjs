
module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-qunit-examples');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-closure-tools');

	var pkg = grunt.file.readJSON('package.json');

	grunt.registerTask('size', 'Display file sizes.', function() {
		var max = grunt.file.read('dist/get.js');
		var min = grunt.file.read('dist/get-'+pkg.version+'.min.js');
		console.log(require('maxmin')(max, min, true));
	});

	function wrap(src, path){
		path = path.replace(/.js$/, '')
		src  = 'function(require, exports, module){' + src + '}';
		return ';define("' + path + '", '+ src + ');';
	}

	grunt.initConfig({
		concat: {
			dist: {
				src: ['src/require.js', '!src/index.js', 'src/*.js', 'src/index.js'],
				dest: 'dist/get.js',
				options: {
					process: function(src, path){
						if(path === 'src/require.js' || path === 'src/index.js'){
							return src;
						}
						return wrap(src, path);
					},
					banner: ';(function(global, undefined){ \n "use strict"; \n',
					footer: 'afterDefine(); \n }(Function("return this")()));'
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
					src: ['dist/get.js'],
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
				src: 'dist/get.js',
				dest: 'dist/get-'+pkg.version+'.min.js'
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