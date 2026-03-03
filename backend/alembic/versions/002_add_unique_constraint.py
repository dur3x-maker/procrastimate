"""add unique constraint

Revision ID: 002
Revises: 001
Create Date: 2026-02-14 15:44:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        'uq_user_achievement',
        'achievements_progress',
        ['user_id', 'achievement_id']
    )
    op.create_index(
        'idx_achievements_user_id',
        'achievements_progress',
        ['user_id']
    )


def downgrade() -> None:
    op.drop_index('idx_achievements_user_id', table_name='achievements_progress')
    op.drop_constraint('uq_user_achievement', 'achievements_progress', type_='unique')
