using System.IO;
using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;

namespace Doodads.Builder
{
    public class BuilderTask : Task
    {
        public override bool Execute()
        {
            Builder builder = new Builder(this.Path)
            {
                DebugOutput = this.DebugMode
            };

            using (FileStream fs = new FileStream(this.Path, FileMode.Create))
            {
                using (StreamWriter sw = new StreamWriter(fs))
                {
                    sw.Write(builder.Render());
                }
            }

            return true;
        }

        [Required]
        public string Path
        {
            get;
            set;
        }

        public bool DebugMode
        {
            get
            {
                return this.debugMode;
            }
            set
            {
                this.debugMode = value;
            }
        }
        private bool debugMode = false;
    }
}
