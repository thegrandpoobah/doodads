var fs = require('fs');
var sys = require('sys');
var uglify = require('uglify-js');

desc('Concatenation');
task('concatenate', function(params) {
	var files = [
		'innershiv/innershiv.src.js'
		, 'mustache/mustache.js'
		, 'string-measurement/string-measurement.js'
		, 'core/ValidationEventArgs.js'
		, 'core/Component.js'
		, 'core/ComponentFactory.js'
		, 'core/capturingEvents.js'
		, 'core/Validator.js'
		, 'core/z-manager.js'
	];

	var all = '';
	files.forEach(function(file, i) {
		if (file.match(/^.*js$/)) {
			all += fs.readFileSync('src/'+file).toString();
			//all += '\n';
		}
	});
	
	var out = fs.openSync('output/doodads.js', 'w+');
	fs.writeSync(out, all);
});

desc('Obfuscation and Compression');
task({'minify': ['concatenate']}, function(params) {
	var all = fs.readFileSync('output/doodads.js').toString();
	
	var ast = uglify.parser.parse(all);
	var out = fs.openSync('output/doodads.min.js', 'w+');
	ast = uglify.uglify.ast_mangle(ast);
	ast = uglify.uglify.ast_squeeze(ast);
	fs.writeSync(out, uglify.uglify.gen_code(ast));
});