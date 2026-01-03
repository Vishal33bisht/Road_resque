from sqlalchemy import create_engine, text
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Add indexes for frequently queried columns
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_requests_mechanic ON service_requests(mechanic_id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_requests_customer ON service_requests(customer_id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_requests_created ON service_requests(created_at DESC)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_available ON users(is_available) WHERE role='mechanic'"))
    conn.commit()
    print("✅ Indexes created successfully")
