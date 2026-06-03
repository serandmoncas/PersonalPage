"""create subscribers table

Revision ID: 001
Revises:
Create Date: 2026-06-03
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subscribers",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_subscribers_email", "subscribers", ["email"])


def downgrade() -> None:
    op.drop_index("ix_subscribers_email", table_name="subscribers")
    op.drop_table("subscribers")
