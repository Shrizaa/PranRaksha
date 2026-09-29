from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import pandas as pd
import math
import os
import secrets
# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="AI-Powered Emergency Response Intelligence Platform for Disaster Management and Relief Operations",
    description=(
        "Backend API for user authentication, flood risk assessment, "
        "resource requirements, nearest warehouse, resource availability, "
        "shortage analysis, and nearby infrastructure."
    ),
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --------------------------------------------------
# File Paths
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DISASTER_DATA_PATH = os.path.join(
    BASE_DIR,
    "Final_INDOFLOODS_dataset.xlsx"
)

WAREHOUSE_DATA_PATH = os.path.join(
    BASE_DIR,
    "warehouse_inventory.csv"
)


# --------------------------------------------------
# Input Models
# --------------------------------------------------

class LoginInput(BaseModel):
    username: str
    password: str


class DisasterInput(BaseModel):
    latitude: float = Field(
        ...,
        description="Disaster location latitude"
    )
    longitude: float = Field(
        ...,
        description="Disaster location longitude"
    )
    relief_days: int = Field(
        1,
        ge=1,
        description="Number of relief days"
    )


# --------------------------------------------------
# Authentication Data
# --------------------------------------------------

# Demo users
USERS = {
    "admin": "admin123",
    "officer": "officer123"
}

# Active tokens stored in memory
active_tokens = {}

# Enables the Authorize button in Swagger
security = HTTPBearer()


# --------------------------------------------------
# Authentication Helper
# --------------------------------------------------

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify the Bearer token.
    """

    token = credentials.credentials

    if token not in active_tokens:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return active_tokens[token]


# --------------------------------------------------
# Load Disaster Dataset
# --------------------------------------------------

def load_disaster_data():
    if not os.path.exists(DISASTER_DATA_PATH):
        raise HTTPException(
            status_code=500,
            detail="Disaster dataset file not found."
        )

    try:
        df = pd.read_excel(DISASTER_DATA_PATH)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading disaster dataset: {str(e)}"
        )

    required_columns = [
        "Latitude",
        "Longitude",
        "population_within_5km"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=500,
            detail=f"Missing disaster dataset columns: {missing_columns}"
        )

    return df


# --------------------------------------------------
# Load Warehouse Dataset
# --------------------------------------------------

def load_warehouse_data():
    if not os.path.exists(WAREHOUSE_DATA_PATH):
        raise HTTPException(
            status_code=500,
            detail="Warehouse inventory file not found."
        )

    try:
        df = pd.read_csv(WAREHOUSE_DATA_PATH)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading warehouse dataset: {str(e)}"
        )

    required_columns = [
        "warehouse_id",
        "latitude",
        "longitude",
        "food_packets",
        "water_bottles",
        "medkits",
        "blankets"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=500,
            detail=f"Missing warehouse columns: {missing_columns}"
        )

    return df


# --------------------------------------------------
# Helper Functions
# --------------------------------------------------

def get_numeric_value(row, column_name, default=0):
    """
    Safely retrieve a numeric value from a dataset row.
    """

    if column_name not in row.index:
        return default

    value = row[column_name]

    if pd.isna(value):
        return default

    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using
    the Haversine formula.

    Returns distance in kilometres.
    """

    earth_radius = 6371.0

    lat1 = math.radians(float(lat1))
    lon1 = math.radians(float(lon1))
    lat2 = math.radians(float(lat2))
    lon2 = math.radians(float(lon2))

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return round(earth_radius * c, 2)


def get_nearest_disaster(latitude, longitude):
    """
    Find the nearest disaster record.
    """

    df = load_disaster_data()
    df = df.copy()

    df["distance_km"] = df.apply(
        lambda row: calculate_distance(
            latitude,
            longitude,
            row["Latitude"],
            row["Longitude"]
        ),
        axis=1
    )

    nearest_index = df["distance_km"].idxmin()

    return df.loc[nearest_index]


def get_nearest_warehouse(latitude, longitude):
    """
    Find the nearest warehouse.
    """

    df = load_warehouse_data()
    df = df.copy()

    df["distance_km"] = df.apply(
        lambda row: calculate_distance(
            latitude,
            longitude,
            row["latitude"],
            row["longitude"]
        ),
        axis=1
    )

    nearest_index = df["distance_km"].idxmin()

    return df.loc[nearest_index]


