import * as vscode from "vscode";
import sortAliases from "./sort-aliases";

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
      if (vscode.languages.match({ pattern: includeGlob }, document) === 0) {
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
