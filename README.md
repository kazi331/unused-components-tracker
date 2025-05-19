# unused-components-tracker

## Description

The **unused-components-tracker** is a Visual Studio Code extension that helps developers identify and manage unused files, components, and utilities in React or Next.js projects. It scans your project for unused code, displays the results in a user-friendly Webview panel, and allows you to delete or back up the identified items with ease. Key features include clickable file titles to open files directly in VS Code, a backup option to preserve deleted items, and a minimalistic UI for a seamless experience.

---

## Installation

You can install the **unused-components-tracker** extension directly from the VS Code Marketplace.

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking the Extensions icon in the Activity Bar on the side of the window or pressing `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS).
3. Search for `unused-components-tracker`.
4. Click **Install** to add the extension to VS Code.
5. Once installed, the extension is ready to use—no additional setup required!

Alternatively, you can install it via the command line:

```bash
code --install-extension kazi331.unused-components-tracker
```


---

## Features

- **Scan for Unused Code**: Detects unused files, components, and utilities in your React/Next.js project using `ts-morph` and `@babel/traverse`.
- **Interactive Webview UI**:
  - Lists unused items in three categories: Unused Files, Unused Components, and Unused Utilities.
  - Displays code snippets for each item (up to 200 characters).
  - Allows selection of items via custom-styled checkboxes.
  - Includes "Select All" and "Deselect All" buttons for bulk actions.
  - File titles are clickable to open the file directly in VS Code.
- **Backup Option**: Optionally move deleted items to a `./backups` directory instead of permanent deletion.
- **Delete Functionality**: Remove selected items from your project with a single click.

Here’s a screenshot of the extension in action:

> **Tip**: Screenshots or short GIFs can be added to the `images/` folder in your project to showcase the UI. For example, record a GIF of selecting items, enabling backup, and deleting them.

---

## Requirements

To use the **unused-components-tracker** extension, ensure the following:

- **Visual Studio Code**: Version 1.60.0 or higher.
- **Project Structure**: The extension works best with React or Next.js projects using JavaScript or TypeScript (`.js`, `.jsx`, `.ts`, `.tsx` files).
- **Workspace**: Open a folder in VS Code containing your project to enable the extension’s scanning functionality.

No additional dependencies or manual installation steps are required, as the extension is bundled and distributed via the VS Code Marketplace.

---

## Extension Settings

This extension does not currently contribute any VS Code settings through the `contributes.configuration` extension point. Future updates may include settings such as:

- `unusedComponentsTracker.enableBackupByDefault`: Enable/disable backup functionality by default.
- `unusedComponentsTracker.ignorePatterns`: Customize file patterns to ignore during scanning.

To add settings, modify the `package.json` file under the `contributes.configuration` section.

---

## Known Issues

- **Large Projects**: Scanning very large projects may cause delays due to file system operations. Consider narrowing the scan scope (e.g., to `src/`) in future updates.
- **File Permissions**: On macOS, ensure VS Code has permission to access project files (System Settings &gt; Privacy & Security &gt; Files and Folders).
- **Missing** `tsconfig.json`: Projects without a `tsconfig.json` file may not be fully analyzed by `ts-morph`. Ensure your project includes one, or the extension will fall back to default settings.

If you encounter any issues, please report them on the GitHub Issues page (replace with your repository link).

---

## Release Notes

### 1.0.0

**Initial Release** (May 19, 2025)

- Added core functionality to scan for unused files, components, and utilities.
- Implemented a Webview UI to display results.
- Added delete functionality for selected items.

### 1.0.1

- Added "Select All" and "Deselect All" buttons for bulk selection.
- Redesigned checkboxes with a custom, minimalistic style.

### 1.0.2

- Made file titles clickable to open files directly in VS Code.
- Added backup option to move deleted items to a `./backups` directory.

---

## Following Extension Guidelines

This extension adheres to the VS Code Extension Guidelines, ensuring best practices in development, packaging, and user experience.

---

## Working with Markdown

You can author this README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

---

## For More Information

- Visual Studio Code's Markdown Support
- Markdown Syntax Reference
- VS Code Extension Development
- Publishing Extensions

**Enjoy using unused-components-tracker!**