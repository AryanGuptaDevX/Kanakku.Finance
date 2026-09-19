import pytest

def test_accounts_and_transfers(client):
    # 1. Get default accounts
    res = client.get("/api/accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) >= 2
    bank_id = accounts[0]["id"]
    cash_id = accounts[1]["id"]
    initial_bank_bal = accounts[0]["current_balance"]
    initial_cash_bal = accounts[1]["current_balance"]

    # 2. Transfer 500 from Bank to Cash
    t_res = client.post(
        f"/api/accounts/transfer?from_account_id={bank_id}&to_account_id={cash_id}&amount=500.0&description=ATM%20Withdrawal"
    )
    assert t_res.status_code == 201
    transfer_data = t_res.json()
    assert transfer_data["type"] == "transfer"
    assert transfer_data["amount"] == 500.0

    # 3. Check updated balances
    acc_res = client.get("/api/accounts")
    updated_accs = {a["id"]: a["current_balance"] for a in acc_res.json()}
    assert updated_accs[bank_id] == initial_bank_bal - 500.0
    assert updated_accs[cash_id] == initial_cash_bal + 500.0

    # 4. Verify transfer did not inflate income or expenses in dashboard
    dash = client.get("/api/dashboard").json()
    assert dash["total_income"] == 0.0
    assert dash["total_expenses"] == 0.0

def test_auth_flow(client):
    # Register user
    reg_res = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepassword123",
        "full_name": "Test User"
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    token = reg_data["access_token"]
    assert reg_data["user"]["email"] == "test@example.com"

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "securepassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Get Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test@example.com"

def test_backup_and_restore(client):
    # Create category and transaction
    cat_res = client.post("/api/categories", json={"name": "Test Cat", "type": "income", "color": "#000000"})
    cat_id = cat_res.json()["id"]
    client.post("/api/transactions", json={
        "type": "income",
        "amount": 1200.0,
        "source_or_payee": "Freelance",
        "category_id": cat_id,
        "date": "2026-09-01"
    })

    # Backup
    b_res = client.get("/api/settings/backup")
    assert b_res.status_code == 200
    backup_json = b_res.json()
    assert "categories" in backup_json
    assert "transactions" in backup_json
    assert len(backup_json["transactions"]) >= 1

    # Wipe and Restore
    r_res = client.post("/api/settings/restore", json=backup_json)
    assert r_res.status_code == 200

    # Verify transactions restored
    tx_res = client.get("/api/transactions")
    assert len(tx_res.json()) >= 1

def test_strict_recurring_schedule_validation(client):
    cat_res = client.get("/api/categories")
    cat_id = cat_res.json()[0]["id"]

    # Weekly missing day_of_week should fail
    w_bad = client.post("/api/recurring", json={
        "title": "Gym", "type": "expense", "amount": 100.0, "category_id": cat_id, "frequency": "weekly"
    })
    assert w_bad.status_code == 422

    # Weekly with valid day_of_week (0=Monday) should succeed
    w_good = client.post("/api/recurring", json={
        "title": "Gym", "type": "expense", "amount": 100.0, "category_id": cat_id, "frequency": "weekly", "day_of_week": 0
    })
    assert w_good.status_code == 201
