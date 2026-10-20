"""Smoke checks for the isolated local/CI Docker rehearsal; no production access."""

import json
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen
from uuid import uuid4


def check(path, expected_status=200):
    try:
        response = urlopen(f"http://127.0.0.1:18080{path}", timeout=10)
    except HTTPError as error:
        response = error
    with response:
        assert response.status == expected_status, (path, response.status)
        return response.headers, response.read().decode()


_, landing = check("/")
assert "Workout Tracker" in landing
_, logo = check("/logo.svg")
assert "<svg" in logo
for path in ("/login", "/dashboard", "/workouts/1", "/verify-email"):
    headers, _ = check(path)
    assert headers.get("X-Robots-Tag") == "noindex, nofollow", path
_, csrf = check("/api/auth/csrf")
assert json.loads(csrf)["token"]
check("/api/workouts", 401)
check("/actuator/health", 404)
with urlopen("http://127.0.0.1:18081/actuator/health", timeout=10) as response:
    assert json.load(response)["status"] == "UP"

# Exercise session cookies, CSRF protection, and a database write through Nginx.
browser = build_opener(HTTPCookieProcessor(CookieJar()))


def api(path, method="GET", body=None):
    headers = {}
    if method != "GET":
        with browser.open("http://127.0.0.1:18080/api/auth/csrf", timeout=10) as response:
            token = json.load(response)
        headers[token["headerName"]] = token["token"]
        headers["Content-Type"] = "application/json"
    request = Request(
        f"http://127.0.0.1:18080/api{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    with browser.open(request, timeout=10) as response:
        content = response.read()
        return json.loads(content) if content else None


username = f"preview_{uuid4().hex[:12]}"
password = uuid4().hex
api("/auth/register", "POST", {
    "username": username,
    "email": f"{username}@example.invalid",
    "password": password,
})
api("/auth/login", "POST", {"username": username, "password": password})
try:
    assert api("/auth/me")["username"] == username
    exercise = api("/exercises", "POST", {
        "name": "Container Smoke Exercise",
        "trainingType": "STRENGTH",
        "muscleGroup": "Chest",
        "category": "Strength",
    })
    assert exercise["id"]
    assert any(item["id"] == exercise["id"] for item in api("/exercises"))
finally:
    api("/auth/account", "DELETE", {"currentPassword": password})
print("Container checks passed: routes, logo, health, registration, session, CSRF, and database write.")
