# Technical Debt Log

This log tracks deliberate shortcuts, architectural compromises, and "TODOs" made during the development of SimpliERP. 

By recording technical debt at the time it's taken, we ensure visibility and plan for follow-up resolutions in future sprints.

| Date | Module / Component | Shortcut / Issue | Reason | Suggested Follow-up |
| :--- | :--- | :--- | :--- | :--- |
| 2026-06-22 | Core API | Mapped `AppError` dynamically without capturing raw JSON schemas | Expedite deployment of global error boundaries | Add `Zod` schema mapping into `meta` payload |
| 2026-06-22 | Security / CSRF | Custom CSRF Origin validator in `csrf.ts` | Required explicit checking outside Next.js App Router built-in actions | Audit allowed origins whitelist against environment variables |
| 2026-06-22 | Database / Schema | Built `stock_balances` materialized view in raw SQL script | Prisma lacks native view models without `views` preview feature | Enable `views` preview feature in Prisma and migrate to `@@view` |
