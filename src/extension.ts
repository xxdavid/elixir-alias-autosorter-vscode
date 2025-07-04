import * as vscode from "vscode";
import sortAliases from "./sort-aliases";

export function activate(context: vscode.ExtensionContext) {
  const willSaveDisposable = vscode.workspace.onWillSaveTextDocument(
    (event) => {
      const document = event.document;
      if (
        document.languageId !== "elixir" &&
        !document.fileName.endsWith(".ex")
      ) {
        return;
      }

      const text = document.getText();
      const edits = sortAliases(text);
      if (edits.length > 0) {
        event.waitUntil(Promise.resolve(edits));
      }
    },
  );
  context.subscriptions.push(willSaveDisposable);
}

export function deactivate() {}
