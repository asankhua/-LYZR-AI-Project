# Architect 2.0

Each phase is its own folder, named for what that phase covers. Phase 0 is [phase 0 - home workspace shell](<phase 0 - home workspace shell/>). Phase 1 is [phase 1 - plan agents code](<phase 1 - plan agents code/>). Phase 3 is [phase 3 - github import deploy](<phase 3 - github import deploy/>). The current app is [phase 5 - ship](<phase 5 - ship/>). Later phases follow the same pattern. A new phase starts as a copy of the previous phase's folder.

The only env file is `.env` in this folder. Phase folders do not contain env files.

Shared code lives in [common](common/). A phase imports those modules. Next.js route files stay in that phase's `app/` folder, because the App Router only reads routes there. Phase-specific code stays in the phase folder.

Product docs stay here: [architecture.md](architecture.md), [prd.md](prd.md), [implementation_plan.md](implementation_plan.md), [stitch_design/](stitch_design/).

When editing the current phase, follow [phase 5 - ship/CLAUDE.md](<phase 5 - ship/CLAUDE.md>).
