var fs = require('fs'),
	path = require('path');

function builder(dir) {
	this.dir = dir;	
}

builder.prototype.build = function(req, callback) {
	var self = this,
		n = req.params[0],
		output = [],
		originalUrl = req.originalUrl;

	output.push("(function(definition) {");	
	output.push("doodads.setup('" + originalUrl + "', definition);");

	var directory = path.dirname(originalUrl),
		filename = path.basename(originalUrl, '.doodad')

	// definition
	var definitionBuffer = fs.readFileSync(this.dir + '/' + directory + '/' + filename + '/' + filename + '.json'),
		definition = JSON.parse(definitionBuffer.toString());

	// Behavior
	var behaviourBuffer = fs.readFileSync(self.dir + definition.behavior),
		behaviourString = behaviourBuffer.toString();

	behaviourString = behaviourString.replace(/doodads\s*\.\s*setup\(\)/g, "doodads.setup('" + originalUrl + "')");

	output.push(behaviourString);
	output.push("})({");

	// Fields
	var fields = [];
	if (definition.inheritsTemplates) {
		fields.push("inheritsTemplates: true");
	}
	if (definition.validates) {
		fields.push("validates: true");
	}

	// Templates
	if (definition.templates) {
		var templateOutput = [],
			partials = [];

		templateOutput.push("templates: {");

		// Base
		var baseTmpl;
		if (!definition.templates.base) {
			baseTmpl = "<div />";
		} else {
			var baseTmplBuffer = fs.readFileSync(this.dir + definition.templates.base);
			baseTmpl = JSON.stringify(baseTmplBuffer.toString());
			delete definition.templates.base;
		}
		templateOutput.push("base : " + baseTmpl);

		// Partials
		for (var key in definition.templates) {
			var partialTmplPath = definition.templates[key],
				partialTmplBuffer = fs.readFileSync(this.dir + partialTmplPath),
				partialTmplString = JSON.stringify(partialTmplBuffer.toString());

			partials.push("\"" + key + "\" : " + partialTmplString + "\n");
		}

		if (partials.length > 0) {
			templateOutput.push(',');
			templateOutput.push(partials.join(','));
		}
		templateOutput.push("}");
		fields.push(templateOutput.join(""));
	}

	// Stylesheets
	if (definition.stylesheets) {
		var stylesheetsOutput = [];
			stylesheets = [];

		stylesheetsOutput.push("stylesheets: {");

		for (var i = 0, len = definition.stylesheets.length; i < len; i++) {
			var stylesheetPath = definition.stylesheets[i],
				stylesheetBuffer = fs.readFileSync(this.dir + stylesheetPath),
				stylesheetString = JSON.stringify(stylesheetBuffer.toString());
			
			stylesheets.push(JSON.stringify(stylesheetPath) + " : " + stylesheetString + "\n");					
		}

		
		stylesheetsOutput.push(stylesheets.join(','));
		stylesheetsOutput.push("}");
		fields.push(stylesheetsOutput.join(""));
	}

	output.push(fields.join(','));
	output.push("});");

	var result = output.join('\n')

	callback(result);
}

exports.Builder = builder;