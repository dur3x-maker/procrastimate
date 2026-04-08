"""add idempotency_key and client_session_id to task_events

Revision ID: 007
Revises: 006
Create Date: 2026-04-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('task_events', sa.Column('idempotency_key', sa.String(), nullable=True))
    op.add_column('task_events', sa.Column('client_session_id', sa.String(), nullable=True))
    op.create_index('idx_task_events_idempotency_key', 'task_events', ['idempotency_key'], unique=True)
    op.create_index('idx_task_events_client_session_id', 'task_events', ['client_session_id'])


def downgrade() -> None:
    op.drop_index('idx_task_events_client_session_id', table_name='task_events')
    op.drop_index('idx_task_events_idempotency_key', table_name='task_events')
    op.drop_column('task_events', 'client_session_id')
    op.drop_column('task_events', 'idempotency_key')
