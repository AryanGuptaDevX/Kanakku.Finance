def test_budget_calculations(client):
    exp_cats = client.get("/api/categories?type=expense").json()
    food_cat = next(c for c in exp_cats if c["name"] == "Food")
    month = "2026-09"

    # Set Food budget to 2,000
    b_res = client.post("/api/budgets", json={
        "month": month,
        "category_id": food_cat["id"],
        "amount": 2000.0
    })
    assert b_res.status_code == 201

    # Log food expense of 1,200
    client.post("/api/transactions", json={
        "type": "expense",
        "amount": 1200.0,
        "source_or_payee": "Diner",
        "category_id": food_cat["id"],
        "date": f"{month}-10"
    })

    # Fetch budgets for month
    get_res = client.get(f"/api/budgets?month={month}")
    assert get_res.status_code == 200
    budgets = get_res.json()
    food_b = next(b for b in budgets if b["category_id"] == food_cat["id"])

    assert food_b["amount"] == 2000.0
    assert food_b["spent"] == 1200.0
    assert food_b["remaining"] == 800.0
    assert food_b["percentage"] == 60.0
