from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import databases
import sqlalchemy
import uuid
import os

# ==================== CONFIGURATION ====================
DATABASE_URL = "sqlite:///./climafix.db"
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== DATABASE TABLES ====================
tenants = sqlalchemy.Table(
    "tenants",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String),
    sqlalchemy.Column("email", sqlalchemy.String),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("tenant_id", sqlalchemy.String),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True),
    sqlalchemy.Column("password_hash", sqlalchemy.String),
    sqlalchemy.Column("name", sqlalchemy.String),
    sqlalchemy.Column("role", sqlalchemy.String, default="admin"),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

monthly_data = sqlalchemy.Table(
    "monthly_data",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("tenant_id", sqlalchemy.String),
    sqlalchemy.Column("month", sqlalchemy.String),
    sqlalchemy.Column("electricity_kwh", sqlalchemy.Float),
    sqlalchemy.Column("diesel_liters", sqlalchemy.Float),
    sqlalchemy.Column("water_liters", sqlalchemy.Float),
    sqlalchemy.Column("production_kg", sqlalchemy.Float),
    sqlalchemy.Column("energy_intensity", sqlalchemy.Float),
    sqlalchemy.Column("water_intensity", sqlalchemy.Float),
    sqlalchemy.Column("carbon_footprint", sqlalchemy.Float),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

engine = sqlalchemy.create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata.create_all(engine)

# ==================== PYDANTIC MODELS ====================
class TenantRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class MonthlyDataCreate(BaseModel):
    month: str
    electricity_kwh: float
    diesel_liters: float
    water_liters: float
    production_kg: float

# ==================== HELPER FUNCTIONS ====================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        if user_id is None:
            raise credentials_exception
        return {"user_id": user_id, "tenant_id": tenant_id}
    except JWTError:
        raise credentials_exception

# ==================== FASTAPI APP ====================
app = FastAPI(title="CLIMAFIX API", version="1.0.0")

# CORS Middleware - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://climafix-demo.vercel.app",
        "https://climafix-api.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection events
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# Root endpoint
@app.get("/")
async def root():
    return {"message": "CLIMAFIX API is running"}

# ==================== AUTH ENDPOINTS ====================
@app.post("/api/auth/register")
async def register(tenant_data: TenantRegister):
    # Check if user already exists
    existing = await database.fetch_one(
        users.select().where(users.c.email == tenant_data.email)
    )
    if existing:
        raise HTTPException(400, "Email already registered")
    
    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create tenant
    await database.execute(
        tenants.insert().values(
            id=tenant_id,
            name=tenant_data.name,
            email=tenant_data.email
        )
    )
    
    # Create user
    await database.execute(
        users.insert().values(
            id=user_id,
            tenant_id=tenant_id,
            email=tenant_data.email,
            password_hash=hash_password(tenant_data.password),
            name=tenant_data.name
        )
    )
    
    token = create_access_token({"sub": user_id, "tenant_id": tenant_id})
    return {"access_token": token, "token_type": "bearer", "tenant_id": tenant_id}

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    user = await database.fetch_one(
        users.select().where(users.c.email == user_data.email)
    )
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    
    token = create_access_token({"sub": user["id"], "tenant_id": user["tenant_id"]})
    return {"access_token": token, "token_type": "bearer", "tenant_id": user["tenant_id"]}

# ==================== DATA ENTRY ENDPOINTS ====================
@app.post("/api/data/monthly")
async def create_monthly_data(data: MonthlyDataCreate, token: str):
    current_user = await get_current_user(token)
    tenant_id = current_user["tenant_id"]
    
    # Calculate metrics
    energy_intensity = data.electricity_kwh / data.production_kg if data.production_kg > 0 else 0
    water_intensity = data.water_liters / data.production_kg if data.production_kg > 0 else 0
    carbon_footprint = (data.electricity_kwh * 0.82) + (data.diesel_liters * 2.68)
    
    data_id = str(uuid.uuid4())
    await database.execute(
        monthly_data.insert().values(
            id=data_id,
            tenant_id=tenant_id,
            month=data.month,
            electricity_kwh=data.electricity_kwh,
            diesel_liters=data.diesel_liters,
            water_liters=data.water_liters,
            production_kg=data.production_kg,
            energy_intensity=energy_intensity,
            water_intensity=water_intensity,
            carbon_footprint=carbon_footprint
        )
    )
    
    return {"id": data_id, "message": "Data saved successfully"}

@app.get("/api/data/monthly")
async def get_monthly_data(token: str):
    current_user = await get_current_user(token)
    tenant_id = current_user["tenant_id"]
    
    rows = await database.fetch_all(
        monthly_data.select().where(monthly_data.c.tenant_id == tenant_id).order_by(monthly_data.c.month)
    )
    
    return [dict(row) for row in rows]

# ==================== DASHBOARD ENDPOINTS ====================
@app.get("/api/dashboard/kpis")
async def get_kpis(token: str):
    current_user = await get_current_user(token)
    tenant_id = current_user["tenant_id"]
    
    # Get latest month data
    latest = await database.fetch_one(
        monthly_data.select().where(monthly_data.c.tenant_id == tenant_id).order_by(monthly_data.c.month.desc())
    )
    
    if not latest:
        return {
            "energy_intensity": 0,
            "water_intensity": 0,
            "carbon_footprint": 0,
            "message": "No data yet"
        }
    
    return {
        "energy_intensity": round(latest["energy_intensity"], 2),
        "water_intensity": round(latest["water_intensity"], 2),
        "carbon_footprint": round(latest["carbon_footprint"], 2)
    }

@app.get("/api/dashboard/trend")
async def get_trend(token: str):
    current_user = await get_current_user(token)
    tenant_id = current_user["tenant_id"]
    
    rows = await database.fetch_all(
        monthly_data.select().where(monthly_data.c.tenant_id == tenant_id).order_by(monthly_data.c.month)
    )
    
    return {
        "months": [row["month"] for row in rows],
        "energy_intensity": [row["energy_intensity"] for row in rows],
        "water_intensity": [row["water_intensity"] for row in rows],
        "carbon_footprint": [row["carbon_footprint"] for row in rows]
    }

# ==================== RUN THE APP ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)