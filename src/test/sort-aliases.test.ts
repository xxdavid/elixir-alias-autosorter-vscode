import * as assert from "assert";
import { TextEdit, Position, Range } from "vscode";
import sortAliases from "../sort-aliases";
import dedent from "dedent";

suite("sortAliases", () => {
  test("sorts aliases", () => {
    const input = dedent`
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

    const actual = sortAliases(input);
    const expectedNewText = `    alias Inspect.Algebra
    alias Inspect.Opts
    alias IO.ANSI
    alias IO.Stream
    alias MyApp.Application
    alias Phoenix.Controller
    alias Plug.Conn`;
    const expected: TextEdit[] = [
      new TextEdit(
        new Range(new Position(3, 0), new Position(9, 19)),
        expectedNewText,
      ),
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test("sorts aliases only among its group", () => {
    const input = dedent`
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

    const actual = sortAliases(input);

    const expectedNewText1 = `    alias Inspect.Algebra
    alias Inspect.Opts
    alias MyApp.Application`;

    const expectedNewText2 = `    alias IO.ANSI
    alias IO.Stream
    alias Phoenix.Controller
    alias Plug.Conn`;

    const expected: TextEdit[] = [
      new TextEdit(
        new Range(new Position(3, 0), new Position(5, 25)),
        expectedNewText1,
      ),
      new TextEdit(
        new Range(new Position(7, 0), new Position(10, 19)),
        expectedNewText2,
      ),
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test("sorts multi-aliases within curly braces", () => {
    const input = dedent`
      defmodule MyApp.MyModule do
          @moduledoc "This is my great module."

          alias PhoenixStorybook.Rendering.{RenderingVariation, RenderingContext}
          alias IO.ANSI
          alias Plug.Conn

          require Logger

          def do_something do
              :ok
          end
      end
    `;

    const actual = sortAliases(input);
    const expectedNewText = `    alias IO.ANSI
    alias PhoenixStorybook.Rendering.{RenderingContext, RenderingVariation}
    alias Plug.Conn`;
    const expected: TextEdit[] = [
      new TextEdit(
        new Range(new Position(3, 0), new Position(5, 19)),
        expectedNewText,
      ),
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test("sorts multi-aliases with multiple modules", () => {
    const input = dedent`
      defmodule MyApp.MyModule do
          alias MyApp.Core.{User, Session, Token, Account}
          alias MyApp.Web.{View, Controller}
      end
    `;

    const actual = sortAliases(input);
    const expectedNewText = `    alias MyApp.Core.{Account, Session, Token, User}
    alias MyApp.Web.{Controller, View}`;
    const expected: TextEdit[] = [
      new TextEdit(
        new Range(new Position(1, 0), new Position(2, 38)),
        expectedNewText,
      ),
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test("sorts mixed regular and multi-aliases", () => {
    const input = dedent`
      defmodule MyApp.MyModule do
          alias Phoenix.Controller
          alias MyApp.Core.{User, Account}
          alias IO.ANSI
          alias MyApp.Web.{View, Controller}
      end
    `;

    const actual = sortAliases(input);
    const expectedNewText = `    alias IO.ANSI
    alias MyApp.Core.{Account, User}
    alias MyApp.Web.{Controller, View}
    alias Phoenix.Controller`;
    const expected: TextEdit[] = [
      new TextEdit(
        new Range(new Position(1, 0), new Position(4, 38)),
        expectedNewText,
      ),
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test("handles multi-aliases with extra spaces", () => {
    const input = dedent`
      defmodule MyApp.MyModule do
          alias MyApp.Core.{  User  ,   Account,  Session  }
      end
    `;

    const actual = sortAliases(input);
    const expectedNewText = `    alias MyApp.Core.{Account, Session, User}`;
    const expected: TextEdit[] = [
      new TextEdit(
        new Range(new Position(1, 0), new Position(1, 54)),
        expectedNewText,
      ),
    ];
    assert.deepStrictEqual(actual, expected);
  });

  test("does not modify already sorted multi-aliases", () => {
    const input = dedent`
      defmodule MyApp.MyModule do
          alias MyApp.Core.{Account, User}
          alias Phoenix.Controller
      end
    `;

    const actual = sortAliases(input);
    assert.deepStrictEqual(actual, []);
  });

  test("handles empty multi-alias (edge case)", () => {
    const input = dedent`
      defmodule MyApp.MyModule do
          alias MyApp.Core.{}
      end
    `;

    const actual = sortAliases(input);
    // Should not modify empty multi-alias
    assert.deepStrictEqual(actual, []);
  });
});
