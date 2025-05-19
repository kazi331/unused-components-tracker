import traverse from "@babel/traverse";
import * as fs from "fs/promises";
import * as path from "path";
import { ImportDeclaration, Project, SourceFile } from "ts-morph";
import * as vscode from "vscode";
import {
  AnalysisResult,
  UnusedComponent,
  UnusedFile,
  UnusedUtility,
} from "./types";
import { getProjectFiles, getTsMorphProject, parseFileContent } from "./utils";

export async function analyzeProject(): Promise<AnalysisResult> {
  console.log("Starting project analysis...");
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    console.error("No workspace folder found");
    throw new Error("No workspace folder found");
  }
  console.log("Workspace root:", workspaceRoot);

  const results: AnalysisResult = [];
  console.log("Calling getProjectFiles...");
  const files = await getProjectFiles(workspaceRoot);
  console.log("Files found:", files.length, files);

  console.log("Calling getTsMorphProject...");
  const project = await getTsMorphProject(workspaceRoot);
  console.log("ts-morph project created");

  // Step 1: Find unused files
  console.log("Finding unused files...");
  const unusedFiles = await findUnusedFiles(files, project);
  console.log("Unused files found:", unusedFiles);
  results.push(...unusedFiles);

  // Step 2: Find unused components and utilities within files
  console.log("Analyzing files for unused components and utilities...");
  for (const file of files) {
    console.log("Analyzing file:", file);
    const sourceFile = project.getSourceFile(file);
    if (!sourceFile) {
      console.log("Skipping file, not found in ts-morph project:", file);
      continue;
    }

    const content = await fs.readFile(file, "utf-8");
    const ast = parseFileContent(content, file);
    const unusedComponents = findUnusedComponents(ast, sourceFile, file);
    const unusedUtilities = findUnusedUtilities(ast, sourceFile, file);

    console.log("Unused components in", file, ":", unusedComponents);
    console.log("Unused utilities in", file, ":", unusedUtilities);

    results.push(...unusedComponents, ...unusedUtilities);
  }

  // Show summary message
  const unusedFilesCount = results.filter(
    (r) => r.type === "unused_file"
  ).length;
  const unusedComponentsCount = results.filter(
    (r) => r.type === "unused_component"
  ).length;
  const unusedUtilitiesCount = results.filter(
    (r) => r.type === "unused_utility"
  ).length;

  vscode.window.showInformationMessage(
    `Analysis complete! Found: ${unusedFilesCount} unused files, ${unusedComponentsCount} unused components, and ${unusedUtilitiesCount} unused utilities.`
  );

  console.log("Final analysis results:", results);
  return results;
}

async function findUnusedFiles(
  files: string[],
  project: Project
): Promise<UnusedFile[]> {
  const unused: UnusedFile[] = [];
  const imports = new Set<string>();

  console.log("Finding unused files...");
  for (const file of files) {
    const sourceFile = project.getSourceFile(file);
    if (!sourceFile) continue;

    sourceFile.getImportDeclarations().forEach((imp: ImportDeclaration) => {
      const modulePath = imp.getModuleSpecifierValue();
      if (modulePath.startsWith(".")) {
        const resolvedPath = path.resolve(path.dirname(file), modulePath);
        imports.add(resolvedPath);
      }
    });
  }

  for (const file of files) {
    const normalizedPath = path.resolve(file);
    if (!imports.has(normalizedPath.replace(/\.[jt]sx?$/, ""))) {
      const content = await fs.readFile(file, "utf-8");
      unused.push({
        type: "unused_file",
        path: file,
        content,
      });
    }
  }
  return unused;
}

function findUnusedComponents(
  ast: any,
  sourceFile: SourceFile,
  filePath: string
): UnusedComponent[] {
  const unused: UnusedComponent[] = [];
  const componentNames = new Set<string>();
  const usedComponents = new Set<string>();

  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id && isComponentName(path.node.id.name)) {
        componentNames.add(path.node.id.name);
      }
    },
    VariableDeclarator(path) {
      if (
        path.node.id.type === "Identifier" &&
        isComponentName(path.node.id.name) &&
        (path.node.init?.type === "ArrowFunctionExpression" ||
          path.node.init?.type === "FunctionExpression")
      ) {
        componentNames.add(path.node.id.name);
      }
    },
    JSXElement(path) {
      const openingElement = path.node.openingElement;
      if (openingElement.name.type === "JSXIdentifier") {
        usedComponents.add(openingElement.name.name);
      }
    },
  });

  componentNames.forEach((name) => {
    if (!usedComponents.has(name)) {
      const declaration =
        sourceFile.getFunction(name) || sourceFile.getVariableDeclaration(name);
      if (declaration) {
        const startLine = declaration.getStartLineNumber();
        const endLine = declaration.getEndLineNumber();
        const code = declaration.getText();
        unused.push({
          type: "unused_component",
          filePath,
          componentName: name,
          code,
          startLine,
          endLine,
        });
      }
    }
  });

  return unused;
}

function findUnusedUtilities(
  ast: any,
  sourceFile: SourceFile,
  filePath: string
): UnusedUtility[] {
  const unused: UnusedUtility[] = [];
  const utilityNames = new Set<string>();
  const usedUtilities = new Set<string>();

  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id && !isComponentName(path.node.id.name)) {
        utilityNames.add(path.node.id.name);
      }
    },
    VariableDeclarator(path) {
      if (
        path.node.id.type === "Identifier" &&
        !isComponentName(path.node.id.name) &&
        (path.node.init?.type === "ArrowFunctionExpression" ||
          path.node.init?.type === "FunctionExpression")
      ) {
        utilityNames.add(path.node.id.name);
      }
    },
    CallExpression(path) {
      if (path.node.callee.type === "Identifier") {
        usedUtilities.add(path.node.callee.name);
      }
    },
  });

  utilityNames.forEach((name) => {
    if (!usedUtilities.has(name)) {
      const declaration =
        sourceFile.getFunction(name) || sourceFile.getVariableDeclaration(name);
      if (declaration && declaration.isExported()) {
        const startLine = declaration.getStartLineNumber();
        const endLine = declaration.getEndLineNumber();
        const code = declaration.getText();
        unused.push({
          type: "unused_utility",
          filePath,
          functionName: name,
          code,
          startLine,
          endLine,
        });
      }
    }
  });

  return unused;
}

function isComponentName(name: string | undefined): boolean {
  return !!name && /^[A-Z][a-zA-Z0-9]*$/.test(name);
}
