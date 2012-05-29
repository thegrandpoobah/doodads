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
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Web;

namespace Doodads.Builder
{
    public class BuilderHttpHandler : IHttpHandler
    {
        public bool IsReusable
        {
            // Return false in case your Managed Handler cannot be reused for another request.
            // Usually this would be false in case you have some state information preserved per request.
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            try
            {
                Builder builder = new Builder(HttpContext.Current.Server.MapPath(context.Request.Path));
#if DEBUG
                builder.DebugOutput = true;
#endif

                string output = builder.Render();
#if DEBUG
                output += string.Format("\n//@ sourceURL={0}\n", context.Request.Url.AbsoluteUri);
#endif

                if (!string.IsNullOrEmpty(builder.DoodadDescriptor.Behaviour)) {
                    context.Response.AddFileDependency(builder.DoodadDescriptor.Behaviour);
                }

                context.Response.AddFileDependencies(builder.DoodadDescriptor.Stylesheets.ToArray());

                foreach (KeyValuePair<string, string> pair in builder.DoodadDescriptor.Templates) {
                    context.Response.AddFileDependency(pair.Value);
                }

                context.Response.Cache.SetCacheability(HttpCacheability.Public);
                context.Response.Cache.SetETagFromFileDependencies();
                context.Response.Cache.SetLastModifiedFromFileDependencies();
                context.Response.ContentType = "text/javascript";
                context.Response.Write(output);
            }
            catch (DirectoryNotFoundException e)
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.Output.WriteLine("No doodad exists at the specified URL \"{0}\".");
#if DEBUG
                throw e;
#endif
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
