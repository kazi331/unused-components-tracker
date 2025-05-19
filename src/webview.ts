import { existsSync } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { Project } from "ts-morph";
import * as vscode from "vscode";
import { AnalysisResult } from "./types";
import { getTsMorphProject } from "./utils";

export function createWebviewPanel(
  context: vscode.ExtensionContext,
  results: AnalysisResult
) {
  console.log("Inside createWebviewPanel with results:", results);
  const panel = vscode.window.createWebviewPanel(
    "unusedComponentTracker",
    "Unused Component Tracker",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  console.log("Webview panel instance created");

  panel.webview.html = getWebviewContent(results);
  console.log("Webview HTML set");

  panel.webview.onDidReceiveMessage(
    async (message) => {
      console.log("Received message from Webview:", message);
      if (message.command === "delete") {
        const project = await getTsMorphProject(
          vscode.workspace.workspaceFolders![0].uri.fsPath
        );
        await handleDeletions(message.items, project, message.backupEnabled);
        vscode.window.showInformationMessage("Selected items processed");
        panel.dispose();
      } else if (message.command === "openFile") {
        const uri = vscode.Uri.file(message.path);
        await vscode.window.showTextDocument(uri);
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebviewContent(results: AnalysisResult): string {
  console.log("Generating Webview content with results:", results);
  const categorized = {
    unused_files: results.filter((r) => r.type === "unused_file"),
    unused_components: results.filter((r) => r.type === "unused_component"),
    unused_utilities: results.filter((r) => r.type === "unused_utility"),
  };

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
          h1 { color: #c586c0; margin-bottom: 20px; }
          h2 { color: #9cdcfe; margin-top: 20px; }
          .category { margin-bottom: 20px; }
          .item { margin: 10px 0; padding: 10px; background: #252526; border-radius: 5px; }
          input[type="checkbox"] {  
            appearance: none;
            width: 16px;
            height: 16px;
            background: #333;
            border: 2px solid #569cd6;
            border-radius: 4px;
            cursor: pointer;
            position: relative;
            margin-right: 10px;
          }
          input[type="checkbox"]:checked {
            background: #569cd6;
          }
          input[type="checkbox"]:focus {
            outline: none;
          }
          input[type="checkbox"]:checked::after {
            content: '✓';
            color: white;
            font-size: 12px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          pre { background: #2d2d2d; padding: 10px; border-radius: 5px; color: #d4d4d4; }
          button {
            background: #007acc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            margin-right: 10px;
          }
          button:hover { background: #005f9e; }
          label { color: #4ec9b0; cursor: pointer; text-decoration: underline; }
          label:hover { color: #b5cea8; }
        </style>
      </head>
      <body>
        <h1>Unused Component Tracker</h1>

        <!-- Select All and Backup Toggle -->
        <button onclick="selectAll()">Select All</button>
        <button onclick="deselectAll()">Deselect All</button>
        <label style="display: flex; align-items: center; margin-top: 10px;">
          <input type="checkbox" id="backupToggle" onchange="updateBackupStatus()">
          Backup to ./backups
        </label>

        <div class="category">
          <h2>Unused Files (${categorized.unused_files.length})</h2>
          ${categorized.unused_files
            .map(
              (item, index) =>
                `<div class="item">
              <div style="display: flex; align-items: center;">
                  <input type="checkbox" id="file-${index}" data-type="unused_file" data-path="${
                  item.path || ""
                }">
                  <label for="file-${index}" onclick="openFile('${
                  item.path || ""
                }')">${item.path || "Unknown path"}</label>
                </div> 
                <pre>${
                    (item.content || "").substring(0, 200) || "No content"
                  }...</pre>
                </div>`
            )
            .join("")}
        </div>

        <div class="category">
          <h2>Unused Components (${categorized.unused_components.length})</h2>
          ${categorized.unused_components
            .map(
              (item, index) =>
                `<div class="item">
              <div style="display: flex; align-items: center;">
                  <input type="checkbox" id="comp-${index}" data-type="unused_component" data-path="${
                  item.filePath || ""
                }" data-start="${item.startLine || 0}" data-end="${
                  item.endLine || 0
                }">
                  <label for="comp-${index}" onclick="openFile('${
                  item.filePath || ""
                }')">${item.componentName || "Unknown"} in ${
                  item.filePath || "Unknown path"
                }</label>
                </div> 
                <pre>${
                    (item.code || "").substring(0, 200) || "No code"
                  }...</pre>
                </div>`
            )
            .join("")}
        </div>

        <div class="category">
          <h2>Unused Utilities (${categorized.unused_utilities.length})</h2>
          ${categorized.unused_utilities
            .map(
              (item, index) =>
                `<div class="item">
              <div style="display: flex; align-items: center;">
                  <input type="checkbox" id="util-${index}" data-type="unused_utility" data-path="${
                  item.filePath || ""
                }" data-start="${item.startLine || 0}" data-end="${
                  item.endLine || 0
                }">
                  <label for="util-${index}" onclick="openFile('${
                  item.filePath || ""
                }')">${item.functionName || "Unknown"} in ${
                  item.filePath || "Unknown path"
                }</label>
                </div> 
                <pre>${
                    (item.code || "").substring(0, 200) || "No code"
                  }...</pre>
                </div>`
            )
            .join("")}
        </div>

        <button onclick="deleteSelected()">Delete Selected</button>

        <script>
          const vscode = acquireVsCodeApi();
          let backupEnabled = false;

          function selectAll() {
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
              checkbox.checked = true;
            });
          }

          function deselectAll() {
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
              checkbox.checked = false;
            });
          }

          function updateBackupStatus() {
            backupEnabled = document.getElementById('backupToggle').checked;
            console.log('Backup enabled:', backupEnabled);
          }

          function openFile(path) {
            if (path) {
              vscode.postMessage({ command: 'openFile', path });
            }
          }

          function deleteSelected() {
            const items = [];
            document.querySelectorAll('input:checked').forEach((checkbox) => {
              items.push({
                type: checkbox.dataset.type || '',
                path: checkbox.dataset.path || '',
                startLine: checkbox.dataset.start ? parseInt(checkbox.dataset.start) : undefined,
                endLine: checkbox.dataset.end ? parseInt(checkbox.dataset.end) : undefined,
              });
            });
            console.log('Sending delete message:', items);
            vscode.postMessage({ command: 'delete', items, backupEnabled });
          }
        </script>
      </body>
      </html>
    `;
}

async function handleDeletions(
  items: any[],
  project: Project,
  backupEnabled: boolean
) {
  console.log("Handling deletions:", items, "Backup enabled:", backupEnabled);
  const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
  const backupDir = path.join(workspaceRoot, "backups");

  // Create backup directory if it doesn't exist
  if (backupEnabled && !existsSync(backupDir)) {
    await fs.mkdir(backupDir, { recursive: true });
    console.log("Created backup directory:", backupDir);
  }

  for (const item of items) {
    if (item.type === "unused_file") {
      if (item.path) {
        if (backupEnabled) {
          const backupPath = path.join(backupDir, path.basename(item.path));
          await fs.copyFile(item.path, backupPath);
          console.log("Backed up file to:", backupPath);
          await fs.unlink(item.path);
          console.log("Deleted original file:", item.path);
        } else {
          await fs.unlink(item.path);
          console.log("Deleted file:", item.path);
        }
      }
    } else {
      if (item.path) {
        const sourceFile = project.getSourceFile(item.path);
        if (!sourceFile) {
          console.log("Source file not found for deletion:", item.path);
          continue;
        }

        const startLine = item.startLine || 1;
        const endLine = item.endLine || startLine;
        const text = sourceFile.getFullText();
        const lines = text.split("\n");
        const codeToDelete = lines.slice(startLine - 1, endLine).join("\n");

        if (backupEnabled) {
          const backupPath = path.join(
            backupDir,
            `${path.basename(item.path)}.backup_${Date.now()}.txt`
          );
          await fs.writeFile(backupPath, codeToDelete);
          console.log("Backed up code to:", backupPath);
        }

        lines.splice(startLine - 1, endLine - startLine + 1);
        await fs.writeFile(item.path, lines.join("\n"));
        sourceFile.refreshFromFileSystemSync();
        console.log(
          "Deleted code block from:",
          item.path,
          "lines:",
          startLine,
          "-",
          endLine
        );
      }
    }
  }
}
