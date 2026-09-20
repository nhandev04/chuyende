# HealthLens AI - Frontend Web Application

## Pre-Seeded Test Credentials

| Role | Email / Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Standard User** | `demouser@uit.edu.vn` | `123456` | Food scanner, Weight tracking, Caloric journal |
| **System Administrator** | `admin@uit.edu.vn` | `admin123` | System Admin Hub, Ground-truth DB management, AI feedback reports |

---

## Tech Stack
- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4**
- **Clerk Authentication & Stripe Subscription Integration**



Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
 "$schema": "./node_modules/oxlint/configuration_schema.json",
 "plugins": ["react", "typescript", "oxc"],
 "options": {
 "typeAware": true
 },
 "rules": {
 "react/rules-of-hooks": "error",
 "react/only-export-components": ["warn", { "allowConstantExport": true }]
 }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
