import * as vscode from "vscode";
import { analyzeProject } from "./analyzer";
import { createWebviewPanel } from "./webview";

export function activate(context: vscode.ExtensionContext) {
  console.log("Unused Components Tracker is now active!");

  let disposable = vscode.commands.registerCommand(
    "unused-component-tracker.analyze",
    async () => {
      console.log("Analyze command triggered");
      try {
        // Analyze the project
        const results = await analyzeProject();
        console.log(results);

        // Create Webview to display results
        createWebviewPanel(context, results);
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Error analyzing project: ${error.message}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log("Unused Components Tracker is now deactivated");
}