def normalize_score(value, minimum, maximum):
    """
    Normalize a value between 0 and 100.
    """

    if maximum == minimum:
        return 50.0

    score = (
        (value - minimum)
        / (maximum - minimum)
    ) * 100

    return max(0, min(100, score))


def get_column_min_max(df, column_name):
    """
    Get minimum and maximum values for a column.
    """

    if column_name not in df.columns:
        return 0, 100

    values = pd.to_numeric(
        df[column_name],
        errors="coerce"
    ).dropna()

    if values.empty:
        return 0, 100

    return values.min(), values.max()


def calculate_risk_score(disaster_record, df):
    """
    Calculate risk using weather, population,
    vulnerability, and accessibility indicators.
    """

    # --------------------------------------------------
    # Weather Risk
    # --------------------------------------------------

    rainfall = get_numeric_value(
        disaster_record,
        "Rainfall_mm",
        0
    )

    wind_speed = get_numeric_value(
        disaster_record,
        "WindSpeed_kmh",
        0
    )

    humidity = get_numeric_value(
        disaster_record,
        "Humidity_percent",
        0
    )

    rainfall_min, rainfall_max = get_column_min_max(
        df,
        "Rainfall_mm"
    )

    wind_min, wind_max = get_column_min_max(
        df,
        "WindSpeed_kmh"
    )

    humidity_min, humidity_max = get_column_min_max(
        df,
        "Humidity_percent"
    )

    rainfall_score = normalize_score(
        rainfall,
        rainfall_min,
        rainfall_max
    )

    wind_score = normalize_score(
        wind_speed,
        wind_min,
        wind_max
    )

    humidity_score = normalize_score(
        humidity,
        humidity_min,
        humidity_max
    )

    weather_score = (
        0.5 * rainfall_score
        + 0.3 * wind_score
        + 0.2 * humidity_score
    )

    # --------------------------------------------------
    # Population Risk
    # --------------------------------------------------

    population = get_numeric_value(
        disaster_record,
        "population_within_5km",
        0
    )

    population_min, population_max = get_column_min_max(
        df,
        "population_within_5km"
    )

    population_score = normalize_score(
        population,
        population_min,
        population_max
    )

    # --------------------------------------------------
    # Vulnerability Risk
    # --------------------------------------------------

    if "vulnerability_score" in df.columns:
        vulnerability = get_numeric_value(
            disaster_record,
            "vulnerability_score",
            population_score
        )

        vulnerability_min, vulnerability_max = get_column_min_max(
            df,
            "vulnerability_score"
        )

        vulnerability_score = normalize_score(
            vulnerability,
            vulnerability_min,
            vulnerability_max
        )
    else:
        vulnerability_score = population_score

    # --------------------------------------------------
    # Accessibility Risk
    # --------------------------------------------------

    if "accessibility_score" in df.columns:
        accessibility = get_numeric_value(
            disaster_record,
            "accessibility_score",
            50
        )

        accessibility_min, accessibility_max = get_column_min_max(
            df,
            "accessibility_score"
        )

        accessibility_score = normalize_score(
            accessibility,
            accessibility_min,
            accessibility_max
        )
        if accessibility_score <= 0.01:
            hw_dist = get_numeric_value(disaster_record, "highway_distance", 50)
            road_dens = get_numeric_value(disaster_record, "road_density", 25)
            hw_score = max(15.0, 100.0 - min(100.0, hw_dist)) if hw_dist > 0 else 35.0
            accessibility_score = max(18.0, min(85.0, 0.5 * hw_score + 0.5 * road_dens))
        if accessibility_score < 15.0:
            accessibility_score = 18.5
    else:
        accessibility_score = 50

    # --------------------------------------------------
    # Final Risk Score
    # --------------------------------------------------

    risk_score = (
        0.40 * weather_score
        + 0.25 * population_score
        + 0.25 * vulnerability_score
        + 0.10 * accessibility_score
    )

    risk_score = round(
        max(0, min(100, risk_score)),
        2
    )

    # --------------------------------------------------
    # Risk Level and Priority
    # --------------------------------------------------

    if risk_score >= 75:
        risk_level = "Critical"
        response_priority = "P1"
    elif risk_score >= 50:
        risk_level = "High"
        response_priority = "P2"
    elif risk_score >= 25:
        risk_level = "Moderate"
        response_priority = "P3"
    else:
        risk_level = "Low"
        response_priority = "P4"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "response_priority": response_priority,
        "weather_score": round(weather_score, 2),
        "population_score": round(population_score, 2),
        "vulnerability_score": round(vulnerability_score, 2),
        "accessibility_score": round(accessibility_score, 2)
    }


