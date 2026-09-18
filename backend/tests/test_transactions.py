def test_create_income_transaction(client):
    # Fetch default categories to get salary ID
    cat_res = client.get("/api/categories?type=income")
    assert cat_res.status_code == 200
    categories = cat_res.json()
    salary_cat = next(c for c in categories if c["name"] == "Salary")

    payload = {
        "type": "income",
        "amount": 20000.0,
        "source_or_payee": "Tech Corp Salary",
        "category_id": salary_cat["id"],
        "description": "September salary deposit",
        "date": "2026-09-01",
        "payment_method": "Bank Transfer"
    }

    res = client.post("/api/transactions", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["amount"] == 20000.0
    assert data["source_or_payee"] == "Tech Corp Salary"
    assert data["category"]["name"] == "Salary"

def test_create_expense_transaction(client):
    cat_res = client.get("/api/categories?type=expense")
    assert cat_res.status_code == 200
    food_cat = next(c for c in cat_res.json() if c["name"] == "Food")

    payload = {
        "type": "expense",
        "amount": 2500.0,
        "source_or_payee": "Supermarket Groceries",
        "category_id": food_cat["id"],
        "description": "Weekly grocery shopping",
        "date": "2026-09-05",
        "payment_method": "Credit Card"
    }

    res = client.post("/api/transactions", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["amount"] == 2500.0
    assert data["type"] == "expense"

def test_invalid_amount_validation(client):
    cat_res = client.get("/api/categories?type=expense")
    food_cat = cat_res.json()[0]

    payload = {
        "type": "expense",
        "amount": -500.0,  # Invalid negative amount
        "source_or_payee": "Test Payee",
        "category_id": food_cat["id"],
        "date": "2026-09-05"
    }

    res = client.post("/api/transactions", json=payload)
    assert res.status_code == 422  # Unprocessable entity / validation error

def test_delete_transaction(client):
    cat_res = client.get("/api/categories?type=income")
    cat = cat_res.json()[0]

    create_res = client.post("/api/transactions", json={
        "type": "income",
        "amount": 1000.0,
        "source_or_payee": "Temp Bonus",
        "category_id": cat["id"],
        "date": "2026-09-10"
    })
    tx_id = create_res.json()["id"]

    del_res = client.delete(f"/api/transactions/{tx_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/transactions/{tx_id}")
    assert get_res.status_code == 404
