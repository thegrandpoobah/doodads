var fs = require('fs'),
	sys = require('util'),
	jshint = require('jshint'),
	uglify = require('uglify-js');

var sourceFiles = [
	'core/doodad.js'
	, 'core/builder.js'
	, 'core/utils.js'
	, 'core/Validator.js'
	, 'core/HintBoxValidationListener.js'
	, 'core/config.js'
];
	
function makeDirectoryIfNotExists(path) {
	try {
		var stats = fs.statSync(path);
		if (!stats.isDirectory()) {
			fs.mkdirSync(path, 0);
		}
	} catch (e) {
		fs.mkdirSync(path, 0);
	}
}

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

	makeDirectoryIfNotExists('output');
	
	fs.openSync('output/' + outputFile, 'w+');
	
	var out = fs.openSync('output/' + outputFile, 'w+');
	fs.writeSync(out, output);
}

desc('Concatenation');
task('concatenate', function(params) {
	concatenate(sourceFiles, 'doodads.js', true);
});

desc('Code Lint');
task('lint', function() {
	sourceFiles.forEach(function(file, i) {
		var all = fs.readFileSync('src/' + file).toString();
		
		var result = jshint.JSHINT(all, {}, {});
		if (!result) {
			for (var i = 0; i < jshint.JSHINT.errors.length; i++) {
				var error = jshint.JSHINT.errors[i];
				if (!error) {
					continue;
				}
				process.stdout.write('file: ' + file + ', line: ' + error.line + ', char ' + error.character + ': ' + error.reason + '\n');
			}
		}
	});
});

desc('Obfuscation and Compression');
task({'minify': ['lint', 'concatenate']}, function(params) {
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
});
