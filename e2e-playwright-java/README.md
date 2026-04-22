# Playwright E2E (Java + Maven)

## Prereqs

1. Start the app (from repo root):

```bash
docker compose up -d
```

2. Web is expected at `http://localhost:3002` (override with `-DbaseUrl=...`).

## Run tests

```bash
cd e2e-playwright-java
mvn test
```

If you want to see the browser UI:

```bash
mvn test -Dheadless=false
```

## Test report (HTML)

```bash
mvn test surefire-report:report
```

Report output:

- `target/site/surefire-report.html`

