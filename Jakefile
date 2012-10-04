var fs = require('fs'),
	sys = require('util'),
	jshint = require('jshint'),
	uglify = require('uglify-js');

var sourceFiles = [
	'core/doodad.js'
	, 'core/builder.js'
	, 'core/utils.js'
	, 'core/Validator.js'
	, 'core/config.js'
];

var listenersFiles = [
	'validationListeners/hintbox.js'
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

function lint(files) {
	files.forEach(function(file, i) {
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
}

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

function copyFile(srcFile, destFile) {
	var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;
	BUF_LENGTH = 64 * 1024;
	buff = new Buffer(BUF_LENGTH);
	fdr = fs.openSync(srcFile, 'r');
	fdw = fs.openSync(destFile, 'w');
	bytesRead = 1;
	pos = 0;
	while (bytesRead > 0) {
		bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
		fs.writeSync(fdw, buff, 0, bytesRead);
		pos += bytesRead;
	}
	fs.closeSync(fdr);
	return fs.closeSync(fdw);
};

desc('Linter');
task('lint', function(params) {
	lint(sourceFiles);
	lint(listenersFiles);
});

desc('Library');
task('library', function(params) {
	lint(sourceFiles);
	concatenate(sourceFiles, 'doodads.js', true);
	minify('doodads.js', 'doodads.min.js');
});

desc('Validation Listeners');
task('listeners', function(params) {
	lint(listenersFiles);
	listenersFiles.forEach(function(file, i) {
		copyFile('src/' + file, 'output/' + file);
		minify(file, file.replace('.js', '.min.js'));
	});
});
