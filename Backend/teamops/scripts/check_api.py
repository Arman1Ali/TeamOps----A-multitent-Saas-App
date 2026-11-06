"""End-to-end check of the joined backend.

Drives the real API, in a real request cycle, against the development
Postgres. Every assertion is a bug that was found by asking the running
service instead of reading the code: the broken call chains, the tenant leak,
the member who could delete a project, the refresh token that could be replayed.

Nothing here is left behind: whatever it creates, it removes again, using the
same endpoints it is testing.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.curd.company import delete_company
from app.db.session import SessionLocal
from app.main import app
from app.models.company import Company

STAMP = "e2e-check"

# Clear out anything an earlier, interrupted run left behind, so the counts
# asserted below describe this run and not a previous crash.
_db = SessionLocal()
for _leftover in _db.query(Company).filter(Company.name.like(f"{STAMP}%")).all():
    delete_company(db=_db, company_id=_leftover.id)
_db.close()

client = TestClient(app)

passed = 0
failed = []


def check(label: str, condition: bool, extra: str = "") -> None:
    global passed

    if condition:
        passed += 1
        print(f"  ok   {label}")
    else:
        failed.append(label)
        print(f"  FAIL {label} {extra}")


def login(email: str, password: str = "demo1234") -> dict:
    """Sign in and return the auth headers plus the refresh token."""
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})

    assert response.status_code == 200, f"login {email}: {response.status_code} {response.text}"

    body = response.json()

    return {
        "headers": {"Authorization": f"Bearer {body['access_token']}"},
        "refresh": body["refresh_token"],
    }


print("\n1. health")
# How many workspaces the admin can see before this run touches anything. The
# development database holds workspaces from before the demo data was seeded,
# so the cleanup check near the end compares against this rather than a fixed
# number.
BASELINE_COMPANIES = len(
    client.get("/api/v1/companies", headers=login("ravi@northwind.test")["headers"]).json()
)

response = client.get("/health")
check("GET /health says ok", response.status_code == 200 and response.json()["status"] == "ok", response.text)

response = client.get("/health/db")
check("GET /health/db reaches Postgres", response.json().get("database") == "connected", response.text)


print("\n2. signing in, and who the token belongs to")
alex = login("alex@northwind.test")
check("owner can sign in with a hashed password", bool(alex["headers"]))

response = client.get("/api/v1/auth/me", headers=alex["headers"])
me = response.json()
check("GET /auth/me names the workspace", me["company"]["name"] == "Northwind Studio", response.text)
check("role comes back", me["role"] == "owner", response.text)
check("initials are derived, not stored", me["initials"] == "AM", response.text)
check("no password in any response", "password" not in me, response.text)

response = client.get("/api/v1/auth/me")
check("a request with no token is refused", response.status_code == 401, response.text)

response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
check("a forged token is refused", response.status_code == 401, response.text)

response = client.post("/api/v1/auth/login", json={"email": "nobody@northwind.test", "password": "whatever1"})
unknown_email = response.json()["detail"]
response = client.post("/api/v1/auth/login", json={"email": "alex@northwind.test", "password": "wrongpassword"})
check("a wrong password is 401", response.status_code == 401, response.text)
check(
    "unknown address and wrong password sound the same",
    response.json()["detail"] == unknown_email,
    f"{response.json()['detail']!r} vs {unknown_email!r}",
)


print("\n3. one workspace cannot see another")
response = client.get("/api/v1/projects", headers=alex["headers"], params={"limit": 50})
northwind = response.json()
check("projects are listed", len(northwind) == 3, f"got {len(northwind)}")
check("every listed project is Northwind's", all(p["company_id"] == me["company_id"] for p in northwind))

atlas = login("maya@atlas.test")
response = client.get("/api/v1/projects", headers=atlas["headers"], params={"limit": 50})
atlas_projects = response.json()
check("the other tenant sees only its own", len(atlas_projects) == 2, f"got {len(atlas_projects)}")

foreign_id = atlas_projects[0]["id"]
response = client.get(f"/api/v1/projects/{foreign_id}", headers=alex["headers"])
check("reading another workspace's project by id is refused", response.status_code == 403, response.text)

response = client.get("/api/v1/projects", headers=alex["headers"], params={"company_id": atlas_projects[0]["company_id"]})
check("naming another company in the query string is refused", response.status_code == 403, response.text)

response = client.get("/api/v1/tasks", headers=alex["headers"], params={"limit": 100})
task_projects = {t["project_id"] for t in response.json()}
check("no task from another workspace leaks through", foreign_id not in task_projects)
check("a task names its project", all("name" in t["project"] for t in response.json()))
check("a task names its assignee", response.json()[0]["assignee"] is not None)


print("\n4. what a plain member may and may not do")
sung = login("sung@northwind.test")
response = client.get("/api/v1/projects", headers=sung["headers"], params={"limit": 50})
check("a member may read the projects", response.status_code == 200, response.text)

project_id = northwind[0]["id"]
response = client.delete(f"/api/v1/projects/{project_id}", headers=sung["headers"])
check("a member may not delete a project", response.status_code == 403, response.text)

response = client.put(f"/api/v1/projects/{project_id}", headers=sung["headers"], json={"progress": 99})
check("a member may not change a project", response.status_code == 403, response.text)

response = client.get("/api/v1/users", headers=sung["headers"], params={"limit": 50})
check("a member may read the roster", response.status_code == 200, response.text)

response = client.post("/api/v1/users", headers=sung["headers"], json={
    "name": "Sneak Invite", "email": "sneak@northwind.test", "password": "demo1234"})
check("a member may not invite people", response.status_code == 403, response.text)


print("\n5. a member may finish the work assigned to them")
sung_me = client.get("/api/v1/auth/me", headers=sung["headers"]).json()
response = client.get("/api/v1/tasks", headers=alex["headers"], params={"assigned_to": sung_me["id"], "limit": 50})
mine = response.json()
check("tasks can be filtered to one person", len(mine) > 0 and all(t["assigned_to"] == sung_me["id"] for t in mine), response.text)

target = mine[0]
response = client.put(f"/api/v1/tasks/{target['id']}", headers=sung["headers"], json={"status": "Done"})
check("the assigned teammate can tick a task off", response.status_code == 200, response.text)
check("the tick actually stuck", response.json()["status"] == "Done")

# Put it back exactly as it was found, so this run leaves no trace.
response = client.put(f"/api/v1/tasks/{target['id']}", headers=alex["headers"], json={"status": target["status"]})
check("restoring the task worked", response.json()["status"] == target["status"])

priya = login("priya@northwind.test")
response = client.put(f"/api/v1/tasks/{target['id']}", headers=priya["headers"], json={"status": "To do"})
check("a teammate who does not hold the task cannot change it", response.status_code == 403, response.text)


print("\n6. creating, patching, and removing")
response = client.post("/api/v1/projects", headers=alex["headers"], json={
    "name": "Temporary check project", "description": "Made by the end-to-end check.",
    "status": "On track", "progress": 0, "due_date": "2030-01-15"})
check("creating a project is 201", response.status_code == 201, response.text)
new_project = response.json()
check("it landed in the caller's workspace", new_project["company_id"] == me["company_id"])
check("status and progress came back", new_project["status"] == "On track" and new_project["progress"] == 0)

response = client.post("/api/v1/projects", headers=alex["headers"], json={
    "name": "Cross-tenant attempt", "description": "Should not land in Atlas", "company_id": 999})
check("company_id in the body cannot file work elsewhere",
      client.get(f"/api/v1/projects/{response.json()['id']}", headers=alex["headers"]).json()["company_id"] == me["company_id"],
      response.text)
temp_second = response.json()["id"]

response = client.put(f"/api/v1/projects/{new_project['id']}", headers=alex["headers"], json={"progress": 45})
check("a patch changes only what it sends", response.json()["progress"] == 45 and response.json()["name"] == "Temporary check project")

response = client.put(f"/api/v1/projects/{new_project['id']}", headers=alex["headers"], json={"progress": 200})
check("progress over 100 is rejected", response.status_code == 422, response.text)

response = client.put(f"/api/v1/projects/{new_project['id']}", headers=alex["headers"], json={"status": "Nonsense"})
check("an unknown status is rejected", response.status_code == 422, response.text)

response = client.post("/api/v1/tasks", headers=alex["headers"], json={
    "title": "Task made by the check", "description": "Short lived.",
    "priority": "High", "project_id": new_project["id"], "assigned_to": sung_me["id"]})
check("creating a task is 201", response.status_code == 201, response.text)
new_task = response.json()
check("the task shows the assignee's initials", new_task["assignee"]["initials"] == sung_me["initials"], response.text)

response = client.post("/api/v1/tasks", headers=alex["headers"], json={
    "title": "Into a foreign project", "project_id": foreign_id})
check("a task cannot be filed in another workspace's project", response.status_code == 403, response.text)

response = client.post("/api/v1/tasks", headers=alex["headers"], json={
    "title": "Assigned to another tenant", "project_id": new_project["id"], "assigned_to": 999})
check("a task cannot be given to somebody from another workspace", response.status_code in (403, 404), response.text)

response = client.put(f"/api/v1/tasks/{new_task['id']}", headers=alex["headers"], json={"assigned_to": None})
check("sending null unassigns a task", response.json()["assigned_to"] is None, response.text)

response = client.delete(f"/api/v1/tasks/{new_task['id']}", headers=alex["headers"])
check("deleting a task returns a message", response.status_code == 200 and "message" in response.json(), response.text)

response = client.get(f"/api/v1/tasks/{new_task['id']}", headers=alex["headers"])
check("the deleted task is gone", response.status_code == 404, response.text)

response = client.delete(f"/api/v1/projects/{new_project['id']}", headers=alex["headers"])
check("the owner can delete a project", response.status_code == 200, response.text)

response = client.get(f"/api/v1/projects/{new_project['id']}", headers=alex["headers"])
check("and it really is gone", response.status_code == 404, response.text)

client.delete(f"/api/v1/projects/{temp_second}", headers=alex["headers"])


print("\n7. refresh rotation and signing out")
fresh = login("alex@northwind.test")
response = client.post("/api/v1/auth/refresh", json={"refresh_token": fresh["refresh"]})
check("a refresh token yields a new pair", response.status_code == 200, response.text)
rotated = response.json()
check("the new refresh token is different", rotated["refresh_token"] != fresh["refresh"])

response = client.post("/api/v1/auth/refresh", json={"refresh_token": fresh["refresh"]})
check("the old one cannot be used twice", response.status_code == 401, response.text)

response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {rotated['access_token']}"})
check("the fresh access token works", response.status_code == 200, response.text)

response = client.post("/api/v1/auth/logout", json={"refresh_token": rotated["refresh_token"]})
check("logout reports plainly", response.status_code == 200, response.text)

response = client.post("/api/v1/auth/refresh", json={"refresh_token": rotated["refresh_token"]})
check("a signed-out token is dead", response.status_code == 401, response.text)

response = client.post("/api/v1/auth/logout", json={"refresh_token": "never-issued"})
check("signing out twice is not an error", response.status_code == 200, response.text)


print("\n8. signing up is now possible")
stamp = STAMP
response = client.post("/api/v1/auth/register", json={
    "company_name": f"{stamp} Workspace", "name": "Brand New Owner",
    "email": f"owner@{stamp}.test", "password": "demo1234"})
check("register creates a workspace and signs the owner in", response.status_code == 201, response.text)
signup = response.json()

new_headers = {"Authorization": f"Bearer {signup['access_token']}"}
response = client.get("/api/v1/auth/me", headers=new_headers)
check("the new owner is in the new workspace", response.json()["company"]["name"] == f"{stamp} Workspace", response.text)
check("the new owner really is the owner", response.json()["role"] == "owner", response.text)
check("a brand new workspace has nothing in it", client.get("/api/v1/projects", headers=new_headers).json() == [])

response = client.post("/api/v1/auth/register", json={
    "company_name": "Second Attempt", "name": "Same Email",
    "email": f"owner@{stamp}.test", "password": "demo1234"})
check("a taken email address is refused", response.status_code == 409, response.text)

response = client.post("/api/v1/auth/register", json={
    "company_name": f"{stamp} Again", "name": "Short Password",
    "email": f"other@{stamp}.test", "password": "abc"})
check("a short password is refused", response.status_code == 422, response.text)

response = client.post("/api/v1/auth/register", json={
    "company_name": f"{stamp} Third", "name": "Bad Email",
    "email": "not-an-email", "password": "demo1234"})
check("a malformed email is refused", response.status_code == 422, response.text)


print("\n9. an admin may cross the boundary, and cleanup")
ravi = login("ravi@northwind.test")
response = client.get("/api/v1/companies", headers=ravi["headers"])
check("an admin lists every workspace", response.status_code == 200 and len(response.json()) >= 3, response.text)

response = client.get("/api/v1/companies", headers=alex["headers"])
check("an owner lists only their own", len(response.json()) == 1, response.text)

# The workspace register() made above is removed by the admin, which is also
# the only way to test DELETE /companies: nobody may erase the workspace they
# are signed in to.
new_company_id = client.get("/api/v1/auth/me", headers=new_headers).json()["company_id"]
response = client.delete(f"/api/v1/companies/{new_company_id}", headers=new_headers)
check("an owner cannot delete their own workspace", response.status_code == 400, response.text)

response = client.delete(f"/api/v1/companies/{new_company_id}", headers=ravi["headers"])
check("an admin can delete it", response.status_code == 200, response.text)

response = client.post("/api/v1/auth/login", json={"email": f"owner@{stamp}.test", "password": "demo1234"})
check("and its owner is gone with it", response.status_code == 401, response.text)

response = client.get("/api/v1/companies", headers=ravi["headers"])
check(
    "the workspace count is back to where it started",
    len(response.json()) == BASELINE_COMPANIES,
    f"{len(response.json())} vs {BASELINE_COMPANIES}",
)


print("\n10. the shape the frontend reads")
response = client.get("/api/v1/projects", headers=alex["headers"], params={"limit": 50})
first = response.json()[0]
check("a project carries status, progress and due_date",
      {"status", "progress", "due_date"} <= set(first), str(sorted(first)))

response = client.get("/api/v1/tasks", headers=alex["headers"], params={"limit": 50, "sort": "due_date"})
ordered = [t["due_date"] for t in response.json()]
check("tasks sort by due date", ordered == sorted(ordered, key=lambda d: d or "9999"), str(ordered))

response = client.get("/api/v1/tasks", headers=alex["headers"], params={"search": "Offline", "limit": 50})
check("a task search finds the right one", len(response.json()) == 1, response.text)

response = client.get("/api/v1/companies/{company_id}".format(company_id=me["company_id"]), headers=alex["headers"])
team = response.json()
check("a workspace detail lists its people", len(team["users"]) == 5, response.text)
check("and its projects", len(team["projects"]) == 3, response.text)


print(f"\n{passed} checks passed, {len(failed)} failed")
for label in failed:
    print("  failed:", label)

sys.exit(1 if failed else 0)
