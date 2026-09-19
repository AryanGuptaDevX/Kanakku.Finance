import pytest

def test_category_deletion_protection(client):
    # 1. Create a custom category
    cat_create = client.post("/api/categories", json={
        "name": "Custom Subscriptions",
        "type": "expense",
        "icon": "tag",
        "color": "#3b82f6"
    })
    assert cat_create.status_code == 201
    cat_id = cat_create.json()["id"]

    # 2. Create a transaction linked to this custom category
    tx_res = client.post("/api/transactions", json={
        "type": "expense",
        "amount": 150.0,
        "source_or_payee": "Streaming Service",
        "category_id": cat_id,
        "date": "2026-09-15"
    })
    assert tx_res.status_code == 201

    # 3. Attempt to delete category in use -> Should return 400 Bad Request
    del_res = client.delete(f"/api/categories/{cat_id}")
    assert del_res.status_code == 400
    assert "currently using it" in del_res.json()["detail"]

def test_transaction_update_category_type_validation(client):
    # Get income category and expense category
    inc_cat = client.get("/api/categories?type=income").json()[0]["id"]
    exp_cat = client.get("/api/categories?type=expense").json()[0]["id"]

    # Create income transaction
    tx_res = client.post("/api/transactions", json={
        "type": "income",
        "amount": 5000.0,
        "source_or_payee": "Consulting",
        "category_id": inc_cat,
        "date": "2026-09-10"
    })
    assert tx_res.status_code == 201
    tx_id = tx_res.json()["id"]

    # Attempt to update transaction category to expense category without changing type -> Should fail
    upd_res = client.put(f"/api/transactions/{tx_id}", json={
        "category_id": exp_cat
    })
    assert upd_res.status_code == 400
    assert "does not match transaction type" in upd_res.json()["detail"]

def test_emi_overpayment_prevention(client):
    # Create EMI loan
    emi_res = client.post("/api/emis", json={
        "loan_name": "Test Phone Finance",
        "principal_amount": 5000.0,
        "monthly_payment": 1000.0,
        "interest_rate": 12.0,
        "start_date": "2026-09-01",
        "due_day": 5,
        "total_payments": 5
    })
    assert emi_res.status_code == 201
    emi_id = emi_res.json()["id"]

    # Attempt to pay 10000 -> Should be blocked as overpayment
    pay_res = client.post(f"/api/emis/{emi_id}/pay", json={
        "amount": 10000.0
    })
    assert pay_res.status_code == 400
    assert "cannot exceed total remaining balance" in pay_res.json()["detail"]

def test_goal_past_target_date_validation(client):
    # Attempt to create goal with past date
    res = client.post("/api/goals", json={
        "goal_name": "Past Trip",
        "target_amount": 50000.0,
        "current_savings": 0.0,
        "target_date": "2020-01-01"
    })
    assert res.status_code == 400
    assert "Target date cannot be in the past" in res.json()["detail"]

def test_reset_db_protection(client):
    # Attempt reset without confirm code -> Should fail
    res1 = client.post("/api/settings/reset-data", json={"confirm_code": "WRONG"})
    assert res1.status_code == 400

    # Attempt reset with correct confirm code -> Should pass
    res2 = client.post("/api/settings/reset-data", json={"confirm_code": "RESET"})
    assert res2.status_code == 200
    assert "reset successfully" in res2.json()["message"]

def test_sip_deposit_contribution(client):
    sip_res = client.post("/api/sips", json={
        "fund_name": "Equity Flexi Fund",
        "monthly_amount": 2000.0,
        "start_date": "2026-01-01",
        "total_invested": 10000.0,
        "current_value": 11000.0,
        "is_active": True
    })
    assert sip_res.status_code == 201
    sip_id = sip_res.json()["id"]

    # Make contribution deposit
    contrib_res = client.post(f"/api/sips/{sip_id}/contribute", json={
        "amount": 2000.0,
        "date": "2026-09-15",
        "create_transaction": True
    })
    assert contrib_res.status_code == 200
    updated_sip = contrib_res.json()
    assert updated_sip["total_invested"] == 12000.0
    assert updated_sip["current_value"] == 13000.0
