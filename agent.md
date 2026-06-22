# SimpliERP AI Agent Development Instructions (agent.md)

This document serves as the master blueprint and set of instructions for the AI agent (and human developers) working on the SimpliERP project. To ensure we build a well-structured, high availability, maintainable, and modular SaaS ERP web/mobile software, **all code generation and architectural decisions must strictly adhere to the following 31-point approach**:

## 1. Architecture & Design Principles
* **1. Establish a clear and consistent project structure**: Folder hierarchies must be intuitive, predictable, and domain-driven.
* **3. Separate API, business logic, and data access layers**: Ensure a strict separation of concerns to avoid tightly coupled "spaghetti code."
* **12. Use dependency injection for loose coupling**: Components should depend on abstractions, not concretions.
* **15. Define clear architectural boundaries**: Modules (HR, Finance, etc.) must communicate through defined interfaces or events.
* **24. Design for scalability and future extensibility**: Build with the assumption that the system will scale horizontally.
* **25. Follow SOLID principles and clean code practices**: Code must be easily readable, testable, and maintainable.
* **30. Maintain an architecture decision record (ADR)**: Document the "why" behind major technical choices.

## 2. Code Modularity & Reusability
* **2. Extract repeated logic into reusable functions/services**: Adhere strictly to the DRY (Don't Repeat Yourself) principle.
* **5. Create shared components**: Centralize cross-cutting concerns like logging, notifications, and data validation.
* **6. Define interfaces/contracts for replaceable implementations**: Allow systems to be swapped easily (e.g., changing payment gateways or email providers).
* **9. Build reusable utility/helper libraries**: Extract generic operations into pure utility functions.
* **13. Create reusable internal packages/modules**: Structure code so it can be shared across microservices or projects if needed.
* **28. Create reusable UI components**: For frontend applications, utilize a strict design system with isolated, reusable components.

## 3. Configuration, Data & Infrastructure
* **4. Centralize configuration and environment variables**: Never hardcode secrets or environment-specific variables.
* **14. Implement CI/CD pipelines**: Automate testing, linting, and deployment processes.
* **18. Introduce logging, monitoring, and observability**: Ensure the system is easily debuggable in production using structured logs and APM tools.
* **19. Optimize database design and access patterns**: Use proper indexing, avoid N+1 queries, and design schemas that support high-performance reporting.
* **22. Use versioning for APIs and shared libraries**: Ensure backward compatibility for mobile apps and external consumers.
* **23. Implement feature flags for controlled releases**: Allow features to be toggled in production without full redeployments.

## 4. Security & Error Handling
* **7. Standardize error handling and exception management**: Return consistent API error formats and never leak stack traces to the client.
* **16. Centralize authentication and authorization**: Use a unified identity provider and enforce strict Role-Based Access Control (RBAC).
* **17. Apply consistent security practices**: Sanitize inputs, use parameterized queries, and follow OWASP top 10 guidelines.

## 5. Development Workflow & Quality Assurance
* **8. Implement automated unit and integration tests**: Code is not complete until it has adequate test coverage.
* **10. Enforce coding standards with linters and formatters**: Use tools (like ESLint, Prettier, or equivalent) to maintain a unified codebase style.
* **11. Maintain comprehensive documentation**: Keep API docs (Swagger/OpenAPI), READMEs, and inline documentation up to date.
* **20. Conduct regular technical debt reviews**: Continuously refactor and address technical debt.
* **21. Adopt code review and pull request workflows**: Ensure all code is peer-reviewed before merging into the main branch.
* **26. Standardize naming conventions across the codebase**: Use consistent casing (camelCase, PascalCase, snake_case) as defined by the framework's standards.
* **27. Remove dead code and unused dependencies**: Keep the codebase lean and reduce the attack surface.
* **29. Define coding guidelines and development standards**: Ensure all team members and AI agents are aligned on the "SimpliERP way" of writing code.
* **31. Comment all code lines for clarity and maintainability**: Provide context-rich comments explaining *what* the code does and *why* it does it, ensuring anyone can maintain it in the future.
