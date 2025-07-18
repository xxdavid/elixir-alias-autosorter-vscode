import * as vscode from "vscode";

function sortMultiAlias(line: string): string {
  // Check if the line contains multi-alias syntax (curly braces)
  const multiAliasMatch = line.match(/^(\s*alias\s+[^{]+\{)([^}]+)(\}.*)/);
  if (!multiAliasMatch) {
    return line; // Not a multi-alias, return as-is
  }

  const [, prefix, moduleList, suffix] = multiAliasMatch;

  // Split the module list by commas, trim whitespace, and sort
  const modules = moduleList
    .split(",")
    .map((module) => module.trim())
    .filter((module) => module.length > 0)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "accent" }));

  // Reconstruct the line with sorted modules
  return prefix + modules.join(", ") + suffix;
}

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

          // First, sort multi-aliases within each line
          const multiAliasSorted = groupLines.map(sortMultiAlias);

          // Then sort the entire group of aliases
          const sorted = [...multiAliasSorted].sort((a, b) =>
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
