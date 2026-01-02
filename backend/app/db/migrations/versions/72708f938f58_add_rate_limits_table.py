"""add rate_limits table

Revision ID: 72708f938f58
Revises: a1b2c3d4e5f6
Create Date: 2026-01-02 20:30:14.751283

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = '72708f938f58'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create rate_limits table
    op.create_table(
        'rate_limits',
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('reset_at_ms', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('key')
    )
    op.create_index('ix_rate_limits_reset_at', 'rate_limits', ['reset_at_ms'])


def downgrade() -> None:
    # Remove rate_limits table
    op.drop_index('ix_rate_limits_reset_at', table_name='rate_limits')
    op.drop_table('rate_limits')

