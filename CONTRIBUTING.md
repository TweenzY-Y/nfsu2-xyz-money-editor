# Contributing

Thank you for helping with the nfsu2.xyz Money Editor. Bug reports, ideas and pull requests are all welcome.

Please follow the [code of conduct](CODE_OF_CONDUCT.md).

## Report a bug or ask for a feature

Open an [issue](https://github.com/TweenzY-Y/nfsu2-xyz-money-editor/issues/new/choose) and pick the right template.

For a bug, tell us what you did, what you expected and what happened instead. Do not attach your save backup to a public issue. It has your profile in it.

Problems with the game itself, or with nfsu2.xyz, are not bugs in this tool. Please report those to nfsu2.xyz.

## Before you start working on something big

Open an issue first and describe your idea. Then we can agree on it before you spend time on the code.

## Set up the project

You only need a browser and [Node.js](https://nodejs.org) 20 or newer. The project has no dependencies, so there is nothing to install.

1. Fork the repository and clone your fork.
2. Open `index.html` in Chrome or Firefox to try the tool.
3. Run the tests:

   ```
   npm test
   ```

## Project structure

- `index.html` is the page.
- `src/backup.js` reads the backup zip and changes the money. It has no browser code, so the tests can run it in Node.js.
- `src/app.js` runs the page.
- `src/styles.css` has the styles. They follow the look of nfsu2.xyz.
- `test/backup.test.js` has the tests. They build their own small backup files, so no real save is needed.
- `docs/screenshots/` has the pictures for the README and the page.

## Rules for changes

- Keep the tool small and without dependencies. It must keep working when someone double-clicks `index.html`.
- Add or update tests when you change `src/backup.js`, and make sure `npm test` passes.
- Test your change in the browser with a real backup from nfsu2.xyz, and check that nfsu2.xyz can restore the new backup.
- Never commit a real save backup.
- Write text for players in simple English (level B1 to B2). Use short sentences and plain words.
- Use [Conventional Commits](https://www.conventionalcommits.org) for commit messages, for example `fix: show an error for empty zip files` or `docs: explain cloud saves`.

## Pull requests

1. Create a branch for your change.
2. Fill in the pull request template.
3. Keep one topic per pull request.

The maintainer reviews pull requests when there is time. Small and clear pull requests are easier to review.
