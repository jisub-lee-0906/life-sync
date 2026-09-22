# Security and publication

## Reporting a vulnerability

Do not include secrets, tokens, or personal backup data in an issue. Report vulnerabilities privately to the project owner with reproduction steps and impact. The owner will acknowledge the report, assess it, and coordinate a fix before public disclosure.

## Publication boundary

A source repository being visible is not approval to deploy it on the public internet. Public deployment requires a separate review of production secrets, HTTPS and proxy configuration, host validation, database migration approval, backups, monitoring, and the current dependency audit.

## Authorization

Server actions and the backup API use a server-only guard that reads the current database user record on each protected request. A valid JWT claim alone is insufficient: only `APPROVED` users are allowed, and administrative actions additionally require a current `ADMIN` role.

## Backup and export safeguards

Backup restore accepts at most 1,000,000 UTF-8 bytes, 10,000 total records, and 4,000 characters per transaction note. Backup downloads send `Cache-Control: no-store, private` and `Pragma: no-cache`. CSV exports prefix formula-like cells with a single quote before CSV escaping.

## Database deployment

`npm run build` does not mutate the database. Generate reviewed Drizzle migrations under `drizzle/migrations`, then run `npm run db:migrate` only in an explicitly approved deployment step with the intended `DATABASE_URL`. Do not use forced schema push for production deployment.
