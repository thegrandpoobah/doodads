var fs = require('fs');

function builder(dir) {
	this.dir = dir;	
}

builder.prototype.build = function(req, callback) {
	var self = this,
		name = req.params[0],
		output = [],
		originalUrl = req.originalUrl;

	output.push("(function(definition) {");	
	output.push("doodads.setup('" + originalUrl + "', definition);");

	// definition
	var definitionBuffer = fs.readFileSync(this.dir + '/' + name + '/' + name + '.json');
	var definition = JSON.parse(definitionBuffer.toString());

	// Behavior
	var behaviourBuffer = fs.readFileSync(self.dir + definition.behavior);
	var behaviourString = behaviourBuffer.toString();
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
		var templateOuput = [];
		templateOuput.push("templates: {");

		// Base
		var baseTmpl;
		if (!definition.templates.base) {
			baseTmpl = "<div />";
		} else {
			var baseTmplBuffer = fs.readFileSync(this.dir + definition.templates.base);
			baseTmpl = JSON.stringify(baseTmplBuffer.toString());
			delete definition.templates.base;
		}
		templateOuput.push("base : " + baseTmpl);

		// Partials
		for (var key in definition.templates) {
			var partialTmplPath = definition.templates[key],
				partialTmplBuffer = fs.readFileSync(this.dir + partialTmplPath),
				partialTmplString = JSON.stringify(partialTmplBuffer.toString());

			templateOuput.push(", \"" + key + "\" : " + partialTmplString + "\n");
		}

		templateOuput.push("}");
		fields.push(templateOuput.join(""));
	}

	output.push(fields.join(','));
	output.push("});");

	var result = output.join('\n')

	callback(result);
}

exports.Builder = builder;