"""add task events table

Revision ID: 006
Revises: 005
Create Date: 2026-02-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005_add_rest_minutes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'task_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', sa.String(), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('session_history.id', ondelete='SET NULL'), nullable=True),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_task_events_user_id', 'task_events', ['user_id'])
    op.create_index('idx_task_events_created_at', 'task_events', ['created_at'])
    op.create_index('idx_task_events_event_type', 'task_events', ['event_type'])


def downgrade() -> None:
    op.drop_index('idx_task_events_event_type', table_name='task_events')
    op.drop_index('idx_task_events_created_at', table_name='task_events')
    op.drop_index('idx_task_events_user_id', table_name='task_events')
    op.drop_table('task_events')