def calculate_resource_requirements(population, relief_days):
    """
    Calculate required relief resources.
    """

    food_packets = math.ceil(
        population * relief_days * 3
    )

    water_bottles = math.ceil(
        population * relief_days * 5
    )

    medkits = math.ceil(
        population / 20
    )

    blankets = math.ceil(
        population * 0.70
    )

    return {
        "food_packets": food_packets,
        "water_bottles": water_bottles,
        "medkits": medkits,
        "blankets": blankets
    }


def get_resource_availability(warehouse):
    """
    Read available resources from a warehouse.
    """

    return {
        "food_packets": int(
            get_numeric_value(
                warehouse,
                "food_packets",
                0
            )
        ),
        "water_bottles": int(
            get_numeric_value(
                warehouse,
                "water_bottles",
                0
            )
        ),
        "medkits": int(
            get_numeric_value(
                warehouse,
                "medkits",
                0
            )
        ),
        "blankets": int(
            get_numeric_value(
                warehouse,
                "blankets",
                0
            )
        )
    }


def calculate_shortage(required, available):
    """
    Compare required resources with available resources.
    """

    shortage = {}

    for resource in required:
        shortage[resource] = max(
            0,
            required[resource] - available.get(
                resource,
                0
            )
        )

    total_shortage = sum(shortage.values())

    if total_shortage == 0:
        overall_status = "Sufficient"
    else:
        overall_status = "Shortage Available"

    return {
        "shortage": shortage,
        "total_shortage_units": total_shortage,
        "overall_status": overall_status
    }


# --------------------------------------------------
# 1. Login Endpoint
# --------------------------------------------------

@app.post("/login")
def login(data: LoginInput):
    """
    Authenticate a user and generate an access token.
    """

    if data.username not in USERS:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if USERS[data.username] != data.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = secrets.token_urlsafe(32)

    active_tokens[access_token] = data.username

    return {
        "message": "Login successful",
        "username": data.username,
        "access_token": access_token,
        "token_type": "bearer"
    }


# --------------------------------------------------
# 2. Logout Endpoint
# --------------------------------------------------

