import * as assert from "assert";
import dedent from "dedent";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const EXTENSION_ID = "dpavlik.elixir-alias-autosorter-vscode";
const CONFIG_SECTION = "elixirAliasAutosorter";
const PROCESS_DELAY = 100;

const TEST_DATA = {
  COMPLEX_UNSORTED: dedent`
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
  `,
  COMPLEX_SORTED: dedent`
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
  `,
  SIMPLE_UNSORTED: dedent`
    defmodule MyApp.MyModule do
        alias Inspect.Opts
        alias MyApp.Application
        alias Inspect.Algebra
        alias IO.ANSI
        alias Plug.Conn
        alias Phoenix.Controller
        alias IO.Stream
    end
  `,
  SIMPLE_SORTED: dedent`
    defmodule MyApp.MyModule do
        alias Inspect.Algebra
        alias Inspect.Opts
        alias IO.ANSI
        alias IO.Stream
        alias MyApp.Application
        alias Phoenix.Controller
        alias Plug.Conn
    end
  `,
  MINIMAL_UNSORTED: dedent`
    defmodule MyApp.MyModule do
        alias B
        alias A
    end
  `,
};

// Test utilities
class TestHelper {
  private configBackup: Map<string, any> = new Map();

  async createWorkspaceWithFile(
    content: string,
  ): Promise<{ document: vscode.TextDocument }> {
    const workspaceDir = vscode.workspace.workspaceFolders![0].uri.fsPath;

    const filePath = path.join(
      workspaceDir,
      `lib/elixir_alias_test/test_file.ex`,
    );
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");

    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    return { document };
  }

  async setConfig(key: string, value: any): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

    // Backup current value if not already backed up
    if (!this.configBackup.has(key)) {
      this.configBackup.set(key, config.get(key));
    }

    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }

  async ensureExtensionActive(): Promise<void> {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    if (!extension) {
      throw new Error(`Extension ${EXTENSION_ID} not found`);
    }

    if (!extension.isActive) {
      await extension.activate();
    }

    // Wait for activation to complete
    await this.wait(PROCESS_DELAY);
  }

  async triggerSave(): Promise<void> {
    await vscode.commands.executeCommand("workbench.action.files.save");
    await this.wait(PROCESS_DELAY);
  }

  async triggerSortCommand(): Promise<void> {
    await vscode.commands.executeCommand("elixirAliasAutosorter.sortAliases");
    await this.wait(PROCESS_DELAY);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    // Clean up any files and folders in the workspace
    const workspaceDir = vscode.workspace.workspaceFolders![0].uri.fsPath;
    try {
      fs.readdirSync(workspaceDir).forEach((file) => {
        fs.rmSync(path.join(workspaceDir, file), {
          recursive: true,
          force: true,
        });
      });
    } catch (error) {
      // Ignore cleanup errors
    }

    // Restore config
    for (const [key, value] of this.configBackup) {
      const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
      await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
    this.configBackup.clear();
  }
}

suite("extension", () => {
  let helper: TestHelper;

  setup(() => {
    helper = new TestHelper();
    vscode.window.showInformationMessage("Starting test...");
  });

  teardown(async () => {
    await helper.cleanup();
  });

  test("sorts aliases on save", async () => {
    const { document } = await helper.createWorkspaceWithFile(
      TEST_DATA.COMPLEX_UNSORTED,
    );
    await helper.ensureExtensionActive();
    await helper.triggerSave();

    assert.strictEqual(document.getText(), TEST_DATA.COMPLEX_SORTED);
  });

  test("sorts aliases with a specific glob", async () => {
    const { document } = await helper.createWorkspaceWithFile(
      TEST_DATA.COMPLEX_UNSORTED,
    );

    await helper.setConfig("includeGlob", "{config,lib,test}/**/*.{ex,exs}");

    await helper.ensureExtensionActive();
    await helper.triggerSave();

    assert.strictEqual(document.getText(), TEST_DATA.COMPLEX_SORTED);
  });

  test("does not sort if file does not match includeGlob", async () => {
    const { document } = await helper.createWorkspaceWithFile(
      TEST_DATA.MINIMAL_UNSORTED,
    );

    // Set includeGlob to something that won't match
    await helper.setConfig("includeGlob", "**/shouldnotmatch/**/*.ex");

    await helper.ensureExtensionActive();
    await helper.triggerSave();

    // File should remain unsorted
    assert.strictEqual(document.getText(), TEST_DATA.MINIMAL_UNSORTED);
  });

  test("sorts aliases with command", async () => {
    const { document } = await helper.createWorkspaceWithFile(
      TEST_DATA.COMPLEX_UNSORTED,
    );
    await helper.ensureExtensionActive();
    await helper.triggerSortCommand();

    assert.strictEqual(document.getText(), TEST_DATA.COMPLEX_SORTED);
  });

  test("does not sort aliases on save when sortOnSave is disabled", async () => {
    const { document } = await helper.createWorkspaceWithFile(
      TEST_DATA.SIMPLE_UNSORTED,
    );

    await helper.setConfig("sortOnSave", false);
    await helper.ensureExtensionActive();
    await helper.triggerSave();

    // File should remain unsorted
    assert.strictEqual(document.getText(), TEST_DATA.SIMPLE_UNSORTED);
  });

  test("sorts aliases on save when sortOnSave is explicitly enabled", async () => {
    const { document } = await helper.createWorkspaceWithFile(
      TEST_DATA.SIMPLE_UNSORTED,
    );

    await helper.setConfig("sortOnSave", true);
    await helper.ensureExtensionActive();
    await helper.triggerSave();

    assert.strictEqual(document.getText(), TEST_DATA.SIMPLE_SORTED);
  });
});
