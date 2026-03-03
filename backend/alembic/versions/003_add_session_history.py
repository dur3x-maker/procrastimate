"""add session history table

Revision ID: 003_add_session_history
Revises: 002
Create Date: 2026-02-23 14:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_session_history'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'session_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('focus_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('break_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('session_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_tasks', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'date', name='uq_user_date')
    )
    op.create_index(op.f('ix_session_history_user_id'), 'session_history', ['user_id'], unique=False)
    op.create_index(op.f('ix_session_history_date'), 'session_history', ['date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_session_history_date'), table_name='session_history')
    op.drop_index(op.f('ix_session_history_user_id'), table_name='session_history')
    op.drop_table('session_history')
