"""add security and performance indexes

Revision ID: 0001_add_security_indexes
Revises:
Create Date: 2026-05-22
"""

from alembic import op


revision = "0001_add_security_indexes"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("idx_service_requests_status_created", "service_requests", ["status", "created_at"], unique=False)
    op.create_index("idx_service_requests_customer_created", "service_requests", ["customer_id", "created_at"], unique=False)
    op.create_index("idx_service_requests_mechanic_status", "service_requests", ["mechanic_id", "status"], unique=False)
    op.create_index("idx_users_mechanic_available", "users", ["role", "is_available"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_users_mechanic_available", table_name="users")
    op.drop_index("idx_service_requests_mechanic_status", table_name="service_requests")
    op.drop_index("idx_service_requests_customer_created", table_name="service_requests")
    op.drop_index("idx_service_requests_status_created", table_name="service_requests")
