"""Fill the development database with data worth looking at.

Run it from Backend/teamops, with the Postgres container up:

    python scripts/seed_demo_data.py

Why this exists: the API and the frontend are now joined, and an empty database
means every screen shows a blank state. That is hard to tell apart from a
broken connection. This script puts two workspaces, their people, projects and
tasks in place so the screens have something to draw - and two workspaces
rather than one, so the multi-tenant rule can be seen working: sign in as
Northwind and Atlas is simply not there.

It writes through the same model and schema layers the API uses, so anything
that has drifted - a missing column, a rejected value - shows up here rather
than in a browser.

It is careful about your data:
  * it only adds. Nothing here deletes or overwrites an existing row;
  * if "Northwind Studio" is already present it stops and says so, rather than
    filing a second set of demo rows beside the first.

Passwords are the same on every account, and they are demo passwords. The point
is to have something to type into the login box while developing, not to
protect anything. Change DEMO_PASSWORD before running this anywhere that is not
your own machine.
"""

import sys
from datetime import date, timedelta
from pathlib import Path

# Make `import app...` work when the script is run from Backend/teamops, and
# also when it is run by its full path from somewhere else.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.company import Company
from app.models.project import Project
from app.models.task import Task
from app.models.user import User

DEMO_PASSWORD = "demo1234"

# Two tenants, so cross-company isolation can be tested by signing in to one
# and checking that the other is invisible.
WORKSPACES = [
    {
        "name": "Northwind Studio",
        "people": [
            ("Alex Morgan", "alex@northwind.test", "owner"),
            ("Sung Arman", "sung@northwind.test", "member"),
            ("Priya Nair", "priya@northwind.test", "member"),
            ("Jonas Weber", "jonas@northwind.test", "member"),
            # A platform admin sits in a workspace like anybody else; what makes
            # it different is the role, which is what lets it list both
            # workspaces at once.
            ("Ravi Shah", "ravi@northwind.test", "admin"),
        ],
        "projects": [
            {
                "name": "Mobile app redesign",
                "description": "New navigation, a quieter colour palette, and "
                "offline reading for the task list.",
                "status": "At risk",
                "progress": 62,
                "due_offset": 12,
                "tasks": [
                    ("Rework the project card", "Done", "High", 0, 2),
                    ("Offline cache for the task list", "In progress", "High", 1, -1),
                    ("Pick a colour palette that passes contrast", "To do", "Medium", 2, 5),
                    ("Empty states for every screen", "To do", "Low", 3, 9),
                ],
            },
            {
                "name": "Billing rewrite",
                "description": "Move invoice generation behind a queue so a "
                "slow customer cannot stall the run.",
                "status": "On track",
                "progress": 35,
                "due_offset": 30,
                "tasks": [
                    ("Sketch the queue design", "Done", "Medium", 1, -6),
                    ("Retry policy for failed invoices", "In progress", "High", 1, 3),
                    ("Write the migration for ledger rows", "To do", "Medium", 2, 14),
                ],
            },
            {
                "name": "Internal wiki",
                "description": "One place for the decisions the team keeps "
                "re-making, indexed by who asked for them.",
                "status": "Blocked",
                "progress": 10,
                "due_offset": -4,
                "tasks": [
                    ("Choose between a wiki and plain markdown", "To do", "Low", 3, 0),
                    ("Agree who reviews new pages", "In progress", "Medium", 0, 7),
                ],
            },
        ],
    },
    {
        "name": "Atlas Works",
        "people": [
            ("Maya Lindqvist", "maya@atlas.test", "owner"),
            ("Tomas Silva", "tomas@atlas.test", "member"),
        ],
        "projects": [
            {
                "name": "Warehouse scanners",
                "description": "The handheld terminals need a screen that works "
                "in daylight and with gloves on.",
                "status": "On track",
                "progress": 78,
                "due_offset": 21,
                "tasks": [
                    ("Larger tap targets on the scan screen", "Done", "High", 0, -2),
                    ("Battery drain report", "In progress", "Medium", 1, 4),
                ],
            },
            {
                "name": "Delivery dashboard",
                "description": "One page the dispatch team can watch instead of "
                "four spreadsheets.",
                "status": "At risk",
                "progress": 20,
                "due_offset": 8,
                "tasks": [
                    ("Confirm which metrics dispatch actually reads", "To do", "High", 0, 1),
                    ("Map the spreadsheet imports", "To do", "Medium", 1, 6),
                ],
            },
        ],
    },
]


def already_seeded(db: Session) -> bool:
    """Is the demo data already in place?

    Judged on the first workspace's name alone: the script either ran before or
    it did not, and a half-seeded database is not a state this script can
    produce.
    """
    return db.query(Company).filter(Company.name == WORKSPACES[0]["name"]).first() is not None


def seed(db: Session) -> None:
    """Write every workspace in WORKSPACES, in order.

    People are looked up by email afterwards rather than kept in a list, because
    a task names its assignee by a position in the roster and that is easier to
    read in the data above than a variable holding an id.
    """
    # Local today on purpose (hence the suppressed timezone warning): these
    # deadlines are demo data meant to look right on the machine of whoever
    # is reading the screen, and a due_date is a plain date either way.
    today = date.today()  # noqa: DTZ011

    for workspace in WORKSPACES:
        company = Company(name=workspace["name"])

        db.add(company)
        db.flush()  # fills in company.id, still inside this one transaction

        for name, email, role in workspace["people"]:
            db.add(
                User(
                    name=name,
                    email=email,
                    password=hash_password(DEMO_PASSWORD),
                    role=role,
                    company_id=company.id,
                )
            )

        db.flush()  # the rows above need ids before a task can point at them

        members = db.query(User).filter(User.company_id == company.id).all()

        for spec in workspace["projects"]:
            project = Project(
                name=spec["name"],
                description=spec["description"],
                status=spec["status"],
                progress=spec["progress"],
                due_date=today + timedelta(days=spec["due_offset"]),
                company_id=company.id,
            )

            db.add(project)
            db.flush()

            for title, status, priority, member_index, due_offset in spec["tasks"]:
                db.add(
                    Task(
                        title=title,
                        description="Seeded as demo data. Edit it in the app - "
                        "this text only exists so the row has something to show.",
                        status=status,
                        priority=priority,
                        project_id=project.id,
                        # member_index walks the roster in the order it was
                        # written above, so a task can be given to a named
                        # person without hardcoding a database id.
                        assigned_to=members[member_index].id
                        if member_index < len(members)
                        else None,
                        due_date=today + timedelta(days=due_offset),
                    )
                )

        db.commit()

        print(f"  added workspace '{workspace['name']}'")


def main() -> None:
    db = SessionLocal()
    try:
        if already_seeded(db):
            print(
                "Demo data already present - nothing was changed.\n"
                "The script only ever adds, so it will not write a second set "
                "beside the first."
            )

            return

        print("Seeding demo workspaces...")

        seed(db)

        print(
            "\nDone. Sign in with any address listed in this script and the "
            f"password '{DEMO_PASSWORD}'."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
