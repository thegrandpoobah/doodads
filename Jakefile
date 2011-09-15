var fs = require('fs');
var sys = require('sys');
var uglify = require('uglify-js');

desc('Uglify JS');
task('minify', [], function(params) {
	var files = [
		'ValidationEventArgs.js',
		'Component.js',
		'ComponentFactory.js',
		'capturingEvents.js',		
		'Validator.js',
		'z-manager.js'
	];

	var all = '';
	files.forEach(function(file, i) {
		if (file.match(/^.*js$/)) {
			all += fs.readFileSync('src/core/'+file).toString();
			all += '\n\r';
		}
	});

	var ast = uglify.parser.parse(all);
	var out = fs.openSync('doodads.js', 'w+');
	ast = uglify.uglify.ast_mangle(ast);
	ast = uglify.uglify.ast_squeeze(ast);
	fs.writeSync(out, uglify.uglify.gen_code(ast));
});