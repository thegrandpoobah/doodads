/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
  
  This implementation adds a template compiler for faster processing and fixes bugs.
  See http://www.saliences.com/projects/mustache/mustache.html for details.
*/

var Mustache = (function(undefined) {
	var splitFunc = (function() {
		// fix up the stupidness that is IE's broken String.split implementation
		/* Cross-Browser Split 1.0.1
		(c) Steven Levithan <stevenlevithan.com>; MIT License
		An ECMA-compliant, uniform cross-browser split method 
		*/
		var compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
		function capturingSplit(separator) {
			var str = this;
			var limit = undefined;
			
			// if `separator` is not a regex, use the native `split`
			if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
				return String.prototype.split.call(str, separator, limit);
			}

			var output = [],
				lastLastIndex = 0,
				flags = (separator.ignoreCase ? "i" : "") +
						(separator.multiline  ? "m" : "") +
						(separator.sticky     ? "y" : ""),
				separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
				separator2, match, lastIndex, lastLength;

			str = str + ""; // type conversion
			if (!compliantExecNpcg) {
				separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
			}

			/* behavior for `limit`: if it's...
			- `undefined`: no limit.
			- `NaN` or zero: return an empty array.
			- a positive number: use `Math.floor(limit)`.
			- a negative number: no limit.
			- other: type-convert, then use the above rules. */
			if (limit === undefined || +limit < 0) {
				limit = Infinity;
			} else {
				limit = Math.floor(+limit);
				if (!limit) {
					return [];
				}
			}

			while (match = separator.exec(str)) {
				lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

				if (lastIndex > lastLastIndex) {
					output.push(str.slice(lastLastIndex, match.index));

					// fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
					if (!compliantExecNpcg && match.length > 1) {
						match[0].replace(separator2, function () {
							for (var i = 1; i < arguments.length - 2; i++) {
								if (arguments[i] === undefined) {
									match[i] = undefined;
								}
							}
						});
					}

					if (match.length > 1 && match.index < str.length) {
						Array.prototype.push.apply(output, match.slice(1));
					}

					lastLength = match[0].length;
					lastLastIndex = lastIndex;

					if (output.length >= limit) {
						break;
					}
				}

				if (separator.lastIndex === match.index) {
					separator.lastIndex++; // avoid an infinite loop
				}
			}

			if (lastLastIndex === str.length) {
				if (lastLength || !separator.test("")) {
					output.push("");
				}
			} else {
				output.push(str.slice(lastLastIndex));
			}

			return output.length > limit ? output.slice(0, limit) : output;
		}
		
		if ('lol'.split(/(o)/).length !== 3) {
			return capturingSplit;
		} else {
			return String.prototype.split;
		}
	})();

	/* BEGIN Helpers */
	function noop() {}
	var toStr = Object.prototype.toString;
	
	var escapeCompiledRegex;
	function escape_regex(text) {
		// thank you Simon Willison
		if (!escapeCompiledRegex) {
			var specials = [
				'/', '.', '*', '+', '?', '|',
				'(', ')', '[', ']', '{', '}', '\\'
			];
			escapeCompiledRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
		}
		
		return text.replace(escapeCompiledRegex, '\\$1');
	}
	
	var newlineCompiledRegex = /^\r?\n$/;
	function is_newline(token) {
		return token.match(newlineCompiledRegex);
	}
	
	function is_whitespace(token) {
		return token.match(/^\s*$/);
	}
	
	function is_function(a) {
		return a && typeof a === 'function';
	}
	
	function is_object(a) {
		return a && typeof a === 'object';
	}

	function is_array(a) {
		return toStr.call(a) === '[object Array]';
	}

	// Checks whether a value is truthy or false or 0
	function is_kinda_truthy(bool) {
		return bool === false || bool === 0 || bool;
	}

	var escapeHTML = (function() {
		var compiledRegex = /[&<>'"]/g,
			MAP = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			};

		function remap(c) {
			return MAP[c];
		}
		
		return function(s) {
			return s.replace(compiledRegex, remap);
		}
	})();

	var MustacheError = function(message, metrics) {
		var str = '';

		this.prototype = Error.prototype;
		this.name = 'MustacheError';
		
		if (metrics) {
			str = '(' + metrics.line + ',' + metrics.character + '): ';
			if (metrics.partial) {
				str = '[' + metrics.partial + ']' + str;
			}
		}
		
		this.message = str + message;
		if (metrics) {
			this.line = metrics.line;
			this.character = metrics.character;
			this.partial = metrics.partial;
		}
	};
	
	/* END Helpers */

	/* BEGIN Compiler */
		
	function make_standalone() {
		return { is_standalone: true, tags: 0 };
	}
		
	function compile(state, noReturn) {
		var n, c, token;
		
		for (n = state.tokens.length;state.cursor<n && !state.terminated;++state.cursor) {
			token = state.tokens[state.cursor];
			if (token==='' || token===undefined) {
				continue;
			}
			
			if (state.standalone.tags > 1) {
				state.standalone.is_standalone = false;
			}
			
			if (state.metrics.character === 1 && state.leadingWhitespace !== '') {
				var leadingWhitespace = state.leadingWhitespace;
				state.assemble(function(/*context*/) { return leadingWhitespace; });
			}
		
			if (token.indexOf(state.openTag)===0) {
				c = token.charAt(state.openTag.length);
				state.standalone.tags++;
				if (state.parser[c]) {
					state.parser[c](state, token, c);
				} else {
					state.parser.def(state, token);
				}
			} else {
				state.parser.text(state, token);
			}
			
			if (is_newline(token)) {
				state.metrics.character = 1;
				state.metrics.line++;
				state.standalone = make_standalone();
			} else {
				state.metrics.character+=token.length;
			}
		}
		
		if (state.standalone.tags === 0) {
			state.standalone.is_standalone = false;
		}
		
		if (state.parser === scan_section_parser && !state.terminated) {
			throw new MustacheError('Closing section tag "' + state.section.variable + '" expected.', state.metrics);
		}
		
		if (!noReturn) {
			return function(context) {
				var res = '', i, fn;
				for (i=0;fn=state.code[i++];) {
					res += fn(context) || '';
				}
				return res;
			};
		}
	}
	
	var default_tokenizer = /(\r?\n)|({{![\s\S]*?!}})|({{[#\^\/&>]?\s*[^!{=]\S*?\s*}})|({{{\s*\S*?\s*}}})|({{=\s*\S*?\s*\S*?\s*=}})/;
	function create_compiler_state(template, partials, openTag, closeTag) {
		openTag = openTag || '{{';
		closeTag = closeTag || '}}';

		var tokenizer;
		if (openTag === '{{' && closeTag === '}}') {
			tokenizer = default_tokenizer;
		} else {
			var rOTag = escape_regex(openTag),
				rETag = escape_regex(closeTag);

			var parts = [
				'(\\r?\\n)' // new lines
				, '(' + rOTag + '![\\s\\S]*?!' + rETag + ')' // comments
				, '(' + rOTag + '[#\^\/&>]?\\s*[^!{=]\\S*?\\s*' + rETag + ')' // all other tags
				, '(' + rOTag + '{\\s*\\S*?\\s*}' + rETag + ')' // { unescape token
				, '(' + rOTag + '=\\s*\\S*?\\s*\\S*?=\\s*' + rETag + ')' // set delimiter change
			];
			tokenizer = new RegExp(parts.join('|'));
		}

		var code = [], state =  {
			metrics: {
				partial: null
				, line: 1
				, character: 1
			}
			, template: template || ''
			, partials: partials || {}
			, openTag: openTag
			, closeTag: closeTag
			, parser: default_parser
			, standalone: make_standalone()
			, leadingWhitespace: ''
			, code: code
			, assemble: function(f) {
				code.push(f);
			}
		};
		
		// tokenize and initialize a cursor
		state.tokens = splitFunc.call(state.template, tokenizer);
		state.cursor = 0;
		
		return state;
	}
	
	/* END Compiler */
	
	/* BEGIN Run Time Helpers */
	
	function coerce(name, context) {
		var value = context[name];
		
		if (is_kinda_truthy(value)) {
			if (is_function(value)) {
				return value.apply(context);
			} else {
				return value;
			}
		}
	}
	
	function find_in_stack(name, context_stack, breakLoops) {
		var value = undefined, 
			n = context_stack.length, i = n, j;
		
		do {
			value = coerce(name, context_stack[--i]);
			if (value!==undefined) { 
				if (!!breakLoops && i > 0 && (is_object(value) || is_array(value))) {
					// if the value has the potential of creating a stack-entry, 
					// do a ref comparison on the remaining stack entries
					for (j = i + 1; j < n; ++j) {
						if (context_stack[j] === value) {
							value = undefined;
							break;
						}
					}
					
					if (value === undefined) {
						continue;
					} else {
						break;
					}
				} else {
					break;
				}
			}
		} while (i !== 0);
		
		return value;
	}
	
	/*
	find `name` in current `context`. That is find me a value
	from the view object
	*/
	function find(name, context, breakLoops) {
		if (name === '.') {
			return coerce('.', { '.' : context[context.length-1] });
		}
		
		var name_components = name.indexOf('.') === -1 ? [name] : name.split('.'),
			i = 1, n = name_components.length,
			value = find_in_stack(name_components[0], context, breakLoops);
			
		while (value && i<n) {
			value = coerce(name_components[i], value);
			i++;
		}
		
		if (i!==n && !value) {
			value = undefined;
		}
		
		return value;
	}
	
	/* END Run Time Helpers */

	function text(state, token) {
		if (state.metrics.character===1 && is_whitespace(token) && !is_newline(token)) {
			// if at the start of a line and the token is whitespace
			// hold on to the token for later reference
			var standalone = state.standalone;
			standalone.token = token;
			state.assemble(function(/*context*/) {
				if (!standalone.is_standalone) {
					return token;
				}
			});
		} else if (!state.standalone.is_standalone || !is_newline(token) || state.standalone.tags !== 1) {
			// all other cases switch over to non-standalone mode
			state.standalone.is_standalone = false;
			state.assemble(function(/*context*/) { return token; });
		}
	}

	function interpolate(state, token, mark) {
		var escape, prefix, postfix;
		if (mark==='{') {
			escape = prefix = postfix = true;
		} else if (mark==='&') {
			escape = prefix = true;
		}
		
		// interpolation tags are always non-standalone
		state.standalone.is_standalone = false;
		
		state.assemble((function(variable, escape) { return function(context) {
			var value = find(variable, context);
			
			if (value!==undefined) {
				if (!escape) {
					value = escapeHTML('' + value);
				}
				
				return '' + value;
			}
		};})(get_variable_name(state, token, prefix, postfix), escape));
	}
	
	function partial(state, token) {
		var variable = get_variable_name(state, token, true),
			template, program;
		
		if (!state.partials[variable]) {
			state.partials[variable] = noop;
		}
		
		// if the partial has not been compiled yet, do so now
		if (!is_function(state.partials[variable])) {
			template = state.partials[variable]; // remember what the partial was
			state.partials[variable] = noop; // avoid infinite recursion
			
			var new_state = create_compiler_state(
				template
				, state.partials
			);
			new_state.leadingWhitespace += state.leadingWhitespace;
			if (state.standalone.is_standalone) {
				new_state.leadingWhitespace += state.standalone.token || '';
			}
			new_state.metrics.partial = variable;
			state.partials[variable] = compile(new_state);
		}
		
		state.assemble(function(context) { return state.partials[variable](context); });
	}
	
	function section(state) {
		var s = state.section, template = s.template_buffer,
			program, 
			new_state = create_compiler_state(template, state.partials, state.openTag, state.closeTag);
		
		new_state.standalone.is_standalone = s.standalone.is_standalone;
		new_state.metrics = s.metrics;
		program = compile(new_state);
		
		if (s.inverted) {
			state.assemble((function(program, variable){ return function(context) {
				var value = find(variable, context);
				if (!value || is_array(value) && value.length === 0) { // false or empty list, render it
					return program(context);
				}
			};})(program, s.variable));
		} else {
			state.assemble((function(program, variable, template, partials){ return function(context) {
				var value = find(variable, context, true), frag = '', 
					cLen, i, n, $$ = { $: { index: 0, count: 1, first: 0, last: 0 } };
				if (is_array(value)) { // Enumerable, Let's loop!
					context.push(value);
					context.push($$);
					context.push(null);
					cLen = context.length - 1;
					for (i=0, n=value.length; i<n; ++i) {
						context[cLen] = value[i];
						$$.$.index = i;
						$$.$.count = i+1;
						$$.$.first = i===0;
						$$.$.last = i===n-1;
						frag += program(context) || '';
					}
					context.pop();
					context.pop();
					context.pop();
				} else if (is_object(value)) { // Object, Use it as subcontext!
					context.push(value);
					frag += program(context) || '';
					context.pop();
				} else if (is_function(value)) { // higher order section
					// note that HOS triggers a compilation on the hosFragment.
					// this is slow (in relation to a fully compiled template) 
					// since it invokes a call to the parser
					frag += value.call(context[context.length-1], template, function(hosFragment) {
						new_state = create_compiler_state(hosFragment, partials);
						new_state.metrics.partial = 'HOS@@anon';
						return compile(new_state)(context);
					});
				} else if (value) { // truthy
					frag += program(context) || '';
				}
				return frag;
			};})(program, s.variable, template, state.partials));
		}
	}

	/* BEGIN Parser */
	
	var default_parser = {
		'!': noop,
		'#': begin_section,
		'^': begin_section,
		'/': function(state, token) { throw new MustacheError('Unbalanced End Section tag "' + token + '".', state.metrics); },
		'&': interpolate,
		'{': interpolate,
		'>': partial,
		'=': change_delimiter,
		def: interpolate,
		text: text
	};
	
	var scan_section_parser = {
		'!': noop,
		'#': begin_section,
		'^': begin_section,
		'/': end_section,
		'&': buffer_section,
		'{': buffer_section,
		'>': buffer_section,
		'=': change_delimiter,
		def: buffer_section,
		text: buffer_section_text
	};
		
	function get_variable_name(state, token, prefix, postfix) {
		var fragment = token.substring(
			state.openTag.length + (prefix ? 1 : 0)
			, token.length - state.closeTag.length - (postfix ? 1 : 0)
		);
		
		if (String.prototype.trim) {
			fragment = fragment.trim();
		} else {
			fragment = fragment.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
		
		if (fragment.indexOf(' ')!==-1) {
			throw new MustacheError('Malformed variable name "' + fragment + '".', state.metrics);
		}
		
		return fragment;
	}
	
	var changeDelimiterRegex = /=\s*(\S*?)\s*(\S*?)\s*=/;
	function change_delimiter(state, token) {
		var matches = token
			.substring(state.openTag.length, token.length - state.closeTag.length)
			.match(changeDelimiterRegex);

		if ((matches || []).length!==3) {
			throw new MustacheError('Malformed change delimiter token "' + token + '".', state.metrics);
		}
		
		var new_state = create_compiler_state(
			state.tokens.slice(state.cursor+1).join('')
			, state.partials
			, matches[1]
			, matches[2]);
		new_state.code = state.code;
		new_state.assemble = state.assemble;
		new_state.parser = state.parser;
		new_state.metrics.line = state.metrics.line;
		new_state.metrics.character = state.metrics.character + token.length;
		new_state.metrics.partial = state.metrics.partial;
		new_state.section = state.section;
		new_state.standalone = state.standalone;
		if (new_state.section) {
			new_state.section.template_buffer += token;
		}
		
		state.terminated = true; // finish off this level
		
		compile(new_state, true);
	}
	
	function push_section_token(state, token, unconditional) {
		if (state.section.lookahead_token || state.section.lookahead_token === '') {
			state.section.template_buffer += state.section.lookahead_token;
			state.section.lookahead_token = undefined;
		}
		
		if (unconditional) {
			state.section.template_buffer += token;
		} else {
			state.section.lookahead_token = token;
		}
	}
	
	function begin_section(state, token, mark) {
		var inverted = mark === '^', 
			variable = get_variable_name(state, token, true);
		
		if (state.parser===default_parser) {
			state.parser = scan_section_parser;
			state.section = {
				variable: variable
				, template_buffer: ''
				, lookahead_token: undefined
				, inverted: inverted
				, child_sections: []
				, metrics: {
					partial: state.metrics.partial
					, line: state.metrics.line
					, character: state.metrics.character + token.length
				}
				, standalone: state.standalone
			};
		} else {
			state.section.child_sections.push(variable);
			push_section_token(state, token, true);
		}
	}
	
	function buffer_section(state, token) {
		push_section_token(state, token, true);
	}
	
	function buffer_section_text(state, token) {
		if (state.section.template_buffer === '' && is_newline(token) && state.standalone.is_standalone) {
			// if the first token being added to the section is a newline character,
			// and the line is determined to be standalone, then the newline is ignored
			token = '';
		} else if (
			(state.metrics.character!==1 || !is_whitespace(token)) && (
			!state.standalone.is_standalone || !is_newline(token) || state.standalone.tags !== 1))
		{
			// all other cases switch over to non-standalone mode
			state.standalone.is_standalone = false;
		}

		push_section_token(state, token, false);
	}
	
	function end_section(state, token) {
		var variable = get_variable_name(state, token, true);
		
		if (state.section.child_sections.length > 0) {
			var child_section = state.section.child_sections[state.section.child_sections.length-1];
			if (child_section === variable) {
				state.section.child_sections.pop();
				push_section_token(state, token, true);
			} else {
				throw new MustacheError('Unexpected section end tag "' + variable + '", expected "' + child_section + '".', state.metrics);
			}
		} else if (state.section.variable===variable) {
			// look-ahead to see if another token on this line flips the standalone flag
			// the very last token to be inserted into the section is conditional on the line being standalone or not
			if (state.section.lookahead_token && 
				is_whitespace(state.section.lookahead_token) && 
				!is_newline(state.section.lookahead_token) && 
				state.standalone.is_standalone)
			{
				var n, c, token;
				for (c = state.cursor + 1, n = state.tokens.length;c<n;++c) {
					token = state.tokens[c];
					if (token==='' || token===undefined) {
						continue;
					}
					
					if (is_newline(token)) {
						break;
					}
					
					if (!is_whitespace(token)) {
						state.standalone.is_standalone = false;
						break;
					}
				}
				
				if (!state.standalone.is_standalone) {
					push_section_token(state, '', true);
				}
			} else {
				push_section_token(state, '', true);
			}
			
			section(state);
			delete state.section;
			state.parser = default_parser;
		} else {
			throw new MustacheError('Unexpected section end tag "' + variable + '", expected "' + state.section.variable + '".', state.metrics);
		}
	}
		
	/* END Parser */
	
	return({
		name: "mustache.js",
		version: "0.6.2-vcs",

		/* 
		Turns a template into a JS function
		*/
		compile: function(template, partials) {
			var p = {}, key, program;
			if (partials) {
				for (key in partials) {
					if (partials.hasOwnProperty(key)) {
						p[key] = partials[key];
					}
				}
			}
		
			program = compile(create_compiler_state(template, p));
			return function(view) {
				return program([view || {}]);
			};
		},
		
		/*
		Renders a template given a specific set of data
		*/
		render: function(template, view, partials) {
			return Mustache.compile(template, partials)(view);
		},
		
		/* alias to render for backwards compatibility */
		to_html: function() { return Mustache.render.apply(null, arguments); },
		
		format: function(template/*, args */) {
			var view = Array.prototype.slice.call(arguments);
			view.shift();
			
			return Mustache.compile(template)(view);
		},

		Error: MustacheError
	});
})();
