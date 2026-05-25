from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict

app = FastAPI()

# --- CORS Configuration (Allow all for testing) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Database (for testing only) ---
# This is a simple Python dictionary that acts as our database.
# It will reset every time the server restarts.
fake_users_db: Dict[str, dict] = {}

# --- Request/Response Models ---
class UserRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

# ==================== REGISTER ENDPOINT ====================
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    """
    Handles user registration.
    """
    print(f"--- REGISTRATION ATTEMPT ---")
    print(f"Email: {user.email}")
    print(f"Name: {user.name}")
    print(f"Password received: {user.password}") # Don't log passwords in production!

    # 1. Check if user already exists
    if user.email in fake_users_db:
        print(f"Registration failed: Email {user.email} already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. Create new user entry
    # WARNING: In a real app, you MUST hash the password here!
    fake_users_db[user.email] = {
        "email": user.email,
        "password": user.password,  # Store plain text for demo ONLY
        "name": user.name
    }
    
    print(f"Registration successful for: {user.email}")
    print(f"Current users in DB: {list(fake_users_db.keys())}")

    # 3. Return a success response
    # You can generate a real JWT token here later.
    return {
        "access_token": f"demo-token-for-{user.email}",
        "token_type": "bearer",
        "message": "User created successfully"
    }

# ==================== LOGIN ENDPOINT ====================
@app.post("/api/login")
async def login(user: UserLogin):
    """
    Handles user login.
    """
    print(f"--- LOGIN ATTEMPT ---")
    print(f"Email: {user.email}")

    # 1. Find the user
    db_user = fake_users_db.get(user.email)

    # 2. Validate credentials
    if not db_user or db_user["password"] != user.password:
        print(f"Login failed for: {user.email} - Invalid credentials.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    print(f"Login successful for: {user.email}")
    
    # 3. Return a success response
    return {
        "access_token": f"demo-token-for-{user.email}",
        "token_type": "bearer",
        "message": "Login successful"
    }

# ==================== DASHBOARD ENDPOINTS ====================
@app.get("/api/dashboard/kpis")
async def get_kpis():
    """Returns mock KPI data for the dashboard."""
    return {
        "energy_intensity": 125.5,
        "water_intensity": 42.3,
        "carbon_footprint": 28.7
    }

@app.get("/api/dashboard/trend")
async def get_trend():
    """Returns mock trend data for the dashboard."""
    return {
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "energy_intensity": [130, 128, 126, 125, 124, 125.5]
    }

# ==================== ROOT HEALTH CHECK ====================
@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "CLIMAFIX API is running!"}