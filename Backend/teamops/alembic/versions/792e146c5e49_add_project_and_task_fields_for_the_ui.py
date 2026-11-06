"""Add the project and task fields the UI needs.

Revision ID: 792e146c5e49
Revises: c62d0cfc7cb1
Create Date: 2026-11-06 10:20:00.000000

What this migration does, and why:

1. projects gains status, progress and due_date. The frontend project card
   renders all three, but the table stored none of them.
2. task gains due_date for the same reason.
3. task.assigned_to changes from free text to a foreign key at users.id, so a
   task can be traced to a real person. Old text values that match a user name
   are converted; anything that cannot be matched becomes NULL, which simply
   means "unassigned". No row is deleted and no other column is touched.
4. Indexes are added on the columns every list query filters by. Postgres does
   not index foreign keys by itself.

Everything here is additive apart from the assigned_to type change, so the rows
already in the development database survive.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "792e146c5e49"
down_revision: Union[str, Sequence[str], None] = "c62d0cfc7cb1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply the schema changes described in the docstring above."""

    # --- 1. projects: the three columns the project card shows ---
    op.add_column(
        "projects",
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="On track",
        ),
    )
    op.add_column(
        "projects",
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("projects", sa.Column("due_date", sa.Date(), nullable=True))

    # The server defaults above are left in place on purpose: they keep rows
    # inserted by raw SQL valid, and app/models/project.py declares the same
    # defaults so Alembic sees no difference afterwards.

    # --- 2. task: due date ---
    op.add_column("task", sa.Column("due_date", sa.Date(), nullable=True))

    # --- 3. task.assigned_to: free text -> foreign key to users.id ---
    op.add_column("task", sa.Column("assigned_to_new", sa.Integer(), nullable=True))

    # Best effort: keep an assignment when the old text happens to be exactly
    # the name of a user in this database. Anything else stays NULL.
    op.execute(
        """
        UPDATE task
           SET assigned_to_new = (
               SELECT min(users.id)
                 FROM users
                WHERE users.name = task.assigned_to
           )
        """
    )

    op.drop_column("task", "assigned_to")
    op.alter_column(
        "task",
        "assigned_to_new",
        new_column_name="assigned_to",
        existing_type=sa.Integer(),
        existing_nullable=True,
    )
    op.create_foreign_key(
        "task_assigned_to_fkey", "task", "users", ["assigned_to"], ["id"]
    )

    # --- 4. indexes on the columns list queries filter by ---
    op.create_index("ix_projects_company_id", "projects", ["company_id"])
    op.create_index("ix_task_project_id", "task", ["project_id"])
    op.create_index("ix_task_assigned_to", "task", ["assigned_to"])
    op.create_index("ix_users_company_id", "users", ["company_id"])
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])


def downgrade() -> None:
    """Undo this migration and put the old columns back."""

    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_index("ix_users_company_id", table_name="users")
    op.drop_index("ix_task_assigned_to", table_name="task")
    op.drop_index("ix_task_project_id", table_name="task")
    op.drop_index("ix_projects_company_id", table_name="projects")

    # Rebuild assigned_to as the plain text column it was. Any real assignment
    # is written back as that user's name so nothing becomes silently blank.
    op.drop_constraint("task_assigned_to_fkey", "task", type_="foreignkey")
    op.alter_column(
        "task",
        "assigned_to",
        new_column_name="assigned_to_new",
        existing_type=sa.Integer(),
        existing_nullable=True,
    )
    op.add_column(
        "task",
        sa.Column(
            "assigned_to", sa.String(length=100), nullable=False, server_default=""
        ),
    )
    op.execute(
        """
        UPDATE task
           SET assigned_to = coalesce(
               (SELECT users.name FROM users WHERE users.id = task.assigned_to_new),
               ''
           )
        """
    )
    op.drop_column("task", "assigned_to_new")
    # The empty string default is left on the column: it only ever matters in
    # this rollback direction, and dropping it would need a second pass.

    op.drop_column("task", "due_date")
    op.drop_column("projects", "due_date")
    op.drop_column("projects", "progress")
    op.drop_column("projects", "status")
