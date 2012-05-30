using System.IO;
using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;

namespace Doodads.Builder
{
    public class BuildDoodad : Task
    {
        public override bool Execute()
        {
            foreach (ITaskItem taskItem in this.SourceDirectories)
            {
                this.Log.LogMessage(MessageImportance.Low, "Building {0}", taskItem.ItemSpec);

                string inputPath = Path.ChangeExtension(taskItem.ItemSpec, ".doodad");
                Builder builder = new Builder(inputPath)
                {
                    DebugOutput = this.DebugMode
                };

                string outputPath;
                if (string.IsNullOrEmpty(this.OutputDirectory))
                {
                    outputPath = inputPath;
                }
                else
                {
                    outputPath = Path.Combine(this.OutputDirectory, Path.GetFileName(inputPath));
                }

                using (FileStream fs = new FileStream(outputPath, FileMode.Create))
                {
                    using (StreamWriter sw = new StreamWriter(fs))
                    {
                        sw.Write(builder.Render());
                    }
                }
            }

            return true;
        }

        [Required]
        public ITaskItem[] SourceDirectories
        {
            get;
            set;
        }

        public string OutputDirectory
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
