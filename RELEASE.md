# How to do a release

This a note just for myself to remember how to release a new version. :)

1. Update the version in `package.json`
2. Update `CHANGELOG.md`
3. Commit the changes
4. Tag the commit
5. `vsce package`
6. `vsce publish`
7. Manually upload to Open VSX by dragging the `*.vsix` file [here](https://open-vsx.org/user-settings/extensions)
