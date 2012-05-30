using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;

namespace Doodads.Builder
{
    internal class Builder
    {
        private string path;
        private Doodad doodadDescriptor;

        public Builder(string path)
        {
            this.path = path;
            this.DebugOutput = false;
        }

        public string Render()
        {
            if (!Directory.Exists(this.URI))
            {
                throw new DirectoryNotFoundException(this.URI);
            }

            Doodad c = this.DoodadDescriptor;

            JavaScriptSerializer serializer = new JavaScriptSerializer();
            StringBuilder output = new StringBuilder();

            output.AppendLine("(function(definition) {");
            output.AppendLine("doodads.setup.definition = definition;\n");
            if (string.IsNullOrEmpty(c.Behaviour))
            {
                output.AppendLine("doodads.setup.defaultAction();");
            }
            else
            {
                if (this.DebugOutput)
                {
                    output.AppendFormat("/* BEGIN Behaviour file {0} */\n", c.Behaviour);
                }
                output.AppendLine(File.ReadAllText(c.Behaviour));
                if (this.DebugOutput)
                {
                    output.AppendFormat("/* END Behaviour file {0} */\n", c.Behaviour);
                }
            }

            output.AppendLine("})({");

            List<string> fields = new List<string>();

            if (c.Templates.Count != 0)
            {
                StringBuilder templateOutput = new StringBuilder();

                templateOutput.AppendLine("templates: {");

                string baseTemplate;
                if (string.IsNullOrEmpty(c.BaseTemplate))
                {
                    baseTemplate = "<div />";
                }
                else
                {
                    baseTemplate = File.ReadAllText(c.BaseTemplate);
                }

                templateOutput.AppendFormat("base: {0}", serializer.Serialize(baseTemplate));

                foreach (KeyValuePair<string, string> pair in c.Templates)
                {
                    if (string.IsNullOrEmpty(pair.Key))
                    {
                        continue;
                    }

                    templateOutput.AppendFormat(", {0}: {1}\n", serializer.Serialize(pair.Key),
                        serializer.Serialize(File.ReadAllText(pair.Value)));
                }

                templateOutput.AppendLine("}");

                fields.Add(templateOutput.ToString());
            }

            if (c.Stylesheets.Count > 0)
            {
                List<string> styleSet = new List<string>();
                foreach (string path in c.Stylesheets)
                {
                    styleSet.Add(string.Format("{0}: {1}", serializer.Serialize(this.CalculateMD5Hash(path)), serializer.Serialize(File.ReadAllText(path))));
                }
                fields.Add(string.Format("stylesheets: {{ {0} }}", string.Join(",", styleSet.ToArray())));
            }

            output.Append(string.Join(",", fields.ToArray()));
            output.AppendLine("});");

            return output.ToString();
        }

        private string CalculateMD5Hash(string input)
        {
            // step 1, calculate MD5 hash from input
            MD5 md5 = MD5.Create();
            byte[] inputBytes = Encoding.ASCII.GetBytes(input);
            byte[] hash = md5.ComputeHash(inputBytes);

            // step 2, convert byte array to hex string
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < hash.Length; i++)
            {
                sb.Append(hash[i].ToString("X2"));
            }
            return sb.ToString();
        }

        private Doodad CreateDoodadFromFileSystem()
        {
            Doodad c = new Doodad();
            foreach (string path in this.EnumerateFiles())
            {
                string ext = Path.GetExtension(path);
                string filename;

                if (ext.Equals(".html"))
                {
                    filename = Path.GetFileNameWithoutExtension(path);
                    if (filename.IndexOf(".") == -1)
                    {
                        c.BaseTemplate = path;
                    }
                    else
                    {
                        // e.g. Button.{something}.js
                        Match results = Regex.Match(filename + ".html", string.Format("{0}\\.(.*)\\.html", this.Name));

                        c.Templates.Add(results.Groups[1].Value, path);
                    }
                }
                else if (ext.Equals(".js"))
                {
                    c.Behaviour = path;
                }
                else if (ext.Equals(".css"))
                {
                    c.Stylesheets.Add(path);
                }
            }
            return c;
        }

        private IEnumerable<string> EnumerateFiles()
        {
            foreach (string s in Directory.EnumerateFiles(this.URI, string.Format("{0}*.html", this.Name)))
            {
                yield return s;
            }
            foreach (string s in Directory.EnumerateFiles(this.URI, string.Format("{0}*.css", this.Name)))
            {
                yield return s;
            }
            foreach (string s in Directory.EnumerateFiles(this.URI, string.Format("{0}*.js", this.Name)))
            {
                yield return s;
            }
            yield break;
        }

        public Doodad DoodadDescriptor
        {
            get
            {
                if (this.doodadDescriptor == null)
                {
                    this.doodadDescriptor = this.CreateDoodadFromFileSystem();
                }
                return this.doodadDescriptor;
            }
        }

        private string URI
        {
            get
            {
                string withoutExtension = Path.ChangeExtension(this.path, string.Empty);
                withoutExtension = withoutExtension.Remove(withoutExtension.Length-1);

                return withoutExtension;
            }
        }

        private string Name
        {
            get
            {
                return Path.GetFileNameWithoutExtension(this.path);
            }
        }

        public bool DebugOutput
        {
            get;
            set;
        }
    }
}
