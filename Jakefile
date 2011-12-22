var fs = require('fs'),
	sys = require('sys'),
	uglify = require('uglify-js');

function concatenate(files, outputFile, withPreamble) {
	var output = '',
		license = fs.readFileSync('src/core/license.tmpl').toString(),
		template = fs.readFileSync('src/core/result.tmpl').toString();

	var all = '';
	files.forEach(function(file, i) {
		all += fs.readFileSync('src/' + file).toString();
		all += '\n';
	});

	if (withPreamble) {
		output += license;
		output += template.replace('{{CONTENT}}', all);
	} else {
		output = all;
	}

	fs.openSync('output/' + outputFile, 'w+');
	
	var out = fs.openSync('output/' + outputFile, 'w+');
	fs.writeSync(out, output);
}

desc('Library tools');
task('tools', function(params) {
	concatenate([
		'events-capture/events-capture.js'
		, 'z-manager/z-manager.js'
		, 'string-measurement/string-measurement.js'
	], 'doodads.tools.js');
});

desc('Concatenation');
task('concatenate', function(params) {
	concatenate([
		'core/doodad.js'
		, 'core/builder.js'
		, 'core/utils.js'
		, 'core/Validator.js'
		, 'core/HintBoxValidationListener.js'
		, 'core/config.js'
	], 'doodads.js', true);
});

desc('Obfuscation and Compression');
task({'minify': ['concatenate', 'tools']}, function(params) {
	function minify(inputFile, outputFile) {
		try {
			var all = fs.readFileSync('output/' + inputFile).toString(),
				out = fs.openSync('output/' + outputFile, 'w+'),
				ast = uglify.parser.parse(all);

			ast = uglify.uglify.ast_mangle(ast);
			ast = uglify.uglify.ast_squeeze(ast);

			fs.writeSync(out, uglify.uglify.gen_code(ast));
		} catch(e) {
			console.error(e);
		}
	}

	minify('doodads.js', 'doodads.min.js');
	minify('doodads.tools.js', 'doodads.tools.min.js');
});

desc('Library - precompilation of doodads');
task('library', function(params) {
	var doodads = require('./builders/nodejs/doodads-builder');
		builder = new doodads.Builder(__dirname + '/src');
		
	fs.readdir('./src/doodads', function (err, files) { 
		if (err) throw err;
		files.forEach( function (file) {
			builder.build({originalUrl: 'doodads/' + file + '.doodad'}, function (content) {
				fs.writeSync(fs.openSync('./output/doodads/' + file + '.doodad', 'w+'), content);
			});
	  	});
	});
});