def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_subscribe_success(client):
    res = client.post("/api/newsletter/subscribe", json={"email": "user@example.com"})
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "user@example.com"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data


def test_subscribe_duplicate_returns_201(client):
    client.post("/api/newsletter/subscribe", json={"email": "dup@example.com"})
    res = client.post("/api/newsletter/subscribe", json={"email": "dup@example.com"})
    assert res.status_code == 201


def test_subscribe_invalid_email_returns_422(client):
    res = client.post("/api/newsletter/subscribe", json={"email": "not-an-email"})
    assert res.status_code == 422


def test_subscribe_missing_email_returns_422(client):
    res = client.post("/api/newsletter/subscribe", json={})
    assert res.status_code == 422
