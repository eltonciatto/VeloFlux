# Repository Guidelines

These instructions apply to all files in this repository.

## Development Workflow

- Format Go source files using `gofmt -w` before committing.
- Run `go test ./...` whenever Go files change.
- Run `npm run lint` when frontend files change. If `node_modules` is missing, run `npm install` first.
- Indent YAML files with two spaces.
- Keep commit messages concise (72 characters or fewer).
