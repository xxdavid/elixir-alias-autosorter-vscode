import * as assert from "assert";
import dedent from "dedent";
import * as fs from "fs";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("extension", () => {
  vscode.window.showInformationMessage("Start all tests.");
  test("sorts aliases on save", async () => {
    const unsorted = dedent`
      defmodule MyApp.MyModule do
          @moduledoc "This is my great module."

          alias Inspect.Opts
          alias MyApp.Application
          alias Inspect.Algebra
          alias IO.ANSI
          alias Plug.Conn
          alias Phoenix.Controller
          alias IO.Stream

          require Logger

          import Code.Fragment

          def do_something do
              :ok
          end
      end
    `;
    const expectedSorted = dedent`
      defmodule MyApp.MyModule do
          @moduledoc "This is my great module."

          alias Inspect.Algebra
          alias Inspect.Opts
          alias IO.ANSI
          alias IO.Stream
          alias MyApp.Application
          alias Phoenix.Controller
          alias Plug.Conn

          require Logger

          import Code.Fragment

          def do_something do
              :ok
          end
      end
    `;

    // Write the unsorted content to a temp file
    const tmpDir = require("os").tmpdir();
    const filePath = path.join(tmpDir, `elixir_alias_test_${Date.now()}.ex`);
    fs.writeFileSync(filePath, unsorted, "utf8");

    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    vscode.extensions
      .getExtension("dpavlik.elixir-alias-autosorter-vscode")!
      .activate();

    // Wait for the activation
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Save the document to trigger the extension
    vscode.commands.executeCommand("workbench.action.files.save");

    // Wait for the extension to process
    await new Promise((resolve) => setTimeout(resolve, 200));

    assert.strictEqual(document.getText(), expectedSorted);

    // Clean up
    fs.unlinkSync(filePath);
  });

  test("does not sort if file does not match includeGlob", async () => {
    const unsorted = dedent`
      defmodule MyApp.MyModule do
          alias B
          alias A
      end
    `;
    // Write the unsorted content to a temp file with a unique name
    const tmpDir = require("os").tmpdir();
    const filePath = path.join(tmpDir, `elixir_alias_test_${Date.now()}.ex`);
    require("fs").writeFileSync(filePath, unsorted, "utf8");

    // Set the includeGlob to something that does NOT match the file
    await vscode.workspace
      .getConfiguration("elixirAliasAutosorter")
      .update(
        "includeGlob",
        "**/shouldnotmatch/**/*.ex",
        vscode.ConfigurationTarget.Global,
      );

    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    vscode.extensions
      .getExtension("dpavlik.elixir-alias-autosorter-vscode")!
      .activate();

    await new Promise((resolve) => setTimeout(resolve, 200));

    vscode.commands.executeCommand("workbench.action.files.save");

    await new Promise((resolve) => setTimeout(resolve, 200));

    // The file should remain unsorted
    assert.strictEqual(document.getText(), unsorted);

    require("fs").unlinkSync(filePath);

    // Reset the config
    await vscode.workspace
      .getConfiguration("elixirAliasAutosorter")
      .update("includeGlob", undefined, vscode.ConfigurationTarget.Global);
  });

  test("sorts aliases with command", async () => {
    const unsorted = dedent`
      defmodule MyApp.MyModule do
          @moduledoc "This is my great module."

          alias Inspect.Opts
          alias MyApp.Application
          alias Inspect.Algebra
          alias IO.ANSI
          alias Plug.Conn
          alias Phoenix.Controller
          alias IO.Stream

          require Logger

          import Code.Fragment

          def do_something do
              :ok
          end
      end
    `;
    const expectedSorted = dedent`
      defmodule MyApp.MyModule do
          @moduledoc "This is my great module."

          alias Inspect.Algebra
          alias Inspect.Opts
          alias IO.ANSI
          alias IO.Stream
          alias MyApp.Application
          alias Phoenix.Controller
          alias Plug.Conn

          require Logger

          import Code.Fragment

          def do_something do
              :ok
          end
      end
    `;

    // Write the unsorted content to a temp file
    const tmpDir = require("os").tmpdir();
    const filePath = path.join(tmpDir, `elixir_alias_test_${Date.now()}.ex`);
    fs.writeFileSync(filePath, unsorted, "utf8");

    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    vscode.extensions
      .getExtension("dpavlik.elixir-alias-autosorter-vscode")!
      .activate();

    // Wait for the activation
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Execute the sort command
    await vscode.commands.executeCommand("elixirAliasAutosorter.sortAliases");

    // Wait for the command to process
    await new Promise((resolve) => setTimeout(resolve, 200));

    assert.strictEqual(document.getText(), expectedSorted);

    // Clean up
    fs.unlinkSync(filePath);
  });

});
