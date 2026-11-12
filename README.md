# Smart TODO — Reference Template for Generative UI Integration in Angular

<p align="center">
  <strong>A modern, production-grade reference application showcasing the Agentic Way of task management—harnessing AG-UI and A2UI orchestration in Angular.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-22-DD0031?style=flat&logo=angular&logoColor=white" alt="Angular 22" />
  <img src="https://img.shields.io/badge/NestJS-12+-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS 12+" />
  <img src="https://img.shields.io/badge/Spartan%20UI-Helm%20%2B%20Brain-000000?style=flat" alt="Spartan UI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Utility--first-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat&logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/Playwright-E2E%20Automated-2EAD33?style=flat&logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
</p>

---

## 💡 Why Smart TODO?

Most AI tutorials demonstrate agents inside isolated terminal scripts or generic chatbots disconnected from actual software. But real-world applications don't work like that—they have complex UI states, optimistic updates, database constraints, authentication barriers, and strict transactional boundaries.

**Smart TODO** was built from the ground up to bridge that divide. It provides a clean, battle-tested, production-grade application that serves as:
1. **A Playground for Agentic AI:** A real application ready to be paired with **AG-UI** (Agent-to-User Interface) and **A2UI** (Agent-to-UI / Action-to-UI orchestration).
2. **A Developer Template:** An approachable, opinionated codebase that engineers can fork, explore, and remix to see how modern web apps adopt autonomous agents without compromising user control or architectural integrity.

> *"Copy it. Learn from it. Make it yours."*

---

## 🤖 The Agentic AI Vision: AG-UI & A2UI

Smart TODO is designed to explore next-generation agent-assisted interactions:

### 1. AG-UI (Agent-to-User Interface)
Rather than trapping the AI inside a separate chat drawer, **AG-UI** embeds agent presence directly into the application canvas:
- **Contextual Awareness:** The agent reads and understands the active workspace, filtered views, and list quotas in real time.
- **Proactive Interventions:** Suggesting task breakdowns, identifying stale priorities, and offering one-click reorganizations directly in place.
- **Ambient Feedback:** Visual state cues (planning, reviewing, mutating) displayed via modern Spartan UI micro-components.

### 2. A2UI (Agent-to-UI / Action-to-UI Protocol)
Agents shouldn't just talk—they should take verified, safe actions on behalf of the user:
- **Decoupled Event Orchestration:** The AI agent dispatches typed NgRx SignalStore events (`@ngrx/signals/events`), ensuring the same predictable state mutations and rollback mechanisms that human interactions use.
- **Structured Tool Calling:** Safe execution gates for list creation, task reordering via fractional order math, smart categorization, and batch actions.
- **Human-in-the-Loop Safeguards:** Clear visual diffs and confirmation patterns before applying destructive mutations.

---

## 🏛 Architecture & Tech Stack

The monorepo is engineered with industry-leading patterns and separation of concerns:

```
smart-todo/
├── smart-todo/             # Frontend: Angular 22 Single Page Application
├── smart-todo-api/         # Backend: NestJS 12+ Modular REST API
├── tests/                  # Testing: Playwright E2E Suite with Isolated Database
└── docs/                   # Specifications: PRD, Architecture, and User Flows
```

### Frontend (`smart-todo/`)
- **Angular 22:** Standalone components, signals-first reactivity (`signal()`, `computed()`, `linkedSignal()`), and zoneless-ready architecture.
- **Spartan UI & Tailwind CSS:** Accessible, headless primitives (`@spartan-ng/brain`) paired with styled components (`@spartan-ng/helm`) and native dark/light theme persistence.
- **NgRx SignalStore & Events:** Decoupled, reactive state management using `@ngrx/signals` and `@ngrx/signals/events`.

### Backend (`smart-todo-api/`)
- **NestJS 12+:** Modular architecture with strict dependency injection and zero circular dependencies.
- **Prisma ORM & MySQL 8.0:** Fully typed database client with versioned incremental migrations.

### End-to-End Testing (`tests/`)
- **Playwright Test Suite:** 40+ E2E tests validating registration, session persistence, quotas, drag-and-drop, debounced search highlighting, and multi-tenant security isolation.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 22.x
- **pnpm** >= 9.x

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AngularBeyond/smart-todo.git
cd smart-todo
pnpm install
```

### 2. Configure Environment Variables
Copy the root environment template:
```bash
cp .env.example .env
```

### 3. Start the Development Database
Start the local MySQL database on port 3306:
```bash
pnpm db:up
```

Apply database migrations:
```bash
pnpm --prefix smart-todo-api prisma:migrate
```

### 4. Start the Application
Run both servers concurrently or in separate terminals:
```bash
# Terminal 1: Backend API (http://localhost:3000)
pnpm api

# Terminal 2: Frontend Web App (http://localhost:4200)
pnpm web
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## 🧪 Testing Suite

### Unit Tests
```bash
# Frontend Unit Tests (Vitest)
pnpm --prefix smart-todo test

# Backend Unit Tests (Vitest)
pnpm api:test
```

### End-to-End (E2E) Tests
```bash
# 1. Start the isolated E2E database (port 3307)
pnpm db:e2e:up

# 2. Run Playwright E2E suite
pnpm test:e2e

# Interactive UI Mode with debugger & trace viewer
pnpm test:e2e:ui

# 3. Stop E2E database when done
pnpm db:e2e:down
```

> [!NOTE]
> For in-depth testing documentation, database isolation rules, and Page Object Models, see [`tests/README.md`](tests/README.md).

---

## 📂 Project Structure

```
smart-todo-monorepo/
├── smart-todo/                   # Angular 22 Single Page Application
│   └── src/app/
│       ├── core/                 # Auth guards, HTTP interceptors, services, and global stores
│       ├── layout/               # Dual layouts (full-screen auth vs. main workspace layout)
│       ├── ui/                   # Spartan UI primitives, directives, and design tokens
│       └── features/             # Domain modules (auth, profile, settings, todos, about)
├── smart-todo-api/               # NestJS 12+ API
│   ├── prisma/                   # Prisma schema & incremental migrations
│   └── src/
│       ├── common/               # Filters, interceptors, and throttler guards
│       ├── config/               # JWT, CORS, and rate limiting configuration
│       └── modules/              # Auth, profile, maintenance, todo-lists, todos
├── tests/                        # Playwright E2E Test Suite
│   ├── docker-compose.e2e.yml    # Isolated MySQL service (port 3307)
│   ├── .env.e2e                  # Dedicated E2E configuration
│   └── e2e/                      # Page objects, fixtures, and domain test specs
└── docs/                         # Specifications & Architecture blueprints
```
---

## 🤝 Contributing & Remixing

Contributions, feedback, and experiment forks are warmly welcomed!

If you build an AI agent integration, experiment with AG-UI widgets, or remix this template for your own product:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/agentic-feature`)
3. Commit your Changes (`git commit -m 'feat: introduce agentic task decomposition'`)
4. Push to the Branch (`git push origin feature/agentic-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
