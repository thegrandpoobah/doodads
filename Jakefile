var fs = require('fs'),
	sys = require('sys'),
	uglify = require('uglify-js');

desc('Concatenation');
task('concatenate', function(params) {
	var files = [
		'innershiv/innershiv.src.js'
		, 'mustache/mustache.js'
		, 'string-measurement/string-measurement.js'
		, 'core/doodad.js'
		, 'core/builder.js'
		, 'core/utils.js'
		, 'core/capturingEvents.js'
		, 'core/Validator.js'
		, 'core/HintBoxValidationListener.js'
		, 'core/z-manager.js'
	];
	
	// Add license and closure
	files.unshift('core/pre.tmpl');
	files.unshift('core/license.tmpl');
	files.push('core/post.tmpl');

	var all = '';
	files.forEach(function(file, i) {
		all += fs.readFileSync('src/' + file).toString();
		all += '\n';
	});
	
	var out = fs.openSync('output/doodads.js', 'w+');
	fs.writeSync(out, all);
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
