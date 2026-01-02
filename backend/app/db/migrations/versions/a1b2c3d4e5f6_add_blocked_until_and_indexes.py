"""add blocked_until and composite indexes

Revision ID: a1b2c3d4e5f6
Revises: f2b3d4e5a6b7
Create Date: 2026-01-02

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f2b3d4e5a6b7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add blocked_until column to otp_codes
    op.add_column('otp_codes', sa.Column('blocked_until', sa.DateTime(), nullable=True))

    # Add composite indexes for better query performance
    op.create_index('ix_sessions_user_expires', 'sessions', ['user_id', 'expires_at'])
    op.create_index('ix_orders_user_date', 'orders', ['user_id', 'date'])


def downgrade() -> None:
    # Remove composite indexes
    op.drop_index('ix_orders_user_date', table_name='orders')
    op.drop_index('ix_sessions_user_expires', table_name='sessions')

    # Remove blocked_until column
    op.drop_column('otp_codes', 'blocked_until')
