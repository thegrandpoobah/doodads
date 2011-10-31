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
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Vastardis.UI.Components
{
    public class ComponentBuilder : IHttpHandler, IReadOnlySessionState
    {
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


                output.AppendLine("(function(definition) {");
                output.AppendFormat("doodads.setup('{0}', definition);\n", context.Request.Path);
                if (c.behaviour == null)
                {
                    output.AppendFormat("doodads.setup('{0}').complete();\n", context.Request.Path);
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
#if DEBUG
                    output.AppendFormat("/* BEGIN Behaviour file {0} */\n", c.behaviour.path);
#endif
                    Regex regex = new Regex("doodads\\s*\\.\\s*setup\\(\\)", RegexOptions.Multiline);
                    string url = regex.Replace(File.ReadAllText(serverPath), string.Format("doodads.setup({0})", serializer.Serialize(context.Request.Path)));
                    output.AppendLine(url);
#if DEBUG
                    output.AppendFormat("/* END Behaviour file {0} */\n", c.behaviour.path);
#endif
                }

                output.AppendLine("})({");

                List<string> fields = new List<string>();

                if (c.inheritsTemplates)
                {
                    fields.Add("inheritsTemplates: true");
                }
                if (c.validates)
                {
                    fields.Add("validates: true");
                }

                if (c.templates != null)
                {
                    StringBuilder templateOutput = new StringBuilder();

                    templateOutput.AppendLine("templates: {");

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

                    templateOutput.AppendFormat("base: {0}", serializer.Serialize(baseTemplate));

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
                            templateOutput.AppendFormat(", {0}: {1}\n", serializer.Serialize(partial.name),
                                serializer.Serialize(File.ReadAllText(path)));
                        }
                    }

                    templateOutput.AppendLine("}");
                    fields.Add(templateOutput.ToString());
                }

                output.Append(string.Join(",", fields.ToArray()));
                output.AppendLine("});");

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
