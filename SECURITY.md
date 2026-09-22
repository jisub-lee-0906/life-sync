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

## Development-tool advisory status (2026-09-23)

The production-only npm audit reports no findings. The full audit still reports four moderate entries along the development/migration chain `drizzle-kit` → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils` → `esbuild`; these are dependency-chain entries, not four independent application flaws. The older esbuild development-server issue is tracked as [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99).

The audit tool does not propose a compatible update for that legacy loader chain. A breaking downgrade or unverified esbuild override has not been applied. Do not run the affected esbuild development server; keep migration/admin tooling out of public-facing services, and use reviewed migration commands only against the intended database. This residual finding is not a claim that production or arbitrary deployment configurations are vulnerability-free.
