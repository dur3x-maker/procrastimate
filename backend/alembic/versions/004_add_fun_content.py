"""add fun_content table

Revision ID: 004
Revises: 003_add_session_history
Create Date: 2026-02-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '004'
down_revision = '003_add_session_history'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'fun_content',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('energy', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_fun_content_type', 'fun_content', ['type'])
    op.create_index('ix_fun_content_energy', 'fun_content', ['energy'])
    op.create_index('ix_fun_content_is_active', 'fun_content', ['is_active'])


def downgrade() -> None:
    op.drop_index('ix_fun_content_is_active', 'fun_content')
    op.drop_index('ix_fun_content_energy', 'fun_content')
    op.drop_index('ix_fun_content_type', 'fun_content')
    op.drop_table('fun_content')
