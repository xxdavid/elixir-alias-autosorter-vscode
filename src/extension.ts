import * as vscode from "vscode";
import sortAliases from "./sort-aliases";
import { minimatch } from "minimatch";

export function activate(context: vscode.ExtensionContext) {
  const willSaveDisposable = vscode.workspace.onWillSaveTextDocument(
    (event) => {
      const document = event.document;
      const config = vscode.workspace.getConfiguration("elixirAliasAutosorter");
      const includeGlob = config.get<string>("includeGlob", "**/*.ex");
      if (!minimatch(document.fileName, includeGlob)) {
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
