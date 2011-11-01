/* innerShiv: makes HTML5shim work on innerHTML & jQuery
 * http://jdbartlett.github.com/innershiv
 *
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details.
 */
window.innerShiv = (function () {
	var div;
	var doc = document;
	var needsShiv;
	
	// Used to idiot-proof self-closing tags
	function fcloseTag(all, front, tag) {
		return (/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i).test(tag) ? all : front + '></' + tag + '>';
	}
	
	return function (
		html, /* string */
		returnFrag /* optional false bool */
	) {
		if (!div) {
			div = doc.createElement('div');
			
			// needsShiv if can't use HTML5 elements with innerHTML outside the DOM
			div.innerHTML = '<nav></nav>';
			needsShiv = div.childNodes.length !== 1;
			
			if (needsShiv) {
				// MSIE allows you to create elements in the context of a document
				// fragment. Jon Neal first discovered this trick and used it in his
				// own shimprove: http://www.iecss.com/shimprove/
				var shimmedFrag = doc.createDocumentFragment();
				// Array of elements that are new in HTML5
				'abbr article aside audio canvas datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video'.replace(/\w+/g, function(tag) {
					shimmedFrag.createElement(tag);
				});
				
				shimmedFrag.appendChild(div);
			}
		}
		
		html = html
			// Trim whitespace to avoid unexpected text nodes in return data:
			.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
			// Strip any scripts:
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			// Fix misuses of self-closing tags:
			.replace(/(<([\w:]+)[^>]*?)\/>/g, fcloseTag)
			;
		
		// Fix for using innerHTML in a table
		var tabled;
		if (tabled = html.match(/^<(tbody|tr|td|th|col|colgroup|thead|tfoot)[\s\/>]/i)) {
			div.innerHTML = '<table>' + html + '</table>';
		} else {
			div.innerHTML = html;
		}
		
		// Avoid returning the tbody or tr when fixing for table use
		var scope;
		if (tabled) {
			scope = div.getElementsByTagName(tabled[1])[0].parentNode;
		} else {
			scope = div;
		}
		
		// If not in jQuery return mode, return child nodes array
		if (returnFrag === false) {
			return scope.childNodes;
		}
		
		// ...otherwise, build a fragment to return
		var returnedFrag = doc.createDocumentFragment();
		var j = scope.childNodes.length;
		while (j--) {
			returnedFrag.appendChild(scope.firstChild);
		}
		
		return returnedFrag;
	};
}());
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
	
	function is_newline(token) {
		return token.match(/\r?\n/);
	}
	
	function is_function(a) {
		return a && typeof a === 'function';
	}
	
	function is_object(a) {
		return a && typeof a === 'object';
	}

	function is_array(a) {
		return Object.prototype.toString.call(a) === '[object Array]';
	}

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
		
	function compile(state, noReturn) {
		var n, c, token;
		
		for (n = state.tokens.length;state.cursor<n && !state.terminated;++state.cursor) {
			token = state.tokens[state.cursor];
			if (token==='' || token===undefined) {
				continue;
			}
			
			if (token.indexOf(state.openTag)===0) {
				c = token.charAt(state.openTag.length);
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
			} else {
				state.metrics.character+=token.length;
			}
		}
		
		if (state.parser === scan_section_parser && !state.terminated) {
			throw new MustacheError('Closing section tag "' + state.section.variable + '" expected.', state.metrics);
		}
		
		if (!noReturn) {
			var codeList = state.code;
			if (codeList.length === 0) {
				return noop;
			} else if (codeList.length === 1) {
				return codeList[0];
			} else {
				return function(context, send_func) {
					for (var i=0,n=codeList.length;i<n;++i) {
						codeList[i](context, send_func);
					}
				}
			}
		}
	}
	
	var default_tokenizer = /(\r?\n)|({{![\s\S]*?!}})|({{[#\^\/&>]?\s*[^!{=]\S*?\s*}})|({{{\s*\S*?\s*}}})|({{=\S*?\s*\S*?=}})/;
	function create_compiler_state(template, partials, openTag, closeTag) {
		openTag = openTag || '{{';
		closeTag = closeTag || '}}';

		var tokenizier;		
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
				, '(' + rOTag + '=\\S*?\\s*\\S*?=' + rETag + ')' // set delimiter change
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
			, pragmas: {}
			, code: code
			, send_code_func: function(f) {
				code.push(f);
			}
		};
		
		pragmas(state); // use pragmas to control parsing behaviour
		
		// tokenize and initialize a cursor
		state.tokens = splitFunc.call(state.template, tokenizer);
		state.cursor = 0;
		
		return state;
	}
	
	var pragma_directives = {
		'IMPLICIT-ITERATOR': function(state, options) {
			state.pragmas['IMPLICIT-ITERATOR'] = {iterator: ((options || {iterator:undefined}).iterator) || '.'};
		}
	};
		
	function pragmas(state) {
		/* includes tag */
		function includes(needle, haystack) {
			return haystack.indexOf('{{' + needle) !== -1;
		}
		
		// no pragmas, easy escape
		if(!includes("%", state.template)) {
			return state.template;
		}

		state.template = state.template.replace(/{{%([\w-]+)(\s*)(.*?(?=}}))}}/g, function(match, pragma, space, suffix) {
			var options = undefined,
				optionPairs, scratch,
				i, n;
			
			if (suffix.length>0) {
				optionPairs = suffix.split(',');
				
				options = {};
				for (i=0, n=optionPairs.length; i<n; ++i) {
					scratch = optionPairs[i].split('=');
					if (scratch.length !== 2) {
						throw new MustacheError('Malformed pragma option "' + optionPairs[i] + '".');
					}
					options[scratch[0]] = scratch[1];
				}
			}
			
			if (is_function(pragma_directives[pragma])) {
				pragma_directives[pragma](state, options);
			} else {
				throw new MustacheError('This implementation of mustache does not implement the "' + pragma + '" pragma.', undefined);
			}

			return ''; // blank out all pragmas
		});
	}
	
	/* END Compiler */
	
	/* BEGIN Run Time Helpers */
	
	/*
	find `name` in current `context`. That is find me a value
	from the view object
	*/
	function find(name, context) {
		// Checks whether a value is truthy or false or 0
		function is_kinda_truthy(bool) {
			return bool === false || bool === 0 || bool;
		}
		
		var value;
		if (is_kinda_truthy(context[name])) {
			value = context[name];
		}

		if (is_function(value)) {
			return value.apply(context);
		}
		
		return value;
	}
	
	function find_in_stack(name, context_stack) {
		var value;
				
		value = find(name, context_stack[context_stack.length-1]);
		if (value!==undefined) { return value; }
		
		if (context_stack.length>1) {
			value = find(name, context_stack[0]);
			if (value!==undefined) { return value; }
		}
		
		return undefined;
	}
	
	/* END Run Time Helpers */

	function text(state, token) {
		state.send_code_func(function(context, send_func) { send_func(token); });	
	}
	
	function interpolate(state, token, mark) {
		function escapeHTML(str) {
			return str.replace(/&/g,'&amp;')
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;');
		}
		
		var escape, prefix, postfix;
		if (mark==='{') {
			escape = prefix = postfix = true;
		} else if (mark==='&') {
			escape = prefix = true;
		}
		
		var variable = get_variable_name(state, token, prefix, postfix);
		state.send_code_func((function(variable, escape) { return function(context, send_func) {
			var value = find_in_stack(variable, context);
			if (value!==undefined) {
				if (!escape) {
					value = escapeHTML('' + value);
				}
				
				send_func('' + value);
			}
		};})(variable, escape));
	}
	
	function partial(state, token) {
		var variable = get_variable_name(state, token, true),
			template, program;
		
		if (!state.partials[variable]) {
			throw new MustacheError('Unknown partial "' + variable + '".', state.metrics);
		}
		
		if (!is_function(state.partials[variable])) {
			// if the partial has not been compiled yet, do so now
			
			template = state.partials[variable]; // remember what the partial was
			state.partials[variable] = noop; // avoid infinite recursion
			
			var new_state = create_compiler_state(
				template
				, state.partials				
			);
			new_state.metrics.partial = variable;
			// TODO: Determine if partials should inherit pragma state from parent
			program = compile(new_state);
			
			state.partials[variable] = function(context, send_func) {
				var value = find_in_stack(variable, context);

				if (value) {
					// TODO: According to mustache-spec, partials do not act as implicit sections
					// this behaviour was carried over from janl's mustache and should either
					// be discarded or replaced with a pragma
					context.push(value);
				}

				program(context, send_func);
				
				if (value) {
					// TODO: See above
					context.pop();
				}
			};
		}
		
		state.send_code_func(function(context, send_func) { state.partials[variable](context, send_func); });
	}
	
	function section(state) {
		// by @langalex, support for arrays of strings
		function create_context(_context) {
			if(is_object(_context)) {
				return _context;
			} else {
				var ctx = {}, 
					iterator = (state.pragmas['IMPLICIT-ITERATOR'] || {iterator: '.'}).iterator;
				
				ctx[iterator] = _context;
				
				return ctx;
			}
		}
		
		var s = state.section, template = s.template_buffer.join(''),
			program, 
			new_state = create_compiler_state(template, state.partials, state.openTag, state.closeTag);
		
		new_state.metrics = s.metrics;
		program = compile(new_state);
		
		if (s.inverted) {
			state.send_code_func((function(program, variable){ return function(context, send_func) {
				var value = find_in_stack(variable, context);
				if (!value || is_array(value) && value.length === 0) { // false or empty list, render it
					program(context, send_func);
				}
			};})(program, s.variable));
		} else {
			state.send_code_func((function(program, variable, template, partials){ return function(context, send_func) {
				var value = find_in_stack(variable, context);			
				if (is_array(value)) { // Enumerable, Let's loop!
					for (var i=0, n=value.length; i<n; ++i) {
						context.push(create_context(value[i]));
						program(context, send_func);
						context.pop();
					}
				} else if (is_object(value)) { // Object, Use it as subcontext!
					context.push(value);
					program(context, send_func);
					context.pop();
				} else if (is_function(value)) { // higher order section
					// note that HOS triggers a compilation on the hosFragment.
					// this is slow (in relation to a fully compiled template) 
					// since it invokes a call to the parser
					send_func(value.call(context[context.length-1], template, function(hosFragment) {
						var o = [],
							user_send_func = function(str) { o.push(str); };
					
						var new_state = create_compiler_state(hosFragment, partials);
						new_state.metrics.partial = 'HOS@@anon';
						compile(new_state)(context, user_send_func);
						
						return o.join('');
					}));
				} else if (value) { // truthy
					program(context, send_func);
				}
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
		text: buffer_section
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
	
	function change_delimiter(state, token) {
		var matches = token.match(new RegExp(escape_regex(state.openTag) + '=(\\S*?)\\s*(\\S*?)=' + escape_regex(state.closeTag)));

		if ((matches || []).length!==3) {
			throw new MustacheError('Malformed change delimiter token "' + token + '".', state.metrics);
		}
		
		var new_state = create_compiler_state(
			state.tokens.slice(state.cursor+1).join('')
			, state.partials
			, matches[1]
			, matches[2]);
		new_state.code = state.code;
		new_state.send_code_func = state.send_code_func;
		new_state.parser = state.parser;
		new_state.metrics.line = state.metrics.line;
		new_state.metrics.character = state.metrics.character + token.length;
		new_state.metrics.partial = state.metrics.partial;
		new_state.section = state.section;
		new_state.pragmas = state.pragmas;
		if (new_state.section) {
			new_state.section.template_buffer.push(token);
		}
		
		state.terminated = true; // finish off this level
		
		compile(new_state, true);
	}
	
	function begin_section(state, token, mark) {
		var inverted = mark === '^', 
			variable = get_variable_name(state, token, true);
		
		if (state.parser===default_parser) {
			state.parser = scan_section_parser;
			state.section = {
				variable: variable
				, template_buffer: []
				, inverted: inverted
				, child_sections: []
				, metrics: {
					partial: state.metrics.partial
					, line: state.metrics.line
					, character: state.metrics.character + token.length
				}
			};
		} else {
			state.section.child_sections.push(variable);
			state.section.template_buffer.push(token);
		}
	}
	
	function buffer_section(state, token) {
		state.section.template_buffer.push(token);
	}
	
	function end_section(state, token) {
		var variable = get_variable_name(state, token, true);
		
		if (state.section.child_sections.length > 0) {
			var child_section = state.section.child_sections[state.section.child_sections.length-1];
			if (child_section === variable) {
				state.section.child_sections.pop();			
				state.section.template_buffer.push(token);
			} else {
				throw new MustacheError('Unexpected section end tag "' + variable + '", expected "' + child_section + '".', state.metrics);
			}
		} else if (state.section.variable===variable) {
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
		version: "0.5.0-vcs",

		/*
		Turns a template and view into HTML
		*/
		to_html: function(template, view, partials, send_func) {
			var program = Mustache.compile(template, partials),
				result = program(view, send_func);
			
			if (!send_func) {
				return result;
			}
		},
		
		compile: function(template, partials) {
			var p = {};
			if (partials) {
				for (var key in partials) {
					if (partials.hasOwnProperty(key)) {
						p[key] = partials[key];
					}
				}
			}
		
			var program = compile(create_compiler_state(template, p));
			return function(view, send_func) {
				var o = [],
					user_send_func = send_func || function(str) {
						o.push(str);
					};
					
				program([view || {}], user_send_func);
				
				if (!send_func) {
					return o.join('');
				}
			}
		},
		
		Error: MustacheError
	});
})();

/**
  @file
  @author Sahab Yazdani <sahab DOT yazdani AT saliences DOT com>
  @version 2011.03.16
  
  @section LICENSE
  
  Copyright (c) 2011 Sahab Yazdani

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

  @section DESCRIPTION
  
  Fast string measurement functions.
 */
(function(undefined) {
	var borrowStyles = 'fontFamily fontSize fontStyle fontVariant fontWeight'.split(' '),
		measurementDiv = document.createElement('div');
		
	measurementDiv.style.top = '0px';
	measurementDiv.style.left = '0px';
	measurementDiv.style.visibility = 'hidden';
	measurementDiv.style.position = 'absolute';
	
	function attachMeasurementDiv(styles) {
		var styles_t;
		
		styles = styles || document.body;
		styles_t = typeof styles;
		
		if (styles_t === 'string') {
			measurementDiv.style.font = styles;
		} else if (styles_t === 'object') {
			if (styles.nodeType) {
				if (styles.currentStyle) {
					// for IE
					styles = styles.currentStyle;
				} else {
					// for Standards Complaint browsers
					styles = document.defaultView.getComputedStyle(styles, null);
				}
			}
			
			copyStyles(styles);
		}
		
		document.body.appendChild(measurementDiv);
	}
	
	function detachMeasurementDiv() {
		var i, n;
		
		document.body.removeChild(measurementDiv);
		
		measurementDiv.style.font = 'inherit';
		for (i = 0, n = borrowStyles.length; i<n; ++i) {
			measurementDiv.style[borrowStyles[i]] = '';
		}
	}
	
	function copyStyles(styles) {
		var i, n, key;
		
		for (i = 0, n = borrowStyles.length; i<n; ++i) {
			key = borrowStyles[i];
			
			measurementDiv.style[key] = styles[key];
		}
	}
	
	function internalMeasureString(str) {
		function escapeHtml(str) {
			return ('' + str)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}
		
		measurementDiv.innerHTML = escapeHtml(str);
		bounds = measurementDiv.getBoundingClientRect();
		
		return {
			width: 
				bounds.width ? bounds.width : (bounds.right - bounds.left)
			, height: 
				bounds.height ? bounds.height : (bounds.bottom - bounds.top)
		};
	}
	
	/**
	  Returns the dimensions of a given string using a given set of styles.
	  
	  @param style An object literal which contains one or more of the
	    following properties:
		
		  * fontFamily 
		  * fontSize 
		  * fontStyle 
		  * fontVariant 
		  * fontWeight
		
		These properties have their usual CSS meanings.
		
		OR 
		
		a string representing the short-form 'font' CSS property.
		
		Note: The object literal can be the style/currentStyle property of
		a DOM element.
	  @param element A DOM element to borrow the font styles from. The styles
	    are taken from the computed style of the DOM element.
	  @remark Only one of style or element can be specified.
	  
	  @returns The width/height of the measured string in the following object
	    literal: {width: [width], height: [height]). 
	*/
	String.prototype.measure = function(style) {
		var result;
		
		attachMeasurementDiv(style);
		result = internalMeasureString(this);
		detachMeasurementDiv();
	
		return result;
	}

	/**
	  Measures a list of strings and returns all of their dimensions.
	  
	  This method is significantly faster than ''.measure if a lot of
	  strings have to be measured using the same style.

	  @param strs An array of strings to measure
	  @param style An object literal which contains one or more of the
	    following properties:
		
		  * fontFamily 
		  * fontSize 
		  * fontStyle 
		  * fontVariant 
		  * fontWeight
		
		These properties have their usual CSS meanings.
		
		OR 
		
		a string representing the short-form 'font' CSS property.
		
		Note: The object literal can be the style/currentStyle property of
		a DOM element.
	  @param element A DOM element to borrow the font styles from. The styles
	    are taken from the computed style of the DOM element.
	  @remark Only one of style or element can be specified.
	  
	  @returns An array with the width/height dimensions of the input strings
	    in the same order as the strs parameter.
	*/
	String.bulkMeasure = function(strs, style) {
		var i, n,
			result = [];
		
		attachMeasurementDiv(style);
		
		for (i=0, n = strs.length; i<n; ++i) {
			result.push(internalMeasureString(strs[i]));
		}
		
		detachMeasurementDiv();
		
		return result;
	}
	
	/**
	  Crops the given string so that the pixel width of the resultant
	  string is not longer than the target width. If the string is longer,
          then the string is cropped and the ellipsis glyph is added to the end.
	  
	  @param targetWidth The target pixel width of the resultant string.
	    The output string is gauranteed to be shorter than this width.
	  @param style An object literal which contains one or more of the
	    following properties:
		
		  * fontFamily 
		  * fontSize 
		  * fontStyle 
		  * fontVariant 
		  * fontWeight
		
		These properties have their usual CSS meanings.
		
		OR 
		
		a string representing the short-form 'font' CSS property.
		
		Note: The object literal can be the style/currentStyle property of
		a DOM element.
	  @param element A DOM element to borrow the font styles from. The styles
	    are taken from the computed style of the DOM element.
	  @remark Only one of style or element can be specified.
	  
	  @returns If the width of the input string is shorter than targetWidth
	    the original string is returned. If the width of the input string is 
		longer, a cropped version of the string is returned with the
		ellipsis glyph (...) appended to the end. If the cropped string will 
		only be the ellipsis glyph (...), then the empty string is returned.
	*/
	String.prototype.crop = function(targetWidth, style) { 
		var start, end,
			bisection, partial = this,
			width;
		
		attachMeasurementDiv(style);
		
		width = internalMeasureString(partial).width;
		if (width > targetWidth) {
			start = 0;
			end = this.length;
			
			do {
				bisection = start + Math.ceil((end - start) / 2);
				partial = this.substring(0, bisection) + '...';
				width = internalMeasureString(partial).width;

				if (width > targetWidth) {
					end = bisection;
				} else {
					start = bisection;
				}
			} while (end - start > 1);
		}
		
		// if the result will effectively be empty, 
		// then return the empty string
		if (start === 0 && end === 1 && width > targetWidth) {
			partial = '';
		}
		
		detachMeasurementDiv();
		
		return partial;
	}
})();
/* The MIT License

Copyright (c) 2011 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function ($, undefined) {
    $.extend(true, window, { Vastardis: { UI: { Components: {}}} });
    var vsc = Vastardis.UI.Components; // namespace alias

    // constants
    var DOMCOMPONENTMETA = 'vsc.component',
        DEBOUNCE_TIMEOUT = 50; // in milliseconds

    var $window = $(window); // cache $window, reused fairly frequently

    // make sure that IE can render all of the custom tags we have
    'component'.replace(/\w+/g, function (n) { document.createElement(n); });

    var Component = function (options, defaultOptions) {
        ///<summary>
        /// Constructs an instance of Component, configuring it based on the passed in <paramref name="options">options</paramref> parameter.
        ///  * The case where <paramref name="defaultOptions">defaultOptions</paramref> is supplied is reserved for use
        ///    by Component implementors and doesn't make much sense when called from code.
        ///  * The case where both <paramref name="options">options</paramref> and <paramref name="defaultOptions">defaultOptions</paramref>
        ///    are undefined is reserved for use by the Component Library infrastructure. Calling the constructor in code
        ///    in that fashion will result in a Component that is not initialized properly.
        ///</summary>
        ///<param name="options">The configuration points for this component instance.</param>
        ///<param name="defaultOptions">The default values of the configuration points.</param>
        if (arguments.length === 0) { return; }

        this._options = $.extend({}, Component.defaultOptions, defaultOptions, options);

        this._parent = null;
        this._children = [];
        this._autogenChildren = []; // the list of children that have private variables
        this._autogenUnbinds = []; // the list of events to auto-unbind
        this._autogenRefs = []; // the list of DOM elements with references
        this._source = null;
        this._id = this._options.id;
        this._cssClassOverrides = this._options.cssClass;
        this._tabIndex = this._options.tabIndex;
        this._isAttached = false;
        this._isValid = true;

        this._listenToChildrenValidity = true;

        this._dataSource = null;

        this._hookedResize = false;
        this.onWindowResize$proxy = $.proxy(this.onWindowResize, this);
        this._onResize$debounced = $.debounce(this._onResize, DEBOUNCE_TIMEOUT, this);

        if (this._options.validates === false) {
            vsc.Component.removeValidationAPI(this);
        }
    }
    Component.instantiationSibling = $(document.createElement('div'));
    Component.defaultOptions = {
        id: ''
        , cssClass: ''
        , tabIndex: null
        ///<summary>
        /// For each Component element in the DOM, instantiates the referenced component and inserts it into the
        /// children array.
        ///</summary>
        , instantiateComponents: true
        ///<summary>
        /// Automatically creates a variable referencing DOM elements with name attributes in the DOM structure for 
        /// this component.
        ///</summary>
        , autoDOMReferences: true
        , templates: { base: '<div />' }
    };
    Component.prototype = {
        /* BEGIN ID Management */

        _setDomId: function Component$_setDomId() {
            ///<summary>
            /// Assigns a unique ID to the component's DOM element's id attribute. If the computed ID
            /// is the empty string, then the id attribute is removed from the DOM element.         
            ///</summary>
            var computedId;

            if (this.id()) {
                computedId = this.computedId();

                if (computedId !== '') {
                    this.element().attr('id', computedId);
                } else {
                    this.element().removeAttr('id');
                }
            } else {
                // if this element doesn't have an ID, then there is no sense in creating the computed ID
                // remove the id attribute all together
                this.element().removeAttr('id');
            }
        }

        , id: function Component$id(/*[newId]*/) {
            ///<summary>
            /// Getter/Setter
            /// The unique ID of the Component. Note that IDs do not necessarily have to be unique across
            /// all components, but that they do have to be unique at the current level in the Component Hierarchy.
            /// The infrastructure will use ID mangling to create a unique ID for the component across the entire
            /// hierarchy.
            ///</summary>
            ///<param name="newId">The new ID for the Component</param>
            ///<returns>
            /// If newId is undefined, returns the Component's unique ID.
            /// If newId is provided, no value is returned.
            ///</returns>
            if (arguments.length === 0) {
                return this._id;
            } else {
                this._id = arguments[0];
                this._setDomId();

                $.each(this._children, $.proxy(function (index, child) {
                    child.parent(this);
                }, this));
            }
        }
        , computedId: function Component$computedId() {
            ///<summary>
            /// The Computed ID of a component is a mangled version of the id property that is
            /// most likely unique across all components.
            ///</summary>
            ///<returns>
            /// The Computed ID.
            ///</returns>
            ///<remarks>
            /// The infrastructure does not check/guarantee uniqueness, since it is always possible for
            /// developer to create components with the same ID as children of a particular Component.
            ///</remarks>
            var idChain = [];

            if (this.id() === '') {
                return ''; // don't care about a mangled id if no id is given
            }

            for (var p = this; p && p.id; p = p.parent()) {
                if (p.id()) {
                    idChain.unshift(p.id());
                }
            }

            return idChain.join('_');
        }

        /* END ID Management */

        /* BEGIN Component Hierarchy Management */

        , _refreshParent: function Component$_refreshParent() {
            this._setDomId();

            this._hookWindowResize();

            $.each(this._children, function (index, child) {
                child._refreshParent();
            });
        }

        , parent: function Component$parent(/*[newParent]*/) {
            ///<summary>
            /// Getter/Setter
            /// The parent of a Component is the Component that provides the Naming Container.
            /// The Naming Container for a Component provides a means of generating a unique
            /// ID for the Component's DOM id attribute.
            /// Setting the parent for a Component causes the DOM ID to be recomputed.
            ///
            /// Component parents are not necessarily the same as DOM parents. That is, a Component
            /// may be a child of another component, but not be a descendant of the parent's DOM.
            ///</summary>
            ///<param name="newParent">The new parent for this component.</param>
            ///<returns>
            /// If newParent is undefined, returns the current parent Component.
            /// If newParent is defined, the return value is undefined.
            ///</returns>
            if (arguments.length === 0) {
                return this._parent;
            } else {
                if (this._parent !== arguments[0]) {
                    if (this._parent !== null) {
                        this._parent.removeChild(this);
                    }

                    this._parent = arguments[0];
                    if (this._parent !== null) {
                        this._parent.addChild(this);
                    }
                    if (!this._source) {
                        this.ensureElement();
                    }
                }

                this._refreshParent();
            }
        }
        , hasChild: function Component$hasChild(child) {
            ///<summary>
            ///Determines whether or not this component has the component referenced by child as a child component.
            ///</summary>
            ///<returns>True if the component is a child, false otherwise</returns>
            var found = false;
            $.each(this._children, function (index, c) {
                if (c === child) {
                    found = true;
                    return false;
                }
            });
            return found;
        }
        , addChild: function Component$addChild(child) {
            ///<summary>
            /// Adds component to the list of children components for this Component.
            /// This effectively reparents <paramref name="child">child</paramref>. 
            /// That is, the parent/child relationship is maintained in a bidirectional fashion.
            /// Reparenting a Component causes the DOM ID of the Component to be recomputed.
            ///</summary>
            ///<param name="child">The component to add to the list of children.</param>
            if (this.hasChild(child)) {
                return;
            }

            if (!child.valid() && this.listenToChildrenValidity()) {
                this._valid(false);
            }

            this._children.push(child);
            child.parent(this);
        }
        , removeChild: function Component$removeChild(child) {
            ///<summary>
            /// Removes a child from the list of children components maintained for this Component.
            /// This effectively reparents <paramref name="child">child</paramref> to have no ancestery. That is
            /// <paramref name="child">child</paramref> becomes orphaned.
            /// If <paramref name="child">child</paramref>is not a child of this Component, then this method
            /// is effectively a noop.
            ///</summary>
            ///<param name="component">The component to remove from the children list</param>
            var found = false;

            var invalidCount = 0;

            this._children = $.map(this._children, function (c, index) {
                if (c === child) {
                    found = true;
                    return null;
                } else {
                    if (!c.valid()) invalidCount++;
                    return c;
                }
            });

            if (found) {
                child.parent(null);

                if (invalidCount === 0 && this.listenToChildrenValidity()) {
                    this._valid(true);
                }
            }
        }

        /* END Component Hierarchy Management */

        /* BEGIN CSS Class Management */

        , _updateCssClass: function Component$_updateCssClass() {
            ///<summary>
            ///Assigns the computed CSS Class to the class attribute on the Component's DOM element.
            ///</summary>
            var computedClass = [];

            this.element().removeClass();

            if (this.cssClassPrefix() !== '') {
                computedClass.push(this.cssClassPrefix());
            }
            if (this._cssClassOverrides !== '') {
                computedClass.push(this._cssClassOverrides);
            }

            if (computedClass.length !== 0) {
                this.element().addClass(computedClass.join(' '));
            }
        }
        , cssClassPrefix: function Component$cssClassPrefix() {
            ///<summary>
            /// The CSS Class Prefix is a space delimited list of CSS Classes that defines the look for all
            /// instances of a particular component. By setting this property in a Component
            /// implementation, developers can ensure that a Component has a consistent look
            /// across all instances.
            ///
            /// This property should be treated as being immutable by instances of a component
            /// but can/should be overridden by component authors for styling purposes.
            ///</summary>
            ///<returns>
            /// Returns the a space delimited list of this Component's prefix CSS Classes.
            ///</returns>
            ///<remarks>
            ///This is an abstract method on the component base class.
            ///</remarks>
            return '';
        }
        , cssClass: function Component$cssClass(/*[cssClass]*/) {
            ///<summary>
            /// Getter/Setter
            ///
            /// The CSS Class is a space delimited list of CSS Classes that overrides the look for an instance
            /// of a particular component. By setting this property either through the options constructor
            /// parameter or via code, a Component user can assign unique traits to a particular component.
            ///
            /// The setter version of this function will immediately compute the effective CSS Class list for
            /// this component (a merge between cssClassPrefix and cssClass) and assign it to the Component
            /// DOM element.
            ///</summary>
            ///<param name="cssClass">A space delimited list of CSS classes.</param>
            ///<returns>
            /// If cssClass is undefined, returns a space delimited list of CSS classes assigned to an instance
            /// of a Component.
            /// If cssClass is defined, assigns the CSS Classes to an instance of a Component.
            ///</returns>
            ///<remarks>
            /// Note that assigning cssClass will override any existing CSS Classes on the Component DOM Element.
            ///</remarks>
            if (arguments.length === 0) {
                return this._cssClassOverrides;
            } else {
                this._cssClassOverrides = arguments[0];
                this._updateCssClass();
            }
        }

        /* END CSS Class Management */

        /* BEGIN Input Focus Management */

        , tabIndex: function Component$tabIndex(/*[tabIndex]*/) {
            ///<summary>
            /// Getter/Setter
            ///
            /// The tabIndex property for a component determines the tab order of the page based on reading order
            /// rules and quirks defined here:
            /// The tabIndex property simply adds the tabIndex attribute to the root element of the component
            ///</summary>
            ///<param name="tabIndex" type="Number" mayBeNull="true" optional="true">
            /// The new tab index for the component. If null, the tab index for the component is removed.
            /// If omitted, the current tab index is retrieved.
            ///</param>
            ///<returns type="Number">
            /// If tabIndex argument is undefined, returns the current tabIndex for the component.
            /// If tabIndex argument is null or a number, returns undefined.
            ///</returns>
            if (arguments.length === 0) {
                return this._tabIndex;
            } else {
                this._tabIndex = arguments[0];
                if (this._tabIndex || this._tabIndex === 0) {
                    this.element().attr('tabIndex', this._tabIndex);
                } else {
                    this.element().removeAttr('tabIndex');
                }
            }
        }
        , focus: function Component$focus() {
            ///<summary>
            ///Programatically assigns input focus to this component
            ///</summary>
            this.element().focus();
        }
        , blur: function Component$blur() {
            ///<summary>
            ///Programmatically removes input focus from this component.
            ///</summary>
            this.element().blur();
        }
        , hasInputFocus: function Component$hasInputFocus() {
            ///<summary>
            /// Returns a boolean value indicating whether or not this component currently has
            /// input focus or not.
            ///</summary>
            return false;
        }

        /* END Input Focus Management */

        /* BEGIN Data Management */

        , dataSource: function Component$dataSource(/*[value]*/) {
            ///<summary>
            /// Getter/Setter
            ///
            /// The Data Source for a Component is a simple JS object that defines some/all of the
            /// data points for a Component. The Data Source property is useful for creating data bound
            /// Components.
            ///
            /// In the default implementaion, a change to the Data Source property does not trigger
            /// any updates to the DOM of the Component. It is the responsibility of a Component
            /// author to best determine how to respond to changes in data (full invalidation, partial invalidation, etc.).
            ///</summary>
            ///<param name="value">The new Data Source value</param>
            ///<returns>
            /// If value is undefined, returns the current Data Source object for this Component.
            /// If value is defined, no value will be returned.
            ///</returns>
            if (arguments.length === 0) {
                return this._dataSource;
            } else {
                this._dataSource = arguments[0];
            }
        }
        , templateData: function Component$templateData() {
            ///<summary>
            /// The Template Data is a mapping of the Data Source property to a schema that is consumable by
            /// the Mustache templating engine. There are situations where even though it is possible to write
            /// a Mustache fragment that matches the desired output with the given Data Source, it is much
            /// simpler to map the data into a more Mustache friendly schema.
            ///
            /// The default implementation of this method assumes that Template Data and Data Source are
            /// exactly the same.
            ///</summary>
            return this.dataSource() || {};
        }

        /* END Data Management */

        /* BEGIN Rendering */

        , template: function Component$template(key, value) {
            ///<summary>
            ///Overrides the partial template with name "key" with the template given in "value"
            ///</summary>
            ///<param name="key">The name of the partial template to replace. Omit this argument to default to 'base'</param>
            ///<param name="value">The Mustache template fragment to replace the template with.</param>
            if (arguments.length === 1) {
                value = key;
                key = 'base';
            }

            if (!this._options.templates.__instance) {
                // if the markup templates for this component are the shared copy
                // and we are changing one of the markup templates, then 
                // we have to clone an instance of the shared copy
                this._options.templates = $.extend(
                    { __instance: true }
                    , this._options.templates
                    , { __compiledTemplate: null }
                );
            }

            this._options.templates[key] = value;
            if (this._options.templates.__compiledTemplate) {
                this._options.templates.__compiledTemplate = null;
            }
        }

        , _processTemplates: function Component$_processTemplates() {
            ///<summary>
            /// Using the templateData property and the templates defined for this component, generates
            /// the HTML that will be used as the source of the DOM fragment for this component.
            ///</summary>
            ///<remarks>
            /// Note that if there is a partial template reference cycle in the template definitions
            /// Mustache will be thrown into an infinite loop and a stack overflow exception
            /// will be triggered.
            ///</remarks>
            if (!this._options.templates.__compiledTemplate) {
                try {
                    this._options.templates.__compiledTemplate = Mustache.compile(this._options.templates['base'], this._options.templates);
                } catch (e) {
                    if (e.is_mustache_error) {
                        console.error(e.message);
                    } else {
                        throw e;
                    }
                }
            }
            return this._options.templates.__compiledTemplate(this.templateData());
        }
        , _instantiateChildComponents: function Component$_instantiateChildComponents() {
            ///<summary>
            /// Finds all "component" elements in the component's DOM and instantiates the
            /// declared type. This is useful for building component graphs using 
            /// declarative markup rather than code. Each valid component element that has an
            /// ID attribute will have an autogenerated reference available in the context of this
            /// Component.
            ///</summary>
            ///<example>
            /// The following simple DOM fragment will create a variable this._sample of type
            /// Vastardis.UI.Components.Component in the context of the instantiated component:
            /// <component id="sample"></component>
            ///</example>
            ///<remarks>
            /// Note that component elements that do not have a type attribute will be replaced by
            /// an instance of the root Component class.
            ///</remarks>
            if (!this._options.instantiateComponents) { return; }

            var templateDataCache, dfds,
                self = this;
			
			dfds = this._source.find('component').map(function (index, componentElement) {
                var $componentElement = $(componentElement), asyncCreationDfd, dsAttr,
                    options, 
                    component, $component,
                    autogenId;

                if ($componentElement.attr('options') !== undefined) {
                    options = eval('(' + $componentElement.attr('options') + ')');
                } else {
                    options = {};
                }
                options.id = $componentElement.attr('id');
				
                var instantiationSibling = Component.instantiationSibling.clone();
				instantiationSibling.insertAfter($componentElement);
				$componentElement.remove();

				asyncCreationDfd = $.Deferred();
				if ($componentElement.attr('url')) {
					doodads.create($componentElement.attr('url'), options)
						.done(function(result) {
							asyncCreationDfd.resolve(result);
						});
				} else {
					asyncCreationDfd.resolve(new vsc.Component(options));
				}
				
				var completionDfd = $.Deferred();
				
				asyncCreationDfd.promise().done(function(component) {
					var $component,
						autogenId;
						
					component.translateInnerMarkup($componentElement);
					
					if (options.id) {
						// if the child has an id, then create a reference to the
						// child on the parent's 'this'.
						// this way, the parent can reference the child using 'this._{id}'
						autogenId = '_' + options.id;
						self[autogenId] = component;
						self._autogenChildren.push(autogenId);
					}

					dsAttr = $componentElement.attr('dataSource');
					if (dsAttr) {
						if (!templateDataCache) {
							templateDataCache = self.templateData();
						}

						if (dsAttr === '.') {
							// the special marker '.' is for passing the full dataSource 
							// down to the child component
							component.dataSource(templateDataCache);
						} else {
							// why not just component.dataSource(this.templateData()[dsAttr])?
							// dsAttr may contain a compound property ('x.y.z') which would not work
							// without the eval.
							component.dataSource(eval('templateDataCache.' + dsAttr));
						}
					}

					// auto-bind events based on attributes that start with "on"
					$.each(componentElement.attributes, function (i, attr) {
						if (attr.name.indexOf('on') !== 0 || typeof self[attr.nodeValue] !== 'function') {
							return;
						}

						var proxyName = attr.nodeValue + '$proxy',
							evtName = attr.name.substr(2);

						if (!self[proxyName]) {
							// do not recreate the proxy if it already exists
							// happens if/when you bind to events in a mustache loop
							self[proxyName] = $.proxy(self[attr.nodeValue], self);
						}
						$component.bind(evtName, self[proxyName]);
						self._autogenUnbinds.push({
							component: component
							, evt: evtName
							, fn: self[proxyName]
						});
					});

					self.addChild(component);
					
					component.render(instantiationSibling);
					component.element().unwrap();
					
					completionDfd.resolve();
				});
				
				return completionDfd.promise();
			});
			
			$.when.apply(null, dfds)
				.done(function() {
					self.onChildrenReady();
				});
        }
        , translateInnerMarkup: function Component$translateInnerMarkup(sourceElement) {
            ///<summary>
            /// Converts the inner markup of a <component> element in a markup template to 
            /// equivalent code. By default this function converts the text/mustache script sections
            /// into template overrides.
            ///</summary>
            ///<param name="sourceElement">The source element to read the markup from</param>
            ///<remarks>
            /// This function is only useful for Component authors to add additional functionality 
            /// for the <component> custom element in templates
            ///</remarks>

            var templates = { __compiledTemplate: undefined };

            sourceElement.find('script[type="text/mustache"][partial]')
                .each(function () {
                    var $domElement = $(this),
						partial = $domElement.html();

                    if ($.browser.msie && $.browser.version < 9) {
                        partial = partial.substring(2);
                    }

                    templates[$domElement.attr('partial')] = partial;
                    templates.__instance = true;
                });

            if (templates.__instance) {
                delete templates.__instance;
                for (var key in templates) {
                    if (templates.hasOwnProperty(key)) {
                        this.template(key, templates[key]);
                    }
                }
            }
        }

        , render: function Component$render(target, rerender) {
            ///<summary>
            /// Appends the DOM for this component to the DOM element specified by <paramref name="target">target</paramref>.
            /// If <paramref name="target">target</paramref> is null/undefined and <paramref name="rerender">rerender</paramref> is
            /// true, the DOM representation of the Component will be regenerated in place.
            /// If <paramref name="target">target</paramref> is null/undefined and <paramref name="rerender">rerender</paramref> is
            /// false, the DOM representation of the Component will be removed from the DOM.
            ///</summary>
            ///<param name="target">The DOM element to append this Component to.</param>
            ///<param name="rerender">Whether or not to recreate the DOM for this component.</param>
            var oldSource;
            if (rerender) {
                if (this._source) {
                    oldSource = this._source;

                    this.tearDownComponents();

                    this._source = null;

                    this._isAttached = false;

                    oldSource.replaceWith(this.element());
                } else {
                    this.ensureElement();
                }
            }

            if (target) {
                target.append(this.element());
            } else if (!rerender) {
                this.element().detach();
            }

            this.updateAttachment();
        }
        , rerender: function Component$rerender() {
            ///<summary>
            /// Rerenders the DOM Element for a component. This is a shortform for
            /// component.render(null, true);
            ///</summary>
            this.render(null, true);
        }
        , detachElement: function Component$detachElement() {
            ///<summary>
            /// Detaches the DOM element for this component. This is a shortform for
            /// component.render(null, false);
            ///</summary>
            this.render(null, false);
        }
        , constructElement: function Component$constructElement() {
            ///<summary>
            /// Constructs a DOM Fragment representing the visual look for the Component.
            /// Child Components should also be instantiated and referenced in this method.
            ///</summary>

            // for once jQuery is not our friend. It parses the incoming string and turns it into something
            // that all browsers will load correctly without regard for the correct nesting rules of elements
            // this unfortunately conflicts with our abuse of SCRIPT for mustache.
            var htmlFrag = this._processTemplates(),
                domFrag,
                self = this;

            if ($.browser.msie) {
                domFrag = innerShiv(htmlFrag);
            } else {
                domFrag = document.createDocumentFragment();
                $.each($.clean([htmlFrag.trim()], undefined, null, null),
                    function (index, element) { domFrag.appendChild(element); });
            }

            if (domFrag.firstChild != domFrag.lastChild) {
                // this is more of a guard condition. components *must* have a single topmost node
                this._source = $('<div />').append(domFrag);
            } else {
                this._source = $(domFrag.firstChild);
            }

            this._generateDOMReferences();
        }
        , ensureElement: function Component$ensureElement() {
            ///<summary>
            /// Guarantees the existence of the DOM Fragment for this component.
            /// This method is intended to support the Component infrastructure. Call this
            /// method if there is a particular code fragment that explicitly depends on the
            /// DOM for the Component being present.
            ///</summary>
            if (!this._source) {
                this.constructElement();

                this._instantiateChildComponents();
                this.bindEvents();

                this._setDomId();
                this._updateCssClass();
                this.tabIndex(this.tabIndex()); // make sure tabIndex is present on the DOM if necessary

                this._hookWindowResize();

                // create a two-way relationship between the component and the DOM
                this._source.data(DOMCOMPONENTMETA, this);

				if (this._options.validates) {
					this._initializeValidationListeners();
				}
				
                this.onComponentReady();
            }
        }
        , _generateDOMReferences: function Component$_generateDOMReferences() {
            if (!this._options.autoDOMReferences) {
                return;
            }

            var self = this;
            this._source.find('[name]:not(component)').each(function (index, elem) {
                $.each(elem.getAttribute('name').split(' '), function () {
                    var name = '_' + this;
                    if (self[name]) {
                        self[name] = self[name].add(elem);
                    } else {
                        self[name] = $(elem);
                        self._autogenRefs.push(name);
                    }
                });
            });
        }
        , element: function Component$element() {
            ///<summary>
            /// Returns a reference to the DOM Element for a Component.
            ///</sumamry>
            ///<remarks>
            /// Note that the element may be detached from the document so layout calculations
            /// should be done via the onAttached callback method.
            ///</remarks>
            this.ensureElement();
            return this._source;
        }
        , isAttached: function Component$isAttached() {
            ///<summary>
            /// Determines whether or not the document element is an
            /// ancestor for the DOM element of this component.
            ///</summary>
            if (!this._source) return false;

            var parentChain = this.element().parents();
            return parentChain.length > 0 && parentChain[parentChain.length - 1].tagName === 'HTML';
        }
        , updateAttachment: function Component$updateAttachment() {
            ///<summary>
            /// Update the DOM attachment of the component. Use this method if you are
            /// bypassing the usage of the render method for whatever reason.
            ///</summary>
            var getAttached = this.isAttached();

            if (getAttached && !this._isAttached) {
                // transition from non-attached to attached
                this._notifyAttachment();
            } else if (!getAttached && this._isAttached) {
                // transition from attached to non-attached
                this._notifyDetachment();
            }
        }
        /* END Rendering */

        /* BEGIN Event Management */

        , _notifyAttachment: function Component$_notifyAttachment() {
            this._isAttached = true;

            this.onAttached();

            $.each(this._children, function (index, child) {
                child._notifyAttachment();
            });
        }
        , _notifyDetachment: function Component$_notifyDetachment() {
            this._isAttached = false;

            this.onDetached();

            $.each(this._children, function (index, child) {
                child._notifyDetachment();
            });
        }

        , bindEvents: function Component$bindEvents() {
            ///<summary>
            /// Called by the DOM construction method of the Component base class to allow
            /// Component authors to bind events onto DOM elements.
            ///</summary>
            ///<remarks>
            /// This method is called after all child components have been instantiated, so component
            /// events can be consumed as well.
            ///</remarks>

            // Default Implementation is basically abstract since there is nothing to bind unto.
        }

        , onComponentReady: function Component$onComponentReady() {
            ///<summary>
            /// Callback function that gets called when the component has finished the rendering process.
            /// Note that this callback gets invoked after every time the root element is reconstructed (rerendered)
            ///</summary>

            // Default Implementation is basically abstract since there is nothing to bind unto.
        }
		, onChildrenReady: function Component$onChildrenReady() {
			///<summmary>
			/// Callback function that getsw called when the children components have finished the rendering process.
			/// Note that this callback gets invoked afer every time the root element is reconstructed (rerendered)
			///</summary>
			
			// Default Implementation is basically abstract since there is nothing to bind unto.
		}

        , onAttached: function Component$onAttached() {
            ///<summary>
            /// Callback function that gets called when the component's root element is attached to the DOM document.
            /// Note that this callback is only called if the component (or a parent of) is attached via the
            /// render/detachElement methods and not through an explicit DOM attachment since there is no way to detect
            /// that in a cross-browser fashion. In addition, the selective nature of this callback can be used to 
            /// do things without the components knowledge if need be.
            ///</summary>

            // By default, nothing interesting happens when the component becomes attached.
        }
        , onDetached: function Component$onDetached() {
            ///<summary>
            /// Callback function that gets called when the component's root element is detached from the DOM document.
            /// Note that this callback is only called if the component (or a parent of) is detached via the
            /// render/detachElement methods and not through an explicit DOM detachment since there is no way to detect
            /// that in a cross-browser fashion. In addition, the selective nature of this callback can be used to 
            /// do things without the components knowledge if need be.
            ///</summary>

            // By default, nothing interesting happens when the component becomes detached.
        }

        , _hookWindowResize: function Component$_hookWindowResize() {
            ///<summary>
            /// Hooks the window.onresize event if an ancestor of this component hasn't already
            /// hooked it.
            ///</summary>
            if (!this._isResizeAutotriggered()) {
                // did the component developer implement the special onResize method?
                if (this.onResize && !this._hookedResize) {
                    this._hookedResize = true;
                    $window.bind('resize orientationchange', this.onWindowResize$proxy);
                }
            } else {
                if (this.onResize && this._hookedResize) {
                    this._hookedResize = false;
                    $window.unbind('resize orientationchange', this.onWindowResize$proxy);
                }
            }
        }

        , onWindowResize: function Component$onWindowResize() {
            ///<summary>
            /// Internal DOM event handler. Handles the window.onresize event 
            /// and performs the necessary machination to bootstrap a recursive resize event in the Component tree
            ///</summary>
            if (this._currheight !== document.documentElement.clientHeight ||
                this._currwidth !== document.documentElement.clientWidth) {

                this._onResize$debounced();
            }
            this._currheight = document.documentElement.clientHeight;
            this._currwidth = document.documentElement.clientWidth;
        }

        , _isResizeAutotriggered: function Component$_isResizeAutotriggered() {
            ///<summary>
            /// If an ancestor in the component hierarchy implements an onResize function,
            /// the onResize method of this component will be auto triggered either as part of a DOM triggered
            /// window.onresize, a manually triggered window.onresize, or a branch onResize (via trigger_resize)
            ///</summary>
            for (var p = this.parent(); p; p = p.parent()) {
                if (p.onResize) {
                    return true;
                }
            }

            return false;
        }

        , _onResize: function Component$_onResize() {
            ///<summary>
            /// Performs a recursive walk of the descendents of this component calling onResize
            /// if it exists on the descendent.
            ///</summary>
            if (this.onResize && this._isAttached) {
                // the source element has to be attached to the main DOM tree (i.e. be visible) before
                // resizing makes sense
                this.onResize();
            }

            $.each(this._children, function (index, child) {
                child._onResize();
            });
        }

        /*, onResize: function Component$onResize() {
        ///<summary>
        /// onResize is an "optional" member of this class. If it is implemented, the Component 
        /// library will trigger it as part of a ancestor->descendants walk when listening to the
        /// window.onresize event.
        /// This function *must* be synchronous for the nested children to resize properly.
        ///</summary>
        }*/

        , trigger_resize: function Component$trigger_resize(deferred) {
            ///<summary>
            /// Triggers a resize event with this component at the root of the component hierarchy
            ///</summary>
            ///<param name="deferred">
            /// An optional parameter that determines whether the resize will get fired immediately
            /// or deferred for later execution (useful if multiple resizes are going to be temporally clustered).
            /// true for deferred
            /// false for immediate
            /// The default value for this parameter is true
            /// </param>
            if (deferred || (deferred === undefined)) {
                this._onResize$debounced();
            } else {
                this._onResize();
            }
        }
        /* END Event Management */

        /* BEGIN Validation Management */
		, _trigger_validity: function Component$trigger_validity(isValid) {
			var e = $.Event(isValid ? 'valid' : 'invalid'), $this = $(this);
		    $this.trigger.call($this, e, arguments);
			
		    if (!e.isPropagationStopped() && this.parent()) {
		        this.parent()._valid(isValid);
		    }
		}
		, trigger_valid: function Component$trigger_valid() {
		    ///<summary>
		    /// Triggers the "valid" event.
		    ///</summary>
		    ///<remarks>
		    /// Note that this method is meant to support component authors and should rarely be used
		    /// by component consumers.
		    ///</remarks>
			this._trigger_validity(true);
		}
		, trigger_invalid: function Component$trigger_invalid() {
		    ///<summary>
		    /// Triggers the "valid" event.
		    ///</summary>
		    ///<remarks>
		    /// Note that this method is meant to support component authors and should rarely be used
		    /// by component consumers.
		    ///</remarks>
			this._trigger_validity(false);
		}
		, valid: function Component$valid(/*value*/) {
		    /// <summary>
		    ///		1: valid() - return the current validity.
		    ///		2: valid(value) - sets the validity to "value".
		    ///
		    ///		Trigger the "valid" and "invalid" functions, only when the validity state changed.
		    ///		That is, if the state changed from true to false then "invalid" triggers, if it went from 
		    ///		false to true, then "valid" triggers.
		    /// </summary>
		    /// <param name="value" type="Boolean" optional="true" />
		    /// <returns type="Boolean">
		    ///		true if it's valid, false otherwise
		    ///	</returns>
		    /// <remarks>
		    /// 	Calling "valid(value)" will override the validity.  Because of this, the validity of its children will never 
		    ///		again be included in the computation of its validity, unless "listenToChildrenValidity(true)" is called.
		    /// </remarks>		    
		    if (arguments.length === 0) {
		        return this._valid();
		    } else {
		        this.listenToChildrenValidity(false);
		        this._valid(arguments[0]);
		    }
		}
		, validate: function Component$validate() {
		    ///<summary>
		    /// Validate the contents of this component, triggering valid/invalid events
		    /// as necessary.
		    ///</summary>

		    this._computeValidityState();

		    if (this._isValid) {
		        this.trigger_valid(this);
		    } else {
		        this.trigger_invalid(this);
		    }
		}
        , _computeValidityState: function Component$_computeValidityState() {
            ///<summary>
            /// Check that all children are valid.  If one is invalid, then the component
            /// itself is invalid	
            ///</summary>

            var isValid = true;

            if (this.listenToChildrenValidity()) {
                $.each(this._children, function (index, child) {
                    if (!child.valid()) {
                        isValid = false;
                        return false;
                    };
                });
            }

            this._isValid = isValid;
        }
		, _valid: function Component$_valid(/*value*/) {
		    if (arguments.length === 0) {
		        return this._isValid;
		    } else {
		        var value = arguments[0];

		        if (!this._isValid && value) {
		            this._computeValidityState();

		            if (this._isValid) {
		                this.trigger_valid(this);
		            }
		        } else if (this._isValid && !value) {
		            this._isValid = false;
		            this.trigger_invalid(this);
		        }
		    }
		}
		, listenToChildrenValidity: function Component$listenToChildrenValidity(/*value*/) {
		    ///<summary>
		    /// Determines whether or not validity of this component should be the LOGICAL AND of the validity
		    /// states of the children or a value determined manually through the valid function.
		    /// If no arguments are given, then this function returns the current value of this property:
		    ///  false: manually determined value
		    ///  true: LOGICAL AND of validity state of children.
		    /// If an argument is given then it will override the value of this property.
		    ///</summary>
		    ///<param name="value">The new value for this property (boolean)</param>
		    ///<returns>
		    /// If no parameter is given, then it returns the current value of this property.
		    /// If a parameter is given, then the return value is undefined.
		    ///</returns>
		    if (arguments.length === 0) {
		        return this._listenToChildrenValidity;
		    } else {
		        this._listenToChildrenValidity = arguments[0];

		        if (this._listenToChildrenValidity) {
		            this.validate();
		        }
		    }
		}
        /* END Validation Management*/

        /* BEGIN Component Life Cycle */

        , tearDownComponents: function Component$tearDownComponents() {
            ///<summary>
            /// Dispose all the children and null out any extra references to them
            ///</summary>
            $.each(this._autogenUnbinds, function (index, entry) {
                $(entry.component).unbind(entry.evt, entry.fn);
            });
            this._autogenUnbinds.length = 0;

            $.each($.merge([], this._children), function (index, child) {
                child.dispose();
            });
            this._children.length = 0;

            $.each($.merge(this._autogenChildren, this._autogenRefs), $.proxy(function (index, prop) {
                delete this[prop];
            }, this));
            this._autogenChildren.length = 0;
            this._autogenRefs.length = 0;
        }

        , dispose: function Component$dispose() {
            ///<summary>
            /// By default, recursively disposes of its children and then
            /// removes the component out of the DOM and parent's children list
            /// and unwires any event handlers as necessary. If a component binds onto a
            /// DOM event for an element that is not a descendant of the root of the component,
            /// then that DOM element must be manually unbound. Similarly, if a component gets
            /// bound unto a non-DOM Event, then that event needs to be manually unbound *unless*
            /// that event is bound using the declarative syntax.
            ///</summary>
            ///<remarks>
            /// Note that the fragment removed from the DOM is not actually disposed until 
            /// after the Garbage Collector gets around to it.
            ///</remarks>

            this.tearDownComponents();

            if (!this._isResizeAutotriggered()) {
                // did the component developer implement the special onResize method?
                if (this.onResize) {
                    this._hookedResize = false;
                    $window.unbind('resize orientationchange', this.onWindowResize$proxy);
                }
            }

            // the presense of the onResize function causes the hierarchy management functions to
            // hook unto the window.onresize event in some conditions. to prevent this,
            // unmap the function as part of teardown
            delete this['onResize'];
            this.onResize = undefined; // IE is just plain weird

            this.element()
                .empty()
                .remove();

            if (this.parent()) {
                this._parent.removeChild(this);
                this._parent = null;
            }
        }

        /* END Component Life Cycle */
    }
    Component.prototype.constructor = Component;
    vsc.Component = Component;

    /* BEGIN Static Methods */

    Component.create = function (url, options) {
        ///<summary>
        /// Instantiates a copy of the component located at url with the given options.
        ///</summary>
        ///<param name="url" type="String">The URL to load the Component from.</param>
        ///<param name="options" type="Object" mayBeNull="true" optional="true">The options to initialize the component with</param>
        ///<returns type="Vastardis.UI.Components.Component" />
        return doodads.create(url, options);
    }

    Component.measureString = function (string, styles) {
		return string.measureString(styles);
	}

    Component.bulkMeasureString = function (strs, styles) {
		return String.bulkMeasure(strs, styles);
    }

    Component.cropString = function (string, targetWidth, styles) {
		return string.crop(targetWidth, styles);
    }

    /* END Static Methods */

    $.fn.component = function () {
        ///<summary>
        /// Returns the components that back the elements in a particular jQuery list of elements.
        /// This method is useful if you have a reference to the DOM elememt of a component,
        /// but not the component itself.
        ///</summary>
        ///<returns>

        /// If none of the elements have a backing component, then returns undefined.
        /// If only one of the elements has a component, then that component is returned.
        /// If some/all of the elements have a component, then the input array is mapped into an
        /// array where elements have a component are populated
        ///</returns>

        var components = $.map(this, function (element, index) {
            return $(element).data(DOMCOMPONENTMETA);
        });

        switch (components.length) {
            case 0:
                return undefined;
            case 1:
                return components[0];
            default:
                return components;
        }
    }
})(jQuery);

/* The MIT License

Copyright (c) 2011 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function($, undefined) {
	var canonicalizationDiv = null,
		cache = {
			types: {},
			waitFunctions: {},
			constructions: {}
		},
		utils = {
			getResponseFunc: function(url) {
				return (cache.waitFunctions[utils.canonicalize(url)] || { func : $.noop }).func;
			},
			canonicalize: function ComponentFactory$canonicalize(url) {
				///<summary>
				/// Creates a absolute url out of the passed in url.
				///</summary>
				///<param name="url" type="String">The URL to canonicalize.</param>
				///<remarks>
				/// from http://grack.com/blog/2009/11/17/absolutizing-url-in-javascript/ by Matt Mastracci
				/// CC by Attribution 3.0
				/// adapted to use one time lazy initialization.
				///</remarks>
				if (!canonicalizationDiv) {
					canonicalizationDiv = document.createElement('div');
				}

				var div = canonicalizationDiv;
				div.innerHTML = '<a></a>';
				div.firstChild.href = url; // Ensures that the href is properly escaped
				div.innerHTML = div.innerHTML; // Run the current innerHTML back through the parser
				return div.firstChild.href;
			},
			require: function(url) {
				var canonUrl = utils.canonicalize(url);

				if (cache.waitFunctions[canonUrl]) {
					return cache.waitFunctions[canonUrl].dfd.promise();
				} else {
					cache.waitFunctions[canonUrl] = {
						func: function(type) {
							var dfd = cache.waitFunctions[canonUrl].dfd;
							cache.types[canonUrl] = type;
							delete cache.waitFunctions[canonUrl];
							dfd.resolve();
						},
						dfd: $.Deferred()
					};

					yepnope(canonUrl);
				
					return cache.waitFunctions[canonUrl].dfd.promise();
				}
			}		
		};

	function builder(name) {
		this.name = name;
		this.setupObject = {
			base: null,
			validates: false,
			defaultOptions: {},
			init: $.noop,
			proto: {},
			templates: {},
			inheritsTemplates: false,
			stylesheets: {},
			statics: {}
		};
	}
	builder.prototype = {
		inheritsFrom: function(inheritsFrom) {
			this.setupObject.base = inheritsFrom;
			
			return this;
		},
		constructor: function(func) {
			this.setupObject.init = func;
			
			return this;
		},
		validates: function() {
			this.setupObject.validates = true;
			
			return this;
		},
		defaultOptions: function(defaultOptions) {
			this.setupObject.defaultOptions = defaultOptions;
			
			return this;
		},
		proto: function(proto) {
			$.extend(this.setupObject.proto, proto);
			
			return this;
		},
		templates: function(templates, inheritsTemplates) {
			$.extend(this.setupObject.templates, templates);
			
			if (inheritsTemplates) {
				this.setupObject.inheritsTemplates = true;
			}
			
			return this;
		},
		stylesheets: function(stylesheets) {
			$.extend(this.setupObject.stylesheets, stylesheets);
			
			return this;
		},
		statics: function(statics) {
			$.extend(this.setupObject.statics, statics);
			
			return this;
		},
		complete: function() {
			var baseDfd = $.Deferred(), 
				baseType,
				setupObject = this.setupObject, 
				name = this.name;

			if (setupObject.base) {
				baseType = doodads.getType(setupObject.base);
				
				if (!baseType) {
					utils.require(setupObject.base).done(function() {
						baseDfd.resolve(doodads.getType(setupObject.base).prototype);
					});
				} else {
					baseDfd.resolve(baseType.prototype);
				}
			} else {
				baseDfd.resolve(Vastardis.UI.Components.Component.prototype);
			}
			
			baseDfd.promise().done(function(baseType) {
				var new_doodad = function(options, defaultOptions) {
					if (arguments.length === 0) { return; }
					
					this.base = baseType;
					this.base.constructor.call(this, $.extend({}, defaultOptions, options), new_doodad.defaultOptions);
					
					setupObject.init.apply(this, []);
				};
				
				new_doodad.defaultOptions = setupObject.defaultOptions || {};
				new_doodad.defaultOptions.templates = $.extend({}, 
					setupObject.inheritsTemplates ? baseType.constructor.defaultOptions.templates : {},  
					new_doodad.defaultOptions.templates,
					setupObject.templates);
					
				new_doodad.prototype = $.extend(new baseType.constructor(), setupObject.proto);
				new_doodad.prototype.constructor = new_doodad;
				
				if (setupObject.validates) {
					Vastardis.UI.Components.Component.addValidationAPI(new_doodad);
				}
				
				for (var key in setupObject.statics) {
					if (setupObject.statics.hasOwnProperty(key)) {
						new_doodad[key] = setupObject.statics[key];
					}
				}

				// after everything is done..
				utils.getResponseFunc(name)(new_doodad);
				delete cache.constructions[name];
			});
		}
	}
	
	doodads = {
		setup: function(name, definition) {
			if (cache.constructions[name]) {
				return cache.constructions[name];
			}
			
			var constructor = new builder(name);
			
			definition = $.extend({
				inheritsTemplates: false,
				templates: null,
				stylesheets: null,
				validates: false
			}, definition);

			if (definition.validates) {
				constructor.validates();
			}

			constructor
				.templates(definition.templates, definition.inheritsTemplates)
				.stylesheets(definition.stylesheets);
			
			cache.constructions[name] = constructor;
			
			return constructor;
		},		
		create: function(url, options) {
			var dfd = $.Deferred(), type = doodads.getType(url);
			
			options = options || {};
			
			if (!type) {
				utils.require(url).done(function() {					
					type = doodads.getType(url);
					dfd.resolve(new type(options));
				});
			} else {
				dfd.resolve(new type(options));
			}
			
			return dfd.promise();
		},
		getType: function(url) {
			return cache.types[utils.canonicalize(url)];
		}
	};
})(jQuery);

/* The MIT License

Copyright (c) 2011 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function($, undefined) {
    /* CAPTURING EVENTS */

    // this is a list of valid events to capture. Because there is some overhead involved
    // in having the capturing "infrastructure" in place, this list should be kept as small
    // as possible.
    var capturables = ['mousedown'];

    var captureSinks = {};

    // creates a capturing variant of the passed in eventArgs object
    function createCapturedEventArgs(eventArgs) {
        var expando = eventArgs[$.expando];
        delete eventArgs[$.expando];

        var evt = $.event.fix(eventArgs);
        evt.type = 'captured' + eventArgs.type;
        evt.originalEvent = eventArgs;
        evt.originalTarget = eventArgs.target;

        eventArgs[$.expando] = expando;

        return evt;
    }

    // the jQuery goo necessary for making capturing events work.
    $.each(capturables, function (index, evtName) {
        captureSinks[evtName] = [];
        captureSinks[evtName].peek = function () { return this[this.length - 1]; };

        $.event.special[evtName] = {
            add: function (handleObj) {
                var oldHandler = handleObj.handler;

                handleObj.handler = function (eventArgs) {
                    if ((captureSinks[evtName] || []).length > 0) {
                        var retVal;

                        if (!$(eventArgs.originalEvent).data('executedCapture')) {
                            $(eventArgs.originalEvent).data('executedCapture', true);
                            if ($.browser.msie) {
                                eventArgs.originalEvent[$.expando] = undefined;
                            } else {
                                delete eventArgs.originalEvent[$.expando];
                            }

                            evt = createCapturedEventArgs(eventArgs);

                            $(captureSinks[evtName].peek().element).trigger(evt);

                            retVal = evt.result;
                        }

                        if (!eventArgs.isPropagationStopped()) {
                            retVal = oldHandler.apply(this, arguments);
                        }

                        return retVal;
                    } else {
                        return oldHandler.apply(this, arguments);
                    }
                };
            }
        };
    });

    window.captureEvent = function (eventName, element, handler) {
        ///<summary>
        /// When an event is "captured", all future instances of that event will first get routed through the
        /// element who called for the capture before bubbling up the DOM tree as usual. This allows the
        /// captor element to inspect the incoming event and either mutate it, or perform a specific action
        /// in response to an event that is "outside" of its DOM.
        /// Once an event is captured, if that event is triggered, the matching 'captured' version of that event
        /// is triggered on the captor element. So for example, if you capture the 'mousedown' event with element x,
        /// a 'capturedmousedown' event is first triggered on element x before the usual mousedown trigger and bubble.
        /// Note that captured events "stack", meaning that if an existing captor exists for an event and that event
        /// is captured again, a subsequent releaseEvent call will reroute events to that captor.
        ///
        /// This functionality is based on the WIN32 SetCapture API which routes all mouse events through a particular
        /// window. For more information: http://msdn.microsoft.com/en-us/library/ms646262%28VS.85%29.aspx
        ///</summary>
        ///<param name="eventName">The name of the DOM event to capture.</param>
        ///<param name="element">The DOM element that is designated as the captor.</param>
        ///<param name="handler">
        /// [OPTIONAL] The function to call that will inspect the captured event.
        /// When the handler is bound through this function, it will be unbound when calling releaseEvent.
        /// Otherwise, you can bind the handler manually by writing $(element).bind('captured' + eventName', function(eventArgs) {});
        /// The eventArgs.originalTarget contains the DOM element that initially triggered the event.
        /// </param>
        ///</remarks>
        /// Although it is highly recommended that the element argument be an actual DOM element, the code
        /// does not make this check and the parameter can just as easily be an object literal. This functionality
        /// is not tested and should be avoided.
        ///</remarks>
        if (typeof (captureSinks[eventName]) === 'undefined') {
            // if event is not captured, then there is nothing to do
            return;
        }

        if (captureSinks[eventName].length > 0) {
            // if an existing capture exists, disable the capture
            $(captureSinks[eventName].peek().element).unbind('captured' + eventName + '.capturingTool');
        }

        captureSinks[eventName].push({ element: element, handler: handler });
        if (typeof (handler) === 'function') {
            $(element).bind('captured' + eventName + '.capturingTool', handler);
        }

        if (captureSinks[eventName].length === 1) {
            // if this is the first capture to get added, then hook the final source
            $(document.body).bind(eventName + '.capturingTool', function (eventArgs) {
                // if the originating event bubbled all the way up to the document node,
                // then perhaps no interested consumers exist for the event, which means
                // the event filter won't be installed.
                // but we have to funnel the event to the appropriate capture sink anyways
                // so do that here.
                if (!$(eventArgs.originalEvent).data('executedCapture')) {
                    $(captureSinks[eventName].peek()).trigger(createCapturedEventArgs(eventArgs));
                }
            });
        }
    }

    window.releaseEvent = function (eventName) {
        ///<summary>
        /// Releases the current capture on the event specified by eventName.
        /// If eventName is not captured, this function is effectively a no-op.
        ///</summary>
        ///<param name="eventName">The captured event to release</param>
        var sink;

        if ((captureSinks[eventName] || { length: 0 }).length === 0) {
            // if eventName is not captured, or the stack is empty
            // then there is nothing to do
            return;
        }

        sink = captureSinks[eventName].pop();
        $(sink.element).unbind('captured' + eventName + '.capturingTool');

        if (captureSinks[eventName].length === 0) {
            // if this was the last capture, then remove the final source
            $(document.body).unbind(eventName + '.capturingTool');
        } else {
            // if there were captures we stacked on, rebind
            sink = captureSinks[eventName].peek();
            if (typeof (sink.handler) === 'function') {
                $(sink.element).bind('captured' + eventName + '.capturingTool', sink.handler);
            }
        }
    }
})(jQuery);