@app.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Logout the user by deleting the active token.
    """

    token = credentials.credentials

    if token not in active_tokens:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    username = active_tokens[token]

    del active_tokens[token]

    return {
        "message": "Logout successful",
        "username": username
    }


# --------------------------------------------------
# 3. Risk Assessment Endpoint
# --------------------------------------------------

@app.post("/risk-assessment")
def risk_assessment(
    data: DisasterInput,
    current_user: str = Depends(verify_token)
):
    """
    Predict disaster risk and response priority.
    """

    df = load_disaster_data()

    disaster = get_nearest_disaster(
        data.latitude,
        data.longitude
    )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="No disaster data found."
        )

    risk_details = calculate_risk_score(
        disaster,
        df
    )

    return {
        "location": {
            "latitude": data.latitude,
            "longitude": data.longitude
        },
        "risk_assessment": risk_details
    }


# --------------------------------------------------
# 4. Resource Requirements Endpoint
# --------------------------------------------------

@app.post("/resource-requirements")
def resource_requirements(
    data: DisasterInput,
    current_user: str = Depends(verify_token)
):
    """
    Calculate food, water, medkit, and blanket requirements.
    """

    disaster = get_nearest_disaster(
        data.latitude,
        data.longitude
    )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="No disaster data found."
        )

    population = int(
        get_numeric_value(
            disaster,
            "population_within_5km",
            0
        )
    )

    resources = calculate_resource_requirements(
        population,
        data.relief_days
    )

    return {
        "location": {
            "latitude": data.latitude,
            "longitude": data.longitude
        },
        "affected_population": population,
        "relief_days": data.relief_days,
        "resource_requirements": resources
    }


# --------------------------------------------------
# 5. Nearest Warehouse Endpoint
# --------------------------------------------------

@app.post("/nearest-warehouse")
def nearest_warehouse(
    data: DisasterInput,
    current_user: str = Depends(verify_token)
):
    """
    Find the nearest warehouse.
    """

    warehouse = get_nearest_warehouse(
        data.latitude,
        data.longitude
    )

    if warehouse is None:
        raise HTTPException(
            status_code=404,
            detail="No warehouse found."
        )

    return {
        "location": {
            "latitude": data.latitude,
            "longitude": data.longitude
        },
        "nearest_warehouse": {
            "warehouse_id": str(
                warehouse["warehouse_id"]
            ),
            "latitude": float(
                warehouse["latitude"]
            ),
            "longitude": float(
                warehouse["longitude"]
            ),
            "distance_km": float(
                warehouse["distance_km"]
            )
        }
    }


# --------------------------------------------------
# 6. Resource Availability Endpoint
# --------------------------------------------------

@app.post("/resource-availability")
def resource_availability(
    data: DisasterInput,
    current_user: str = Depends(verify_token)
):
    """
    Display required and available resources.
    """

    disaster = get_nearest_disaster(
        data.latitude,
        data.longitude
    )

    warehouse = get_nearest_warehouse(
        data.latitude,
        data.longitude
    )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="No disaster data found."
        )

    if warehouse is None:
        raise HTTPException(
            status_code=404,
            detail="No warehouse found."
        )

    population = int(
        get_numeric_value(
            disaster,
            "population_within_5km",
            0
        )
    )

    required_resources = calculate_resource_requirements(
        population,
        data.relief_days
    )

    available_resources = get_resource_availability(
        warehouse
    )

    return {
        "affected_population": population,
        "relief_days": data.relief_days,
        "warehouse_id": str(
            warehouse["warehouse_id"]
        ),
        "required_resources": required_resources,
        "available_resources": available_resources
    }


# --------------------------------------------------
# 7. Shortage Analysis Endpoint
# --------------------------------------------------

@app.post("/shortage-analysis")
def shortage_analysis(
    data: DisasterInput,
    current_user: str = Depends(verify_token)
):
    """
    Compare required resources with available resources.
    """

    disaster = get_nearest_disaster(
        data.latitude,
        data.longitude
    )

    warehouse = get_nearest_warehouse(
        data.latitude,
        data.longitude
    )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="No disaster data found."
        )

    if warehouse is None:
        raise HTTPException(
            status_code=404,
            detail="No warehouse found."
        )

    population = int(
        get_numeric_value(
            disaster,
            "population_within_5km",
            0
        )
    )

    required_resources = calculate_resource_requirements(
        population,
        data.relief_days
    )

    available_resources = get_resource_availability(
        warehouse
    )

    shortage_details = calculate_shortage(
        required_resources,
        available_resources
    )

    return {
        "location": {
            "latitude": data.latitude,
            "longitude": data.longitude
        },
        "affected_population": population,
        "relief_days": data.relief_days,
        "warehouse_id": str(
            warehouse["warehouse_id"]
        ),
        "required_resources": required_resources,
        "available_resources": available_resources,
        "shortage_analysis": shortage_details
    }


# --------------------------------------------------
# 8. Nearby Infrastructure Endpoint
# --------------------------------------------------

@app.post("/nearby-infrastructure")
def nearby_infrastructure(
    data: DisasterInput,
    current_user: str = Depends(verify_token)
):
    """
    Display nearby relief shelters, hospitals, and schools.
    """

    disaster = get_nearest_disaster(
        data.latitude,
        data.longitude
    )

    if disaster is None:
        raise HTTPException(
            status_code=404,
            detail="No disaster data found."
        )

    return {
        "location": {
            "latitude": data.latitude,
            "longitude": data.longitude
        },
        "nearby_infrastructure": {
            "relief_shelters": int(
                get_numeric_value(
                    disaster,
                    "relief_shelter_count_5km",
                    0
                )
            ),
            "hospitals": int(
                get_numeric_value(
                    disaster,
                    "hospital_count_5km",
                    0
                )
            ),
            "schools": int(
                get_numeric_value(
                    disaster,
                    "school_count_5km",
                    0
                )
            )
        }
    }