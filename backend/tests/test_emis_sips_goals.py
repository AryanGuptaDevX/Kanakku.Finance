def test_emi_payment_flow(client):
    res = client.post("/api/emis", json={
        "loan_name": "Gadget EMI",
        "principal_amount": 12000.0,
        "monthly_payment": 1000.0,
        "interest_rate": 0.0,
        "start_date": "2026-01-01",
        "due_day": 10,
        "total_payments": 12
    })
    assert res.status_code == 201
    emi_id = res.json()["id"]

    # Record 1 payment
    pay_res = client.post(f"/api/emis/{emi_id}/pay", json={})
    assert pay_res.status_code == 200
    emi_data = pay_res.json()
    assert emi_data["payments_made"] == 1
    assert emi_data["payments_remaining"] == 11
    assert emi_data["remaining_amount"] == 11000.0
    assert emi_data["progress_percentage"] == 8.3

def test_sip_roi_calculation(client):
    res = client.post("/api/sips", json={
        "fund_name": "Index Fund",
        "monthly_amount": 1000.0,
        "start_date": "2026-01-01",
        "total_invested": 10000.0,
        "current_value": 12500.0
    })
    assert res.status_code == 201
    sip_data = res.json()
    assert sip_data["profit_loss"] == 2500.0
    assert sip_data["return_percentage"] == 25.0

def test_savings_goal_progress(client):
    res = client.post("/api/goals", json={
        "goal_name": "Gaming Laptop",
        "target_amount": 100000.0,
        "current_savings": 42000.0,
        "target_date": "2027-01-01",
        "description": "High end PC"
    })
    assert res.status_code == 201
    goal_data = res.json()
    assert goal_data["remaining_amount"] == 58000.0
    assert goal_data["progress_percentage"] == 42.0
    assert goal_data["is_completed"] is False
