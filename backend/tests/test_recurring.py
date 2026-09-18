def test_recurring_idempotency(client):
    inc_cats = client.get("/api/categories?type=income").json()
    salary_cat = inc_cats[0]

    # Create monthly recurring salary
    client.post("/api/recurring", json={
        "title": "Monthly Salary",
        "type": "income",
        "amount": 25000.0,
        "category_id": salary_cat["id"],
        "frequency": "monthly",
        "day_of_month": 1,
        "is_active": True
    })

    # Trigger process for 2026-09
    proc1 = client.post("/api/recurring/process?month=2026-09")
    assert proc1.status_code == 200

    txs1 = client.get("/api/transactions?month=2026-09").json()
    rec_txs_count_1 = len([t for t in txs1 if t["source_or_payee"] == "Monthly Salary"])
    assert rec_txs_count_1 >= 1

    # Trigger process AGAIN for the same month 2026-09 (Idempotency test!)
    proc2 = client.post("/api/recurring/process?month=2026-09")
    assert proc2.status_code == 200
    assert proc2.json()["created_count"] == 0  # No duplicate transactions created!

    txs2 = client.get("/api/transactions?month=2026-09").json()
    rec_txs_count_2 = len([t for t in txs2 if t["source_or_payee"] == "Monthly Salary"])
    assert rec_txs_count_2 == rec_txs_count_1  # Exact match, zero duplicates!
