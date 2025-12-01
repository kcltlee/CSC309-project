# CSC309-project

## Project Overview
A full-stack loyalty rewards system with role-based API and web interface supporting points, transactions, events, and promotions for different user types. Features include account verification, interface switching, database access, transfers, dashboards, email, and notifications.

---

## Demo Accounts
Use these accounts to test features:
| Role      | UTORid     | Password   |
|-----------|------------|------------|
| Superuser | superusr   | Admin!23   |
| Superuser | admin123   | abc123     |
| Manager   | alice123   | pa$$Wor1   |
| Manager   | john123    | Abc123$    |
| Cashier   | cashier1   | Cash!1Aq   |
| Regular   | userabc1   | User!!11   |
| Regular   | reguser    | Stud!22b   |

---

## Technology Stack & Architecture
| Layer      | Technology                | Description                  |
|-----------|---------------------------|------------------------------|
| Backend   | Node.js, Express, Prisma  | API, DB, business logic      |
| Frontend  | React, Next.js (App Router)| UI, routing, SSR            |
| Database  | SQLite (dev), Prisma ORM  | Persistent storage           |
| Auth      | JWT, bcryptjs             | Secure authentication        |
| Realtime  | ws                        | Websocket notifications      |
| Charts    | Recharts                  | Data visualization           |
| Email     | SendGrid                  | Transactional emails         |

---

## Repo Structure
```
course-project/
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── .env
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── dev.db
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── promotions.js
│   │   ├── transactions.js
│   │   └── users.js
│   ├── middleware/
│   │   ├── jwtAuth.js
│   │   └── verifyInput.js
|   ├── services/
│   │   ├── notifications.js
│   └── websocket/
│       └── index.js
├── frontend/
│   ├── package.json
│   ├── .env
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── user/
│   │   │   ├── event/
│   │   │   ├── transaction/
│   │   │   ├── promotion/
│   │   │   └── superuser/
│   │   ├── components/
│   │   ├── context/
│   │   └── lib/
│   └── next.config.js
├── README.md
```

---

## Deployment Instructions

### Local Development
1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd course-project
   ```
2. **Backend setup**
   ```bash
   cd backend
   npm install
   # Create .env (see below)
   npx prisma db seed
   node index.js 4000
   ```
   - Backend runs at http://localhost:4000
3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Frontend runs at http://localhost:3000
4. **Login**
   - Use demo credentials above at http://localhost:3000

### Production Deployment
- **Backend**: Set NODE_ENV=production, use Postgres for DB, secure JWT_SECRET, and configure SendGrid.
- **Frontend**: Build with `npm run build`.
- **Environment variables** must be set in production (see below).

---

## Environment Configuration

**backend/.env** (example)
```
PORT=4000
FRONTEND_URL="http://localhost:3000"
JWT_SECRET=your_jwt_secret
DATABASE_URL="file:./prisma/dev.db"
SENDGRID_API_KEY=your_sendgrid_key
```

**frontend/.env** (example)
```
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

---

## Third-Party Services
- **SendGrid**: Email notifications (backend)
- **Recharts**: Data visualization (frontend)
- **bcryptjs**: Password hashing (backend)
- **ws**: Websocket notifications (backend)
- **react-qr-code**: QR code generation (frontend)

---

## Authors
- Lavender Lo ([LavenderLO](https://github.com/LavenderLO))
- Christina Huang ([HChristinaH](https://github.com/HChristinaH))
- Jaycee Law ([jayceelaw](https://github.com/jayceelaw))
- Kristen Lee ([kcltlee](https://github.com/kcltlee))

