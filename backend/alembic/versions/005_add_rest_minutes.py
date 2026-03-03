"""add rest_minutes to session_history

Revision ID: 005_add_rest_minutes
Revises: 004
Create Date: 2026-02-25 14:23:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_add_rest_minutes'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'session_history',
        sa.Column('rest_minutes', sa.Integer(), nullable=False, server_default='0')
    )


def downgrade() -> None:
    op.drop_column('session_history', 'rest_minutes')
