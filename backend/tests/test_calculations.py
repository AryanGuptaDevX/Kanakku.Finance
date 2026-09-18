def test_dashboard_calculations(client):
    # Get categories
    inc_cats = client.get("/api/categories?type=income").json()
    exp_cats = client.get("/api/categories?type=expense").json()
    salary_cat = next(c for c in inc_cats if c["name"] == "Salary")
    food_cat = next(c for c in exp_cats if c["name"] == "Food")

    month = "2026-09"

    # Add Income = 20,000
    client.post("/api/transactions", json={
        "type": "income",
        "amount": 20000.0,
        "source_or_payee": "Salary",
        "category_id": salary_cat["id"],
        "date": f"{month}-01"
    })

    # Add Expenses = 7,500
    client.post("/api/transactions", json={
        "type": "expense",
        "amount": 7500.0,
        "source_or_payee": "Supermarket",
        "category_id": food_cat["id"],
        "date": f"{month}-05"
    })

    # Add EMI = 3,000 / month
    client.post("/api/emis", json={
        "loan_name": "Laptop Loan",
        "principal_amount": 36000.0,
        "monthly_payment": 3000.0,
        "interest_rate": 10.0,
        "start_date": f"{month}-01",
        "due_day": 5,
        "total_payments": 12
    })

    # Add SIP = 500 / month
    client.post("/api/sips", json={
        "fund_name": "Equity Mutual Fund",
        "monthly_amount": 500.0,
        "start_date": f"{month}-01",
        "total_invested": 5000.0,
        "current_value": 5800.0
    })

    # Request Dashboard summary
    dash_res = client.get(f"/api/dashboard?month={month}")
    assert dash_res.status_code == 200
    summary = dash_res.json()

    assert summary["total_income"] == 20000.0
    assert summary["total_expenses"] == 7500.0
    assert summary["total_emi"] == 3000.0
    assert summary["total_sip"] == 500.0

    # Available Balance = 20,000 - 7,500 - 3,000 - 500 = 9,000
    assert summary["available_balance"] == 9000.0

    # Savings Rate = (9,000 / 20,000) * 100 = 45.0%
    assert summary["savings_rate"] == 45.0

def test_zero_income_division_by_zero_prevention(client):
    month = "2026-10"
    dash_res = client.get(f"/api/dashboard?month={month}")
    assert dash_res.status_code == 200
    summary = dash_res.json()
    assert summary["total_income"] == 0.0
    assert summary["savings_rate"] == 0.0  # Must not crash or return NaN!
