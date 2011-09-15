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
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using System.Xml.Serialization;
using System.Web.SessionState;

namespace Vastardis.UI.Components
{
    public class ComponentBuilder : IHttpHandler, IReadOnlySessionState
    {
        private readonly static componentImport[] ValidationImports = new componentImport[] {  
            new componentImport() { path = "~/Components/HintBox.component" }, 
            new componentImport() { path = "~/JavaScript/ComponentLibrary/Validator.js" }
        };

        private readonly static componentStylesheet[] ValidationStylesheets = new componentStylesheet[] {  
            new componentStylesheet() { path = "~/Style/CSS/ComponentLibrary/HintList.css" }, 
        };

        public bool IsReusable
        {
            // Return false in case your Managed Handler cannot be reused for another request.
            // Usually this would be false in case you have some state information preserved per request.
            get { return true; }
        }

        private component CreateComponentFromXml(string path)
        {
            using (StreamReader str = new StreamReader(path))
            {
                XmlSerializer serializer = new XmlSerializer(typeof(component));
                return (component)serializer.Deserialize(str);
            }
        }

        public string GetComponentPath(string path)
        {
            string mappedPath = HttpContext.Current.Server.MapPath(path);
            string directory = Path.GetDirectoryName(mappedPath);
            string filename = Path.GetFileNameWithoutExtension(mappedPath);

            string result = string.Format("{0}\\{1}\\{1}.xml", directory, filename);
            if (!File.Exists(result))
            {
                result = string.Format("{0}\\{1}.xml", directory, filename);
            }
            return result;
        }

