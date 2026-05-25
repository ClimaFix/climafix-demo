from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel
from typing import List, Optional
from jose import JWTError, jwt
import databases
import sqlalchemy
from datetime import datetime, timedelta
import os

# ============ CONFIGURATION ============

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database URL - Use environment variable for Render, fallback to SQLite for local
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./climafix.db")

# For SQLite, we need to enable foreign keys
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# ============ DATABASE MODELS ============

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True, index=True),
    sqlalchemy.Column("password", sqlalchemy.String),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

# Create engine based on database type
if "sqlite" in DATABASE_URL:
    engine = sqlalchemy.create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = sqlalchemy.create_engine(DATABASE_URL)

metadata.create_all(engine)

# ============ PYDANTIC MODELS ============

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

# ============ CREATE FASTAPI APP ============

app = FastAPI(
    title="CLIMAFIX API",
    description="Backend API for CLIMAFIX carbon credit platform",
    version="1.0.0"
)

# ============ COMPLETE CORS CONFIGURATION ============
# This is the critical fix for Render deployment

app.add_middleware(
    CORSMiddleware,
    # Allow specific origins - replace with your actual Vercel URL
    allow_origins=[
        "https://your-vercel-app.vercel.app",  # Replace with your Vercel URL
        "https://climafix-demo.vercel.app",   # Example - change this
        "http://localhost:3000",
        "http://localhost:5173",              # Vite default
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    # Explicitly list all HTTP methods including OPTIONS
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    # Explicitly list required headers
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["Content-Type", "Authorization"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Optional: Add Trusted Host middleware for security
# app.add_middleware(
#     TrustedHostMiddleware,
#     allowed_hosts=["your-vercel-app.vercel.app", "localhost", "127.0.0.1"]
# )

# ============ EXPLICIT OPTIONS HANDLER FOR PREFLIGHT REQUESTS ============
# This is critical for Render deployment

@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    """
    Handle OPTIONS preflight requests for CORS.
    This ensures browsers can verify CORS permissions before actual requests.
    """
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
            "Access-Control-Max-Age": "86400",
        }
    )

@app.options("/")
async def preflight_root():
    """Handle OPTIONS request for root path"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        }
    )

# ============ HELPER FUNCTIONS ============

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    query = users.select().where(users.c.email == email)
    user = await database.fetch_one(query)
    if user is None:
        raise credentials_exception
    return user

# ============ DATABASE EVENT HANDLERS ============

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# ============ API ROUTES ============

@app.get("/")
async def root():
    return {"message": "CLIMAFIX API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint for Render"""
    return {"status": "healthy", "database": "connected"}

@app.post("/api/register", response_model=Token)
async def register(user: UserRegister):
    # Check if user exists
    query = users.select().where(users.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # In production, hash the password!
    # For demo purposes only - use bcrypt in production
    query = users.insert().values(
        email=user.email,
        password=user.password,  # WARNING: Hash this in production!
        created_at=datetime.utcnow()
    )
    user_id = await database.execute(query)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
async def login(user: UserLogin):
    query = users.select().where(users.c.email == user.email)
    db_user = await database.fetch_one(query)
    
    if not db_user or db_user["password"] != user.password:  # WARNING: Use proper password hashing!
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserResponse)
async def get_current_user_info(token: str):
    user = await get_current_user(token)
    return {
        "id": user["id"],
        "email": user["email"],
        "created_at": user["created_at"]
    }

@app.get("/api/dashboard/kpis")
async def get_dashboard_kpis(token: str):
    """Get KPIs for dashboard"""
    await get_current_user(token)  # Verify authentication
    return {
        "total_carbon_credits": 15250,
        "credits_issued": 8750,
        "credits_retired": 4320,
        "active_projects": 8,
        "total_emissions_reduced": 12450
    }

@app.get("/api/dashboard/trend")
async def get_trend_data(token: str):
    """Get trend data for charts"""
    await get_current_user(token)  # Verify authentication
    return {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "values": [1200, 1900, 2400, 2800, 3200, 4100]
    }

# ============ CORS TEST ENDPOINT ============

@app.options("/api/test-cors")
async def test_cors_options():
    """Test endpoint to verify CORS OPTIONS handling"""
    return Response(status_code=200)

@app.get("/api/test-cors")
async def test_cors_get():
    """Test endpoint to verify CORS GET requests"""
    return {"message": "CORS is working correctly!"}

# ============ REQUIREMENTS.TXT ============
# Make sure you have these in your requirements.txt:
"""
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
aiosqlite==0.19.0
databases[sqlite]==0.8.0
sqlalchemy==2.0.23
"""