/* The MIT License

Copyright (c) 2011 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function ($) {
    $.extend(true, window, { Vastardis: { UI: { Components: {}}} });

    // namespace alias
    var vsc = Vastardis.UI.Components;

    vsc.Component.addValidationAPI = function (component) {
        $.each(['valid', 'validationContext', 'isValidationContextEmpty', 'dispose'], function (index, item) {
            component.prototype['_prototype_' + item] = component.prototype[item];
        });

        component.prototype.__validator = {};
        for (var key in Validator) {
            component.prototype.__validator[key] = component.prototype[key];
        }

        $.extend(component.prototype, Validator);
        component.defaultOptions = $.extend({
            validates: true
			, validationListeners: 'hintbox'
        }, component.defaultOptions);
    }

    vsc.Component.removeValidationAPI = function (component) {
        for (key in Validator) {
            component[key] = component.__validator[key];
        }

        $.each(['valid', 'validationContext', 'isValidationContextEmpty', 'dispose'], function (index, item) {
            var prototypeFunction = '_prototype_' + item;
            component[item] = component[prototypeFunction];
            delete component[prototypeFunction];
            component[prototypeFunction] = undefined;
        });
    }

    // determines how long the validator waits for an async rule to callback before
    // showing the user a message.
    var ASYNC_GRACE_PERIOD = 100;

    Validator = {
        addRule: function (value) {
            ///	<summary>
            ///		Adds a rule to the list of rules the component must validate its context against.  The context is provided by "validationContext()"
            ///	</summary>
            ///	<remarks>
            ///		To create a new rule, one can simply use the already defined available rules in the "ValidationRules" namespace.  
            ///
            ///		Alternatively, a new rule can be created by defining a new object.  This object must contain 
            ///		a "validate" function, itself receiving as (optional) parameter the current context, and which
            ///		returns an object literal defined as:
            ///
            ///			- message (type="String"):  The message to display in the hintbox.
            ///			- valid (type="Boolean"): States whether the context is valid.
            ///			- alwaysShow (type="Boolean", optional="true"):  If true, the message will appear in the hintbox even if valid is false.
            ///
            ///		NOTE: When "alwaysShow" is set to true, the hintbox will always be displayed (when the component hasInputFocus() == true)
            ///	</remarks>
            /// <param name="rule" type="Object|[Object]">A single rule or an array of rules</param>

            this._rules = $.merge(this._rules || [], value instanceof Array ? value : [value]);
        }
		, addCallout: function (component) {
		    this._callouts = $.merge(this._callouts || [], component instanceof Array ? component : [component]);
		}
		, ranValidation: function () {
		    return this._ranValidation;
		}
        , valid: function () {
            if (arguments.length === 0 && this._source && !this._ranValidation) {
                this.validate();
            }
            return this._prototype_valid.apply(this, arguments);
        }

		, isValidationContextEmpty: function (context) {
		    if (this._prototype_isValidationContextEmpty) {
		        return this._prototype_isValidationContextEmpty.apply(this, arguments);
		    } else {
		        return (context === null || context === '');
		    }
		}
		, validationContext: function () {
		    ///<summary>
		    /// A JS object representation of the properties of this component that are needed
		    /// to test validity.
		    ///</summary>
		    ///<remarks>
		    /// It is the responsibility of the component author to correctly expose a validationContext
		    /// object bag to the validation infrastructure.
		    ///</remarks>
		    if (this._prototype_validationContext) {
		        return this._prototype_validationContext.apply(this, arguments);
		    } else {
		        return null;
		    }
		}

        , validate: function (/*traversalHistory*/) {
            ///<summary>
            ///
            ///</summary>
            var context = this.validationContext();
            var traversalHistory = arguments[0];
            this._backList = [];

            if (this._validationSuspended) {
                return;
            } else if (!this.required() && this.isValidationContextEmpty(context)) {
                // By-pass validation
                this._computedValidity = true;
                privateMethods.afterRulesRan.call(this, traversalHistory || [this]);
                return;
            }

            this._computedValidity = true;
            this._ranValidation = true;
            this._pendingRules = (this._rules || []).length;
            this._passId = (this._passId || 0) + 1;

            var passId = this._passId;
            var hasAsync = false;
            var callback = $.proxy(function (result) {
                privateMethods.ruleCallback.call(this, result, passId, traversalHistory || [this]);
            }, this);

            $.each(this._rules || [], $.proxy(function (index, rule) {
                var result = rule.validate(context, {
                    computedValidity: this._computedValidity,
                    isCallout: traversalHistory ? true : false,
                    callback: callback,
                    callee: this
                });

                if (!result.async) {
                    callback(result);
                } else {
                    hasAsync = true;
                }
            }, this));

            if (hasAsync) {
                setTimeout($.proxy(function () {
                    if (this._pendingRules === 0 || passId !== this._passId) return;

                    this._backList.push({ text: 'Validating...', isAsync: true });
                    privateMethods.trigger_validationApplied.call(this);
                }, this), ASYNC_GRACE_PERIOD);
            }

            privateMethods.afterRulesRan.call(this, traversalHistory || [this]);
        }
        , required: function (/*isRequired, requirementRule*/) {
            /// <summary>
            ///		1: required() - Indicates whethere the component is required or not.
            ///		2: required(true, function(){...}) - Sets the component to required, and adds the requirement rule.
            ///		3: required(true) - Set the component to required.
            ///		4: required(false) - Set the component to not required.
            /// </summary>
            /// <remarks>
            ///		If required() is called for the first time with isRequired being true, then requirementRule must be provided.
            /// </remarks>
            /// <param name="isRequired" type="Boolean" />
            /// <param name="requirementRule" type="function" optional="true">
            ///		The rule the component must validate its context against/
            ///	</param>
            /// <returns type="Bool" />

            if (arguments.length === 0) {
                return this._required;
            } else {
                if (this._required === arguments[0] &&
                    (arguments.length === 1 || (arguments.length === 2 && this._requirementRule === arguments[1]))) {
                    return;
                }

                this._required = arguments[0];

                if (this._required && arguments[1]) {
                    // if transitioning to required and a new requirement rule is passed in
                    // then override the existing (or add a new) requirement rule
                    if (this._requirementRule) {
                        this._rules = $.map(this._rules || [], $.proxy(function (rule, index) {
                            if (rule !== this._requirementRule) {
                                return rule;
                            }
                        }, this));
                    }
                    this._requirementRule = arguments[1]; // store
                    this.addRule(this._requirementRule);
                } else if (this._required && !arguments[1]) {
                    // if transitioning to required and no new requirement rule is given, then 
                    // use the existing requirement rule if available
                    if (!this._requirementRule) {
                        // this is an error
                        //throw 'No Requirement Rule defined.';
                    } else {
                        this.addRule(this._requirementRule);
                    }
                } else if (!this._required) {
                    // if transitioning to not required, then remove the requirement rule
                    this._rules = $.map(this._rules || [], $.proxy(function (rule, index) {
                        if (rule !== this._requirementRule) {
                            return rule;
                        }
                    }, this));
                }

                $(this).trigger('required');

                this.validate();
            }
        }
        , suspendValidation: function () {
            ///<summary>Temporarily stops the validation code from triggering</summary>
            this._validationSuspended = true;
        }
        , resumeValidation: function () {
            ///<summary>Re-enables validation code and forces a validation event to run</summary>
            this._validationSuspended = false;
            this.validate();
        }

		, _initializeValidationListeners: function () {
		    var i, n, listener;
		    for (i = 0, n = validationListeners.length; i < n; ++i) {
		        listener = validationListeners[i];

		        if (listener.canListen(this)) {
		            this._listeners = this._listeners || [];
		            this._listeners.push(listener.listen(this));
		        }
		    }
		}

        , getValidationListener: function (type) {
            var listener;

            $.each(this._listeners, function () {
                if (this instanceof type) {
                    listener = this;
                    return false; // break;
                }
            });

            return listener;
        }
		
		, dispose: function () {
		    privateMethods.tearDownValidationListeners.call(this);

		    return this._prototype_dispose.apply(this, arguments);
		}
    };

    var privateMethods = {
        tearDownValidationListeners: function () {
            $.each(this._listeners || [], function () {
                this.dispose();
            });
        }

		, ruleCallback: function (result, passId, traversalHistory) {
		    if (this._passId !== passId) {
		        return;
		    }

		    this._pendingRules--;

		    // if result.message is not an array, turn it into an array
		    var messages;
		    if (Object.prototype.toString.call(result.message) !== '[object Array]') {
		        messages = [result.message];
		    } else {
		        messages = result.message;
		    }

		    var self = this;
		    if (result.alwaysShow) {
		        $.each(messages, function (index, message) {
		            self._backList.push({ text: message });
		        });
		    } else if (!result.valid) {
		        $.each(messages, function (index, message) {
		            if (message && message !== '') {
		                self._backList.push({ text: message });
		            }
		        });
		        this._computedValidity = false;
		    }

		    privateMethods.afterRulesRan.call(this, traversalHistory);
		}
		, afterRulesRan: function (traversalHistory) {
		    if (this._pendingRules === 0) {
		        this._backList = $.map(this._backList, function (e, i) {
		            if (!e.isAsync) return e;
		        });

		        this._valid(this._computedValidity);

		        $.each(this._callouts || [], $.proxy(function (index, callout) {
		            var calloutInHistory = false;
		            $.each(traversalHistory, function (index, historyObject) {
		                if (callout === historyObject) {
		                    calloutInHistory = true;
		                    return false; // break
		                }
		            });

		            if (!calloutInHistory) {
		                callout.validate($.merge(traversalHistory, [callout]));
		            }
		        }, this));

		        privateMethods.trigger_validationApplied.call(this);
		    }
		}
		, trigger_validationApplied: function () {
		    $(this).trigger('validationApplied', {
		        messages: this._backList
				, isValid: this._computedValidity
		        /* possibly others */
		    });
		}
    }

    var validationListeners = [];
    vsc.Component.registerValidationListener = function (listener) {
        ///<summary>
        /// Adds a Validation Listener to the validation listener registry.
        /// Validation Listeners perform an action after every execution of the validate function
        /// Typically, listeners modify the DOM to reflect the invalid state of a component.
        ///</summary>
        ///<param name="listener">
        /// The Validation Listener to add to the registry
        /// The listener is a type with the following static methods:
        ///  * canListen(component): determines if the listener is compatible with the given component
        ///  * listen(component): hook unto the validation infrastructure to receive notifications on validation changes
        ///</param>
        validationListeners.push(listener);
    }

    // Validation Rules
    var ValidationRules = {};

    ValidationRules.Regex = function (regex, message) {
        this.validate = function (text) {
            return {
                message: message
				, valid: regex.test(text)
            };
        };
    }

    ValidationRules.Regex.Predefined = {
        Number: function (message) {
            return new ValidationRules.Regex(ValidationRules.Regexes.Number, message);
        }
		, PositiveNumber: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.PositiveNumber, message);
		}
		, Percentage: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.Percentage, message);
		}
		, Date: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.Date, message);
		}
		, Email: function (message) {
		    return new ValidationRules.Regex(ValidationRules.Regexes.Email, message);
		}
    }

    ValidationRules.Regexes = {
        Number: /^\-?([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))$|^\-?([1-9]{1}\d*(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))$|^\(([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{0,})?|[1-9]{1}\d{0,}(\.\d{0,})?|0(\.\d{0,})?|(\.\d{0,}))\)$/
		, PositiveNumber: /^([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{1,})?|[1-9]{1}\d{0,}(\.\d{1,})?|0(\.\d{1,})?|(\.\d{1,}))$|^([1-9]{1}\d*(\,\d{3})*(\.\d{1,})?|[1-9]{1}\d{0,}(\.\d{1,})?|0(\.\d{1,})?|(\.\d{1,}))$|^\(([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{1,})?|[1-9]{1}\d{0,}(\.\d{1,})?|0(\.\d{1,})?|(\.\d{1,}))\)$/
		, Percentage: /^(100|100\.0*)\%?$|^([1-9]{1}[0-9]{1}(\.\d{0,})?\%?|[1-9]{1}(\.\d{0,})?\%?|0(\.\d{0,})?\%?|(\.\d{0,}))\%?$|^([1-9]{1,2}(\.\d{0,})?\%?|[1-9]{1}(\.\d{1,})?\%?|0(\.\d{0,})?\%?|(\.\d{0,}))$|^([1-9]{1}\d{0,1}(\.\d{0,})?\%?|0(\.\d{0,})?\%?|(\.\d{0,}))$/
		, Date: /^(?=\d)(?:(?:(?:(?:(?:0?[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0?[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})|(?:0?2(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))|(?:(?:0?[1-9])|(?:1[0-2]))(\/|-|\.)(?:0?[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2}))($|\ (?=\d)))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\ [AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/
		, Email: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
    }

    vsc.ValidationRules = ValidationRules;

})(jQuery);

(function ($, undefined) {
    // The HintBox validation listener will successfully bind unto any component which has 
    // validation enabled *and* exposes the following interface:
    // * hasInputFocus
    // * validationTarget
    // * focus event
    // * blur event	

    // To optimize DOM usage, the HintBox validation listener shares an instance of the
    // hint box and hint list components
    var sharedHintBox,
		sharedHintList,
		hintBoxVisible = false;

    var HintBoxValidationListener = function (component) {
        if (arguments.length === 0) { return; }

        this.onValidationApplied$proxy = $.proxy(this.onValidationApplied, this);
        this.onComponentFocus$proxy = $.proxy(this.onComponentFocus, this);
        this.onComponentBlur$proxy = $.proxy(this.onComponentBlur, this);
        this.onCapturedMouseDown$proxy = $.proxy(this.onCapturedMouseDown, this);

        $(component)
			.bind('validationApplied', this.onValidationApplied$proxy)
			.bind('focus', this.onComponentFocus$proxy)
			.bind('blur', this.onComponentBlur$proxy);

        this._component = null;
        this._validationState = {
            messages: []
			, isValid: true
        };
    }
    HintBoxValidationListener.canListen = function (component) {
        if (component._options.validationListeners.indexOf('hintbox') !== -1 && // the component *wants* the hint-list
			$.isFunction(component.validationTarget)) { // and the component implements the IHintBoxListenerSource interface

            return true;
        } else {
            return false;
        }
    }
    HintBoxValidationListener.listen = function (component) {
        return new HintBoxValidationListener(component);
    }

    HintBoxValidationListener.prototype = {
        /* BEGIN Event Handlers */

        onValidationApplied: function HintBoxValidationListener$onValidationApplied(e, args) {
            this._component = e.target;
            this._validationState = args;

            this.setHintBoxVisibility();
        }

		, onComponentFocus: function HintBoxValidationListener$onComponentFocus(e) {
		    if (e.target._options.validates) {
		        if (!e.target.ranValidation()) {
		            e.target.validate();
		        } else {
		            this._component = e.target;
		            this.setHintBoxVisibility();
		        }
		    }
		}
		, onComponentBlur: function HintBoxValidationListener$onComponentBlur(e) {
		    if (e.target._options.validates) {
		        this.hideHintBox();
		    }
		}
		, onCapturedMouseDown: function HintBoxValidationListener$onCapturedMouseDown(e) {
		    var validationTarget = this._component.validationTarget();
		    if (validationTarget && e.originalTarget === validationTarget[0]) return;

		    this.hideHintBox();
		}

        /* END Event Handlers */

		, setHintBoxVisibility: function HintBoxValidationListener$setHintBoxVisibility(component) {
		    if (this._component && this._component.hasInputFocus() && (this._validationState.messages || []).length > 0) {
		        this.showHintBox();
		    } else {
		        this.hideHintBox();
		    }
		}

        , showHintBox: function HintBoxValidationListener$showHintBox() {
            var target = this._component ? this._component.validationTarget() : null;

            if (target) {
                this.hintList().dataSource(this._validationState.messages);
                // set the color
                if (this._validationState.messages.length > 0) {
                    if (this._component.valid()) {
                        this.hintBox().element().addClass('infobox');
                    } else {
                        this.hintBox().element().removeClass('infobox');
                    }
                }
            }

            if (!hintBoxVisible) {
                hintBoxVisible = true;

                this.hintBox().show(target,
                    this._component._options.hintBoxOrientation || 'bottom right',
                    this._component._options.hintBoxDirection || 'down right');

                captureEvent('mousedown', this._component.element(), this.onCapturedMouseDown$proxy);
            }
        }
        , hideHintBox: function HintBoxValidationListener$hideHintBox() {
            if (hintBoxVisible) {
                hintBoxVisible = false;

                this.hintBox().hide();

                releaseEvent('mousedown');
            }
        }

        , hintList: function HintBoxValidationListener$hintList() {
            if (!sharedHintList) {
                sharedHintList = Vastardis.UI.Components.Component.create('/Components/List.component', { cssClass: 'hintlist' });
                this.hintBox().addChild(sharedHintList);
            }
            return sharedHintList;
        }
        , hintBox: function HintBoxValidationListener$hintBox() {
            if (!sharedHintBox) {
                sharedHintBox = Vastardis.UI.Components.Component.create('/Components/HintBox.component');
                sharedHintBox.render($(document.body));
            }
            return sharedHintBox;
        }

		, dispose: function HintBoxValidationListener$dispose(component) {
		    $(component)
				.unbind('validationApplied', this.onValidationApplied$proxy)
				.unbind('focus', this.onComponentFocus$proxy)
				.unbind('blur', this.onComponentBlur$proxy);
		}
    };
    HintBoxValidationListener.prototype.constructor = HintBoxValidationListener;

    $.extend(true, window, { Vastardis: { UI: { Components: { ValidationListeners: { HintBoxValidationListener: HintBoxValidationListener}}}} });
    Vastardis.UI.Components.Component.registerValidationListener(HintBoxValidationListener);
})(jQuery);
/* The MIT License

Copyright (c) 2011 Vastardis Capital Services, http://www.vastcap.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function ($, undefined) {
    var zManager = function (options) {
        ///<summary>
        /// This object maintains an ordered list of DOM elements and ensures that they are ordered
        /// back-to-front in the browser's z-ordering. The list is live, which means that any modification to the list
        /// results in an update to the browser's DOM.
        ///</summary>
        this._list = [];
        this._options = $.extend(zManager.defaultOptions, options);
    }
    zManager.defaultOptions = {
        ///<summary>
        /// The value to start the z-index from. 
        ///</summary>
        basis: 1
    };
    zManager.prototype = {
        add: function zManager$add(element, index) {
            ///<summary>
            /// Adds an element to the managed z-index list. Once managed, an element is guaranteed to have a z-index
            /// larger than its predecessor and smaller than its successor. If the element is already managed
            /// the element is moved to its new location in the z-index list. 
            ///</summary>
            ///<param name="element">The element to insert into the managed z-index list.</param>
            ///<param name="index" optional="true">At which layer to insert the element. If omitted, the element will be added as the top-most layer.</param>
            var existingIndex = this._find(element), entry;

            if (existingIndex !== null) {
                // if it already exists, splice it out
                entry = this._list.splice(existingIndex, 1)[0];
            }

            if (!entry) {
                entry = {
                    element: element
                    , layer: 0
                    , unmanagedIndex: $(element).css('z-index') // remember what the unmanaged value of z-index was
                };
            } else {
                entry.layer = 0;
            }

            if (typeof index === 'undefined') {
                this._list.push(entry);
                this._updateZIndexes(this._list.length - 1);
            } else {
                this._list.splice(index, 0, entry);
                this._updateZIndexes(index);
            }
        }
		, remove: function zManager$remove(element) {
		    ///<summary>
		    /// Removes an element from the managed z-index list.
		    ///</summary>
		    var existingIndex = this._find(element);

		    if (existingIndex !== null) {
		        // if it already exists, splice it out
		        $(element).css('z-index', this._list[existingIndex].unmanagedIndex); // recall unmanaged value of z-index
		        this._list.splice(existingIndex, 1);
		    }
		}

		, bringToFront: function zManager$bringToFront(element) {
		    ///<summary>
		    /// Brings an element to the front of the z-index list, ensuring it is the top-most object in the z stack.
		    /// This is just a short form for this.add(element);
		    ///</summary>
		    this.add(element);
		}
		, moveToBack: function zManager$moveToBack(element) {
		    ///<summary>
		    /// Moves an element to the back of the z-index list, ensuring it is the bottom-most object in the z stack.
		    /// This is just a short form for this.add(element, 0);
            ///</summary>
		    this.add(element, 0);
		}

		, maxZIndex: function zManager$maxZIndex() {
		    ///<summary>
		    /// Returns the maximum z-index value issued by the manager.
		    ///</summary>
		    return this._list[this._list.length - 1].layer;
		}

        , _find: function zManager$_find(element) {
            var existingIndex = null;

            $.each(this._list, function (i, e) {
                if (e.element === element) {
                    existingIndex = i;
                    return false;
                }
            });

            return existingIndex;
        }

		, _updateZIndexes: function zManager$_updateZIndexes(index) {
		    var curr, prev, next,
                first = true;

		    curr = this._list[index];
		    if (index !== 0) {
		        prev = this._list[index - 1];
		    } else {
		        prev = { layer: this._options.basis - 1 };
		    }

		    if (index !== this._list.length - 1) {
		        next = this._list[index + 1];
		    }

		    while (curr) {
		        if (curr.layer <= prev.layer || first) {
		            // curr is behind prev, even though it should be ahead
		            curr.layer = prev.layer + 1;
		            $(curr.element).css('z-index', curr.layer);

		            first = false;
		        }

		        if (next && next.layer > curr.layer) {
		            // next is ahead of curr's new value, so the rest of the list is 
		            // ordered correctly
		            break;
		        }

		        prev = curr;
		        curr = next;

		        index++;

		        if (index !== this._list.length - 1) {
		            next = this._list[index + 1];
		        } else {
		            next = null;
		        }
		    }
		}
    };

    // The z manager is a singleton
    window.zManager = new zManager();
})(jQuery);

