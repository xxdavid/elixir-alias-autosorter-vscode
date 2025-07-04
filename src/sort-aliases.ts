import * as vscode from "vscode";

export default function sortAliases(text: string): vscode.TextEdit[] {
  const edits: vscode.TextEdit[] = [];
  const lines = text.split(/\n/);
  let groupStart = -1;
  let aliasEndLine = -1;
  let inAliasBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*alias\s+/.test(line)) {
      if (!inAliasBlock) {
        groupStart = i;
        inAliasBlock = true;
      }
      aliasEndLine = i;
    } else {
      if (inAliasBlock) {
        // End of alias group
        if (groupStart !== -1 && aliasEndLine >= groupStart) {
          const groupLines = lines.slice(groupStart, aliasEndLine + 1);
          const sorted = [...groupLines].sort((a, b) =>
            a
              .trim()
              .localeCompare(b.trim(), undefined, { sensitivity: "accent" }),
          );
          if (groupLines.join("\n") !== sorted.join("\n")) {
            const start = new vscode.Position(groupStart, 0);
            const end = new vscode.Position(
              aliasEndLine,
              lines[aliasEndLine].length,
            );
            edits.push(
              vscode.TextEdit.replace(
                new vscode.Range(start, end),
                sorted.join("\n"),
              ),
            );
          }
        }
        inAliasBlock = false;
        groupStart = -1;
      }
    }
  }
  return edits;
}
