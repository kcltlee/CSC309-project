# CSC309-project

## Project Overview
This project is a full-stack loyalty rewards system with a role-based API and web interface that supports point earning, transactions, events, and promotions across different types of users. It handles account verification, interface switching, accessing the database of users/promos/etc, and transfers between users. Users can also view their data visualized on their dashboards, and APIs for email communication and notifications are built in.

## Acknowledgments
- Lavender Lo ([LavenderLO](https://github.com/LavenderLO))
- Christina Huang ([HChristinaH](https://github.com/HChristinaH))
- Jaycee Law ([jayceelaw](https://github.com/jayceelaw))
- Kristen Lee ([kcltlee](https://github.com/kcltlee))

## Installation Instructions
### Local
### Production

---

## Demo Accounts
You may use these pre-made demo accounts to test different features of our website.
| Role | UTORid | Password |
|--------|-------------|-------------|
| Superuser | superusr | Admin!23 |
| Manager | alice123 | pa$$Wor1 |
| Cashier | cashier1 | Cash!1Aq |
| Regular | userabc1 | User!!11 |

## Technology Stack 
| Layer | Technology | Description |
|--------|-------------|-------------|
| Backend | JavaScript, NodeJS, Express | Server-side logic and API endpoints |
| Frontend | React, NextJS, NodeJS, HTML / CSS | User interface and component rendering |
| Database | SQLite3, Prisma ORM | Persistent data storage |
| Version Control | Git / GitHub | Repository management and collaboration |
| Deployment | TBD |

### Third-Party Services

| Libraries/APIs | Description |
|--------|-------------|
| SendGrid | Send direct emails to users |
| Recharts | Visualize data on user dashboard |
| BcryptJS | Hash + encrypt user passwords |
| WebSocket | Send user notifications |

## Repo Structure
```
course-project/
├── backend/                        # Existing backend (do NOT change)
│   ├── .gitignore
│   ├── .gitkeep
│   ├── .gitkeep copy
│   ├── ai.txt
│   ├── collaboration.txt
│   ├── index.js
│   ├── package.json
│   ├── README.md
│   ├── middleware/
│   │   ├── jwtAuth.js
│   │   └── verifyInput.js
│   ├── prisma/
│   │   ├── .gitkeep
│   │   ├── createsu.js
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── routes/
│       ├── auth.js
│       ├── events.js
│       ├── promotions.js
│       └── transactions.js
│
├── frontend/                        # Next.js frontend
│   ├── .gitignore
│   ├── package.json
│   ├── next.config.js
│   ├── public/                      # Static assets
│   │   ├── favicon.ico
│   └── src/
│       ├── app/                      # Next.js App Router
│       │   ├── layout.js             # Root layout (navbar/footer)
│       │   ├── page.js               # Home/login page
│       │
│       │   ├── user/                 # Regular user pages
│       │   │   ├── page.js           # Dashboard
│       │   │   ├── points.js
│       │   │   ├── qr.js
│       │   │   ├── transfer.js
│       │   │   ├── redeem.js
│       │   │   └── redeem-qr.js
│       │
│       │   ├── event/                # Event-related pages (shared across roles)
│       │   │   ├── page.js           # List of events
│       │   │   ├── create.js         # Manager/Organizer only
│       │   │   ├── [id]/page.js      # Event details / RSVP
│       │   │   ├── [id]/edit.js      # Manager/Organizer only
│       │   │   └── [id]/award.js     # Organizer only
│       │
│       │   ├── transaction/          # Transaction pages
│       │   │   ├── page.js           # List of transactions
│       │   │   ├── create.js         # Cashier only
│       │   │   └── redeem.js         # Cashier only
│       │
│       │   ├── promotion/            # Promotion pages
│       │   │   ├── page.js           # List of promotions
│       │   │   └── create.js         # Manager only
│       │
│       │   └── superuser/            # Superuser-specific pages
│       │       ├── page.js
│       │       └── roles.js
│       │
│       ├    ── components/               # Shared UI components
│       │
│       ├── lib/                      # Helper functions & API calls
│       │   ├── api.js
│       │   ├── users.js
│       │   ├── events.js
│       │   ├── promotions.js
│       │   └── transactions.js
│       │
│       ├── context/                  # React Context for global state
│       │   ├── AuthContext.jsx
│       │   └── UserContext.jsx
│
├── README.md                         # Project overview

```

