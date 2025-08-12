## Oracle Database Simulator (React + Vite + shadcn/ui)

Modern, offline Oracle-like SQL playground with an SQL terminal, visual query builder, and schema viewer — all in the browser. Built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui.

Maintainer: M.Mostafa

### ✨ Features
- Offline SQL experience simulating Oracle behaviors
- SQL Terminal with history, help, execution plan mock, and session controls
- Visual Query Builder for SELECT/INSERT/UPDATE/DELETE/CREATE
- Schema Viewer for tables, columns, indexes, constraints, and sample data
- Helpful AI-style guidance for common SQL patterns (offline, rule-based)
- Clean UI using shadcn/ui and Tailwind

### 📦 Tech Stack
- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui components
- @tanstack/react-query for app scaffolding

### 🗂️ Project Structure
- `index.html`: App HTML entry, favicon, metadata
- `src/main.tsx`: React root renderer
- `src/App.tsx`: Providers, routing
- `src/pages/Index.tsx`: Main layout (Terminal + Builder + Schema)
- `src/components/SqlTerminal.tsx`: SQL*Plus-like terminal
- `src/components/QueryBuilder.tsx`: Visual query builder
- `src/components/SchemaViewer.tsx`: Database schema browser
- `src/utils/oracleParser.ts`: In-memory Oracle-like SQL parser/executor
- `src/utils/sessionManager.ts`: Session state (autocommit, savepoints, etc.)
- `src/utils/aiHelper.ts`: Rule-based guidance and tips
- `src/types/oracle.ts`: Typed domain models
- `public/favicon.svg`: Custom SVG icon (M.Mostafa)

### 🚀 Getting Started
1) Install dependencies
```bash
pnpm install
```

2) Run the dev server
```bash
pnpm run dev
```

3) Build for production
```bash
pnpm run build
```

4) Preview the production build
```bash
pnpm run preview
```

### 🧭 Usage Guide
- SQL Terminal
  - Type commands (SELECT/INSERT/UPDATE/DELETE/CREATE/DESC, etc.)
  - Special commands: `HELP`, `CLEAR/CLS`, `EXIT/QUIT`
  - Session commands: `COMMIT`, `ROLLBACK`, `SAVEPOINT name`, `SET AUTOCOMMIT {ON|OFF}`, `SHOW USER`
  - Multi-line input is supported (complete with `;` or `/`)

- Query Builder
  - Choose query type and table, select columns, add WHERE, and execute
  - Copy generated SQL or run directly in the terminal tab

- Schema Viewer
  - Browse tables, columns, indexes, and constraints
  - Shows sample data preview when available

### 🧠 How It Works (Under the Hood)
- The app maintains an in-memory schema using `OracleParser` with simple, Oracle-like parsing rules.
- SQL is normalized (e.g., `VARCHAR2` → `VARCHAR`, `NUMBER` → `DECIMAL`, `SYSDATE` → `CURRENT_TIMESTAMP`).
- Queries are executed against in-memory tables; results and messages are returned to the terminal.
- `SessionManager` persists lightweight session data to `localStorage` (autocommit, savepoints, UI session flags).
- `OfflineAIHelper` provides rule-based suggestions and best practices; no network calls or external LLMs.

### ⚠️ Limitations
- This is a simulator for educational use; not a real Oracle database.
- SQL grammar is intentionally simplified; advanced PL/SQL and complex joins/functions aren’t fully supported.

### 🧪 Testing Ideas (Manual)
- Create a table, insert rows, select them, update/delete, and describe structure:
  ```sql
  CREATE TABLE employees (id NUMBER, name VARCHAR2(100));
  INSERT INTO employees (id, name) VALUES (1, 'John');
  SELECT * FROM employees;
  UPDATE employees SET name = 'Jane' WHERE id = 1;
  DELETE FROM employees WHERE id = 1;
  DESC employees;
  ```

### 🛠️ Development Notes
- Components live under `@/components` and `@/components/ui` (shadcn/ui)
- Path alias `@` → `src`
- Tailwind config: `tailwind.config.ts`, styles in `src/index.css`

### 📄 License and Attribution
Copyright © 2025 M.Mostafa

This project is for learning and demonstration. Names and trademarks are the property of their respective owners.
