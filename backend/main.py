from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import os
import databases
import sqlalchemy

# ============ CONFIGURATION ============

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database URL - PostgreSQL on Render, SQLite locally
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./climafix.db")

# For SQLite compatibility
if "sqlite" in DATABASE_URL:
    database = databases.Database(DATABASE_URL)
    engine = sqlalchemy.create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    database = databases.Database(DATABASE_URL)
    engine = sqlalchemy.create_engine(DATABASE_URL)

metadata = sqlalchemy.MetaData()

# ============ DATABASE MODELS ============

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True, index=True),
    sqlalchemy.Column("password", sqlalchemy.String),
    sqlalchemy.Column("name", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

metadata.create_all(engine)

# ============ PYDANTIC MODELS ============

class UserRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ============ CREATE FASTAPI APP ============

app = FastAPI(
    title="CLIMAFIX API",
    description="Backend API for CLIMAFIX carbon credit platform",
    version="1.0.0"
)

# ============ COMPLETE CORS CONFIGURATION ============

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://climafix-demo.vercel.app",  # Your Vercel frontend
        "https://climafix-api.onrender.com",  # Your Render backend
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["Content-Type", "Authorization"],
    max_age=86400,
)

# ============ OPTIONS HANDLER FOR PREFLIGHT REQUESTS ============

@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return Response(status_code=200)

@app.options("/")
async def preflight_root():
    return Response(status_code=200)

# ============ DATABASE EVENT HANDLERS ============

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# ============ HELPER FUNCTIONS ============

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    import jwt
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ============ API ROUTES ============

@app.get("/")
@app.get("/health")
async def root():
    return {"message": "CLIMAFIX API is running", "status": "healthy"}

# ============ REGISTER ENDPOINTS (Multiple versions for compatibility) ============

async def register_logic(user: UserRegister):
    """Shared registration logic"""
    # Check if user exists
    query = users.select().where(users.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # In production, hash the password!
    query = users.insert().values(
        email=user.email,
        password=user.password,  # WARNING: Hash this in production!
        name=user.name,
        created_at=datetime.utcnow()
    )
    user_id = await database.execute(query)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}

@app.post("/api/register")
async def register(user: UserRegister):
    return await register_logic(user)

@app.post("/api/auth/register")
async def auth_register(user: UserRegister):
    """Alias for /api/register to maintain compatibility"""
    return await register_logic(user)

# ============ LOGIN ENDPOINTS (Multiple versions for compatibility) ============

async def login_logic(user: UserLogin):
    """Shared login logic"""
    query = users.select().where(users.c.email == user.email)
    db_user = await database.fetch_one(query)
    
    if not db_user or db_user["password"] != user.password:  # WARNING: Use proper password hashing!
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user["id"]}

@app.post("/api/login")
async def login(user: UserLogin):
    return await login_logic(user)

@app.post("/api/auth/login")
async def auth_login(user: UserLogin):
    """Alias for /api/login to maintain compatibility"""
    return await login_logic(user)

# ============ DASHBOARD ENDPOINTS ============

@app.get("/api/dashboard/kpis")
async def get_dashboard_kpis():
    """Get KPIs for dashboard"""
    return {
        "total_carbon_credits": 15250,
        "credits_issued": 8750,
        "credits_retired": 4320,
        "active_projects": 8,
        "total_emissions_reduced": 12450
    }

@app.get("/api/dashboard/trend")
async def get_trend_data():
    """Get trend data for charts"""
    return {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "values": [1200, 1900, 2400, 2800, 3200, 4100]
    }

# ============ USER ENDPOINTS ============

@app.get("/api/users/me")
async def get_current_user(email: str):
    """Get current user info"""
    query = users.select().where(users.c.email == email)
    user = await database.fetch_one(query)
    if user:
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"]
        }
    raise HTTPException(status_code=404, detail="User not found")