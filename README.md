# 🧪 Octa App Backend

**Octa App** is a modular, scalable, multi-tenant backend for a **Pharmacy Retail & Wholesale POS/ERP/Inventory system**, designed with **Domain-Driven Design (DDD)** principles. Built using **Node.js**, **TypeScript**, **PostgreSQL**, and **Prisma**, it is production-ready and developer-friendly, supporting multi-role, multi-tenant SaaS use cases.

---

## 🔧 Tech Stack

| Layer            | Technology                                      |
|------------------|--------------------------------------------------|
| Language         | TypeScript (strict mode)                         |
| Runtime          | Node.js                                          |
| Framework        | Express.js                                       |
| Database         | PostgreSQL                                       |
| ORM              | Prisma                                           |
| Validation       | Zod (preferred) / Joi                            |
| Auth             | JWT (access + refresh tokens)                    |
| Authorization    | RBAC with contextual roles                       |
| Logging          | Winston or Pino                                  |
| Caching          | Redis (sessions, permissions)                    |
| Config Mgmt      | dotenv                                            |
| Password Hashing | bcryptjs                                          |
| Documentation    | Swagger/OpenAPI                                  |
| Testing          | Jest (unit, integration), Supertest (E2E)        |

---

## 🧱 Architecture

### Design Patterns
- **Domain-Driven Design (DDD)**
- **Modular feature-based structure**
- **Service Locator / Dependency Injection**
- **Event-driven (via domain events)**

### Folder Structure
```
src/
  modules/
    auth/
      controllers/
      services/
      routes/
      dtos/
      types/
    tenant/
    store/
    product/
    inventory/
    ...
  shared/
    infra/
    utils/
    middlewares/
    events/
  config/
  types/
  prisma/
  index.ts
```

---

## 🧮 Core Features

### ✅ Authentication & Authorization
- Stateless **JWT-based Auth**
- **Access & Refresh tokens**
- **Role-Based Access Control (RBAC)**:
  - Granular permissions: `product:create`, `inventory:read`
  - Hierarchical roles (e.g., Global Admin > Tenant Admin > Store Manager)
- Permission-based route guards: `requirePermission`

### 🏢 Multi-Tenancy Support
- **Row-Level Isolation** (via `tenantId`)
- **Context-Aware Middleware**
- **Tenant-scoped** user and store access
- B2B cross-tenant operations (with approval)

### 🧩 Module Standards
- **DTOs** validated with `Zod`
- **Services** encapsulate business logic
- **Controllers** handle requests and response shaping
- **Routes** protected by middleware and grouped per feature
- **Transactions** used for atomic operations
- **Audit Logging** for all state changes

---

## 📦 Modules Implemented

### 1. Auth Module
- Register / Login
- Refresh Tokens
- Password Reset
- Email Invitation & Activation
- Session Management

### 2. Tenant Module
- Create / Update / Delete Tenants
- Auto-onboarding with default setup
- Branding and configuration management
- B2B Connection Management

### 3. Store Module
- Store CRUD with types (Retail, Wholesale, Distribution)
- Store Managers Assignment
- Opening/closing hours
- Store-Tenant-Business entity relationships

### 4. Business Entity Module
- Legal Entity registration
- Tax Identification & Contact Info
- Related stores & compliance context

---

## 🛡 Security & Best Practices

- **Input Validation** using Zod
- **Error Handling** with consistent structure and status codes
- **BCrypt** with proper salt rounds
- **Tenant Context Verification** on all operations
- **Audit Logs** via middleware and loggers
- **Environment Variables** stored via `.env`

---

## 📚 Documentation & Dev Standards

### Developer Conventions
- DTOs: `CreateXDto`, `UpdateXDto`
- Controllers: `XController`
- Services: `XService` with well-typed public methods
- Swagger Docs via decorators or manual YAML/OpenAPI

### Code Practices
- Async/await throughout
- TypeScript strict mode enabled
- Descriptive commit messages
- Clear separation of concerns per module

---

## 🧪 Testing Strategy

| Test Type      | Tool         | Scope                             |
|----------------|--------------|------------------------------------|
| Unit Tests     | Jest         | Services, utilities                |
| Integration    | Supertest    | Controllers + Routes               |
| E2E Tests      | Jest + Docker| Full user flows + multi-tenant     |
| Mocking        | msw / jest   | Mock Prisma or DB layer            |

---

## ⚙️ Environment Setup

### 1. Clone Repo
```bash
git clone https://github.com/SolomonOjigbo/octa-server
cd octa-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Create `.env` file with the following:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://localhost:6379
```

### 4. Prisma Setup
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start Development Server
```bash
npm run dev
```

---

## 📘 API Documentation

- Swagger UI available at `/docs`
- YAML schemas organized per module under `/docs/swagger`
- Auto-generated docs from `swaggerSchema.ts`

---

## 🔌 Key Dependencies

```json
"@prisma/client": "^4.x",
"zod": "^3.x",
"bcryptjs": "^2.x",
"jsonwebtoken": "^9.x",
"winston": "^3.x",
"express": "^4.x",
"dotenv": "^16.x",
"redis": "^4.x"
```

---

## 📈 Roadmap (Planned Modules)

- 💳 **POS & Transactions Module**
- 🛍 **Product & Variants**
- 📦 **Inventory Adjustments**
- 📜 **Purchase Orders & Supplier Integration**
- 📊 **Reporting & Analytics**
- 🧾 **Receipt Generation**
- 💬 **Notification System (SMS, Email)**

---

## 👥 Contributing

We welcome contributions! Please follow the **conventional commit** format and submit pull requests with related documentation and tests.

---

## 🧠 Developer Onboarding Tips

- Start with the `auth`, `tenant`, and `store` modules to understand DDD patterns.
- Use Swagger docs to explore the API.
- Follow the Prisma schema for data structure understanding.
- Refer to the `shared/` folder for middleware, utils, and event dispatchers.

---

## 🛠 Maintainers

- Lead Engineer: Solomon Ojigbo(https://github.com/SolomonOjigbo)
- Docs Maintainer: Solomon Ojigbo

---

## 📄 License

MIT License © Octa App Inc.
