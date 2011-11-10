var fs = require('fs'),
	sys = require('sys'),
	uglify = require('uglify-js');

desc('Concatenation');
task('concatenate', function(params) {
	var files = [
		'mustache/mustache.js'
		, 'string-measurement/string-measurement.js'
		, 'core/doodad.js'
		, 'core/builder.js'
		, 'core/utils.js'
		, 'core/capturingEvents.js'
		, 'core/Validator.js'
		, 'core/HintBoxValidationListener.js'
		, 'core/z-manager.js'
	];
	
	var output = '',
		license = fs.readFileSync('src/core/license.tmpl').toString(),
		template = fs.readFileSync('src/core/result.tmpl').toString();

	output += license;

	var all = '';
	files.forEach(function(file, i) {
		all += fs.readFileSync('src/' + file).toString();
		all += '\n';
	});

	output += template.replace('{{CONTENT}}', all)

	fs.openSync('output/doodads.js', 'w+');
	
	var out = fs.openSync('output/doodads.js', 'w+');
	fs.writeSync(out, output);
});

desc('Obfuscation and Compression');
task({'minify': ['concatenate']}, function(params) {
	try {
		var all = fs.readFileSync('output/doodads.js').toString(),
			out = fs.openSync('output/doodads.min.js', 'w+'),
			ast = uglify.parser.parse(all);

		ast = uglify.uglify.ast_mangle(ast);
		ast = uglify.uglify.ast_squeeze(ast);

		fs.writeSync(out, uglify.uglify.gen_code(ast));
	} catch(e) {
		console.error(e);
	}
});
