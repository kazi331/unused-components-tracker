import { parse } from "@babel/parser";
import { existsSync } from "fs";
import { glob } from "glob";
import * as path from "path";
import { Project } from "ts-morph";

export async function getProjectFiles(
  workspaceRoot: string
): Promise<string[]> {
  console.log("Inside getProjectFiles with workspaceRoot:", workspaceRoot);
  const ignorePatterns = ["node_modules/**", "dist/**", "build/**", ".next/**"];
  console.log("Ignore patterns:", ignorePatterns);

  try {
    console.log("Executing glob promise with pattern: **/*.{js,jsx,ts,tsx}");
    const files = await Promise.race([
      glob("**/*.{js,jsx,ts,tsx}", {
        cwd: workspaceRoot,
        ignore: ignorePatterns,
        absolute: true,
      }),
      new Promise<string[]>((_, reject) =>
        setTimeout(
          () => reject(new Error("Glob timed out after 10 seconds")),
          10000
        )
      ),
    ]);
    console.log("Glob promise resolved with files:", files.length, files);
    return files;
  } catch (error: any) {
    console.error("Error in getProjectFiles:", error.message, error.stack);
    throw error; // Ensure the error propagates to the caller
  }
}

export function parseFileContent(content: string, filePath: string) {
  return parse(content, {
    sourceType: "module",
    plugins: [
      "jsx",
      "typescript",
      filePath.endsWith(".jsx") || filePath.endsWith(".tsx") ? "jsx" : null,
    ].filter(Boolean) as any,
  });
}

export async function getTsMorphProject(
  workspaceRoot: string
): Promise<Project> {
  console.log("Inside getTsMorphProject with workspaceRoot:", workspaceRoot);
  const tsConfigPath = path.join(workspaceRoot, "tsconfig.json");
  console.log("Checking for tsconfig at:", tsConfigPath);
  const project = new Project({
    tsConfigFilePath: existsSync(tsConfigPath) ? tsConfigPath : undefined,
    compilerOptions: {
      allowJs: true,
      checkJs: true,
    },
  });
  console.log("ts-morph Project instance created");
  return project;
}