        public void ProcessRequest(HttpContext context)
        {
            try
            {
                if (!File.Exists(this.GetComponentPath(context.Request.Path)))
                {
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    context.Response.Output.WriteLine(string.Format("Component descriptor \"{0}\" not found.", Path.ChangeExtension(context.Request.Path, "xml")));
                    return;
                }

                component c = this.CreateComponentFromXml(this.GetComponentPath(context.Request.Path));

                if (c == null)
                {
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    return;
                }
                else
                {
                    context.Response.AddFileDependency(this.GetComponentPath(context.Request.Path));
                }

                JavaScriptSerializer serializer = new JavaScriptSerializer();
                StringBuilder output = new StringBuilder();

                if (c.validates)
                {
                    if (c.imports == null)
                    {
                        c.imports = ValidationImports;
                    }
                    else
                    {
                        // Add Validation Imports
                        componentImport[] imports = c.imports;
                        c.imports = new componentImport[imports.Length + ValidationImports.Length];
                        imports.CopyTo(c.imports, 0);
                        Array.Copy(ValidationImports, 0, c.imports, imports.Length, ValidationImports.Length);
                    }

                    if (c.stylesheets == null)
                    {
                        c.stylesheets = ValidationStylesheets;
                    }
                    else
                    {
                        // Add Validation StyleSheets
                        componentStylesheet[] stylesheets = c.stylesheets ?? new componentStylesheet[0];
                        c.stylesheets = new componentStylesheet[stylesheets.Length + ValidationStylesheets.Length];
                        stylesheets.CopyTo(c.stylesheets, 0);
                        Array.Copy(ValidationStylesheets, 0, c.stylesheets, stylesheets.Length, ValidationStylesheets.Length);
                    }
                }

                if (c.imports != null)
                {
#if DEBUG
                    output.AppendLine("/* Dependencies */");
#endif

                    foreach (componentImport jsDep in c.imports)
                    {
                        output.AppendFormat("Vastardis.UI.Components.ComponentFactory2._loadDependency({0});\n", serializer.Serialize(VirtualPathUtility.ToAbsolute(jsDep.path)));
                    }
                }

                output.AppendLine("(function($, undefined) {");

                output.AppendFormat("var cf = Vastardis.UI.Components.ComponentFactory2, absUrl = cf.canonicalize({0});\n", serializer.Serialize(context.Request.Path));
                output.AppendLine("if (cf._loadedComponents[absUrl]) { return; }");
                output.AppendFormat("var base = {0}.prototype;\n", c.inheritsFrom);
                if (c.behaviour == null)
                {
                    output.AppendLine("function getComponentType() { return {}; }");
                }
                else
                {
                    string serverPath = context.Server.MapPath(c.behaviour.path);
                    if (!File.Exists(serverPath))
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                        context.Response.Output.WriteLine(string.Format("Component behaviour \"{0}\" not found.", c.behaviour.path));
                        return;
                    }

                    context.Response.AddFileDependency(serverPath);
                    output.AppendLine("var oldGetComponentType = window.getComponentType;");
#if DEBUG
                    output.AppendFormat("/* BEGIN Behaviour file {0} */\n", c.behaviour.path);
#endif
                    output.AppendLine(File.ReadAllText(serverPath));
#if DEBUG
                    output.AppendFormat("/* END Behaviour file {0} */\n", c.behaviour.path);
#endif
                    output.AppendLine("var getComponentType = window.getComponentType;");
                    output.AppendLine("window.getComponentType = oldGetComponentType;");
                }

                output.AppendLine("var type = getComponentType();");

                output.AppendLine("var new_component = function(options, defaultOptions) {");
                output.AppendLine("if (arguments.length === 0) { return; }");
                output.AppendLine("base.constructor.call(this, $.extend({}, defaultOptions, options), new_component.defaultOptions);");
                output.AppendLine("type.apply(this, []);");
                output.AppendLine("}");
                output.AppendLine("new_component.prototype = type.prototype;");
                output.AppendLine("for (var key in type) {");
                output.AppendLine("if (type.hasOwnProperty(key)) {");
                output.AppendLine("new_component[key] = type[key];");
                output.AppendLine("}");
                output.AppendLine("}");
                output.AppendLine("new_component.defaultOptions = new_component.defaultOptions || {};");

                if (c.templates != null)
                {
                    string baseTemplate;
                    if (c.templates.@base == null || string.IsNullOrEmpty(c.templates.@base.path))
                    {
                        baseTemplate = "<div />";
                    }
                    else
                    {
                        string baseServerPath = context.Server.MapPath(c.templates.@base.path);
                        if (!File.Exists(baseServerPath))
                        {
                            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                            context.Response.Output.WriteLine(string.Format("Base template \"{0}\" not found.", c.templates.@base.path));
                            return;
                        }
                        else
                        {
                            context.Response.AddFileDependency(baseServerPath);
                            baseTemplate = File.ReadAllText(baseServerPath);
                        }
                    }

                    output.Append("new_component.defaultOptions.templates = $.extend(");
                    if (c.inheritsTemplates)
                    {
                        output.Append("{}, base.constructor.defaultOptions.templates,");
                    }
                    output.AppendFormat("new_component.defaultOptions.templates, {{base: {0}", serializer.Serialize(baseTemplate));

                    if (c.templates.partial != null && c.templates.partial.Length > 0)
                    {
                        foreach (componentTemplatesPartial partial in c.templates.partial)
                        {
                            string path = context.Server.MapPath(partial.path);
                            if (!File.Exists(path))
                            {
                                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                                context.Response.Output.WriteLine(string.Format("Partial template \"{0}\" with path \"{1}\" not found.", partial.name, partial.path));
                                return;
                            }
                            context.Response.AddFileDependency(path);
                            output.AppendFormat(", {0}: {1}\n", serializer.Serialize(partial.name),
                                serializer.Serialize(File.ReadAllText(path)));
                        }
                    }
                    output.AppendLine("});");
                }
                if (c.validates)
                {
                    output.Append("Vastardis.UI.Components.Component.addValidationAPI(new_component);\n");
                }

                output.AppendLine("type.prototype.constructor = new_component;\n");


                output.Append("$.extend(true, window, {}, ");
                string[] namespaceSegments = c.type.Split(new char[] { '.' });
                foreach (string namespaceSegment in namespaceSegments)
                {
                    output.AppendFormat("{{ {0} : ", namespaceSegment);
                }

                output.Append("new_component");

                output.Append("}");

                for (var i = 0; i < namespaceSegments.Length - 1; i++)
                {
                    output.Append("}");
                }
                output.AppendLine(");");

                if (c.stylesheets != null)
                {
#if DEBUG
                    output.AppendLine("/* CSS */");
#endif
                    foreach (componentStylesheet cssDep in c.stylesheets)
                    {
                        string path = context.Server.MapPath(cssDep.path);
                        if (File.Exists(path))
                        {
                            context.Response.AddFileDependency(path);
                            string serialized = serializer.Serialize(File.ReadAllText(path)).Trim(new char[] { '"' });
#if DEBUG
                            output.AppendFormat("cf._addStylesheet('{0}', '{1}'); // {2} \n", VirtualPathUtility.ToAbsolute(cssDep.path), serialized, cssDep.path);
#else
                            output.AppendFormat("cf._addStylesheet('{0}', '{1}');\n", VirtualPathUtility.ToAbsolute(cssDep.path), serialized);
#endif
                        }
#if DEBUG
                        else
                        {
                            output.AppendFormat("/* WARNING: Stylesheet \"{0}\" not found. */", cssDep.path);
                        }
#endif
                    }
                }

                output.AppendFormat("cf._prepopulateResolutionCache(); cf._resolutionCache[absUrl] = true;\ncf._loadedComponents[absUrl] = new_component;\n");
                output.AppendLine("})(jQuery);");

#if DEBUG
                output.AppendFormat("\n//@ sourceURL={0}\n", context.Request.Path);
#endif
                context.Response.Cache.SetCacheability(HttpCacheability.Public);
                context.Response.Cache.SetETagFromFileDependencies();
                context.Response.Cache.SetLastModifiedFromFileDependencies();
                context.Response.ContentType = "text/javascript";
                context.Response.Write(output.ToString());
            }
            catch (Exception e)
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.Output.WriteLine(string.Format("Exception of type \"{0}\" was thrown processing the request.", e.GetType().ToString()));
#if DEBUG
                throw e;
#endif
            }
        }
    }
}
