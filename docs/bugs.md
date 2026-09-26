# Bug log

One line per bug: phase, screen, steps, severity, status.

Severity: **S1** a flow is broken, data is lost, or there is a security issue. **S2** a feature is wrong or a screen fails the definition of done. **S3** polish.

| Phase | Screen | Steps | Severity | Status |
|---|---|---|---|---|
| P0 | Sign in | Google, GitHub and magic link are wired. They cannot be exercised until the Supabase keys are in the root `.env` and anonymous sign-in is enabled. Guest entry covers the shell locally. | S3 | Blocked on accounts |
| P0 | Database | The migration and RLS policies are in `0001_init.sql` and checked by a unit test. A live cross-tenant test needs `supabase start` or a linked project. | S3 | Blocked on accounts |
| P0 | Theme | The theme script added `dark` before React hydrated, so the page warned and could drop the class. The shared layout now allows that class. | S3 | Fixed |
| P2 | Preview | Opening the preview booted the app, then synced the same files again. The second pass is skipped until the files change. | S2 | Fixed |
| P5 | Deploy | Support Desk's older deployment used the same subdomain as the current one, so both rows read the same. The older row is now `support-desk-previous`. | S3 | Fixed |
