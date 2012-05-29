using System.Collections.Generic;

namespace Doodads.Builder
{
    internal class Doodad
    {
        private Dictionary<string, string> templates;
        private List<string> stylesheets;

        public string Behaviour
        {
            get;
            set;
        }

        public string BaseTemplate
        {
            get
            {
                if (this.Templates.ContainsKey(string.Empty))
                {
                    return this.Templates[string.Empty];
                }
                else
                {
                    return null;
                }
            }
            set
            {
                this.Templates.Add(string.Empty, value);
            }
        }

        public Dictionary<string, string> Templates
        {
            get
            {
                if (this.templates == null)
                {
                    this.templates = new Dictionary<string, string>();
                }
                return this.templates;
            }
        }

        public List<string> Stylesheets
        {
            get
            {
                if (this.stylesheets == null)
                {
                    this.stylesheets = new List<string>();
                }
                return this.stylesheets;
            }
        }
    }
}
