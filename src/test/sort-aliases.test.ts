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
});
