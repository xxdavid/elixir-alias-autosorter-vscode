import * as vscode from "vscode";
import sortAliases from "./sort-aliases";

const documentMatchesGlob = (
  document: vscode.TextDocument,
  glob: string,
): boolean => {
  const folders = vscode.workspace.workspaceFolders;
  if (folders) {
    return folders.some((folder) => {
      const relativePattern = new vscode.RelativePattern(folder, glob);
      return vscode.languages.match({ pattern: relativePattern }, document) > 0;
    });
  } else {
    return false;
  }
};

export function activate(context: vscode.ExtensionContext) {
  const willSaveDisposable = vscode.workspace.onWillSaveTextDocument(
    (event) => {
      const document = event.document;
      const config = vscode.workspace.getConfiguration("elixirAliasAutosorter");
      const sortOnSave = config.get<boolean>("sortOnSave", true);

      if (!sortOnSave) {
        return;
      }

      const includeGlob = config.get<string>("includeGlob", "**/*.ex");
      if (!documentMatchesGlob(document, includeGlob)) {
        return;
      }

      const text = document.getText();
      const edits = sortAliases(text);
      if (edits.length > 0) {
        event.waitUntil(Promise.resolve(edits));
      }
    },
  );

  const sortCommand = vscode.commands.registerCommand(
    "elixirAliasAutosorter.sortAliases",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found");
        return;
      }

      const document = editor.document;
      const text = document.getText();
      const edits = sortAliases(text);

      if (edits.length === 0) {
        vscode.window.showInformationMessage("No aliases to sort");
        return;
      }

      editor.edit((editBuilder) => {
        for (const edit of edits) {
          editBuilder.replace(edit.range, edit.newText);
        }
      });
    },
  );

  context.subscriptions.push(willSaveDisposable, sortCommand);
}

export function deactivate() {}
