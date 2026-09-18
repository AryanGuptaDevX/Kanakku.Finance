# MoneyManager - Production-Grade Personal Finance & Wealth Tracker

MoneyManager is a modern, modular personal finance management application engineered with a **Python FastAPI** backend and a **React + Vite** frontend.

It provides financial tracking across Income, Expenses, Budgets, Recurring Transactions, EMI/Loan Tracking, SIP Investment Portfolios, Savings Goals, Multi-dimensional Analytics, and CSV Exports.

---

## Key Features

1. **Centralized Financial Engine**: All financial metrics (Available Balance, Savings Rate, Budget Spend, EMI Schedules, SIP Returns, Goals Progress) are calculated on the backend to guarantee precision.
2. **Dashboard**: Live monthly financial summary, cashflow charts, category breakdowns, line trends, budget progress, and upcoming EMI schedules.
3. **Income & Expense Management**: Full CRUD operations, reusable transaction modals, payment method tracking, and custom category management.
4. **Budgeting & Threshold Alerts**: Monthly overall and category-specific budget limits with visual indicators (Green <75%, Yellow 75-99%, Red ≥100%).
5. **Recurring Transactions**: Idempotent duplicate protection engine automatically processes monthly/weekly/yearly recurring income and subscriptions.
6. **EMI & Loan Tracker**: Tracks principal amounts, monthly EMIs, interest rates, payment installments made vs remaining, and records payments into expense logs.
7. **SIP Investment Tracker**: Tracks mutual funds/SIP contributions, total invested capital, current valuation, profit/loss, and return ROI %.
8. **Savings Goals**: Multi-goal tracking with percentage progress bars and quick contribution top-ups.
9. **Analytics & Insights**: Multi-dimensional filtering by month, custom date range, category, and transaction type using Recharts.
10. **CSV Data Export**: Pure Python CSV generation for transactions, income, expenses, EMI loans, SIP investments, and savings goals.
11. **Settings**: Configurable currency symbols (₹, $, €, £, ¥, A$, C$) and database reset utility.

---

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Pytest, Uvicorn
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
- **Database**: SQLite3
- **Export**: Python Native CSV

---

## Project Structure

```
money-manager/
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy ORM Models
│   │   ├── schemas/          # Pydantic Request/Response Schemas
│   │   ├── routes/           # FastAPI API Endpoints
│   │   ├── services/         # Calculation, Idempotency & CSV Engines
│   │   ├── utils/            # Seeding & Helpers
│   │   ├── database.py       # DB Connection & Session Setup
│   │   └── main.py           # FastAPI Application Entrypoint
│   ├── tests/                # Pytest Unit & Integration Test Suite
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Common UI Components & Layouts
│   │   ├── context/          # CurrencyContext
│   │   ├── pages/            # 12 Core Module Pages
│   │   ├── services/         # API Axios Client
│   │   ├── utils/            # Formatters & Helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## Local Setup & Installation

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (with npm)

### 2. Backend Setup & Run

Navigate to the project root and set up the Python virtual environment:

```bash
# Create virtual environment
python -m venv backend/venv

# Activate virtual environment (Windows)
backend\venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will run at `http://127.0.0.1:8000`.  
Swagger API Documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup & Run

Open a new terminal window in the project root:

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
Frontend web app will run at `http://localhost:5173`.

---

## Running Automated Tests

Run the complete Pytest test suite:

```bash
# From project root
backend\venv\Scripts\python -m pytest backend/tests/ -v
```

---

## API Overview

- `GET /api/dashboard?month=YYYY-MM` - Monthly financial summary & charts data
- `GET /api/transactions` - Filtered transactions list
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction
- `GET /api/categories` - Categories list
- `POST /api/categories` - Create custom category
- `GET /api/budgets?month=YYYY-MM` - Monthly budget limits & spend status
- `POST /api/budgets` - Save budget limit
- `GET /api/recurring` - Recurring schedules
- `POST /api/recurring/process` - Idempotent processing trigger
- `GET /api/emis` - EMI loans list
- `POST /api/emis/{id}/pay` - Record EMI installment payment
- `GET /api/sips` - SIP investments portfolio
- `GET /api/goals` - Savings goals list
- `GET /api/analytics` - Financial analytics & trends
- `GET /api/export/{transactions|income|expenses|emis|sips|goals}` - Download CSV

---

## Future Improvements

- JWT Authentication & Multi-user support
- Multi-currency conversion via fixed rates
- Automated bank statement PDF import parser
