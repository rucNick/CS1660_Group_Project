import os
from pathlib import Path
from fastapi import FastAPI, Form, Request, HTTPException, Depends, Header, Cookie
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import firestore
from typing import Annotated, Optional, List
import datetime
import requests
from fastapi.responses import JSONResponse, RedirectResponse

app = FastAPI()

# Enable CORS for AuthServer integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the current directory
BASE_DIR = Path(__file__).resolve().parent
PARENT_DIR = BASE_DIR.parent  # Go up one directory

STATIC_DIR = os.path.join(PARENT_DIR, "static")  
TEMPLATE_DIR = os.path.join(PARENT_DIR, "template")  

# Print paths for debugging
print(f"Base directory: {BASE_DIR}")
print(f"Static directory: {STATIC_DIR}")
print(f"Template directory: {TEMPLATE_DIR}")

# Mount static files using correct paths
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)

db = firestore.Client()
attendance_collection = db.collection("attendance")

# Environment variables
AUTH_SERVER_URL = "http://localhost:8080" 

# Validate session with AuthServer
async def validate_session(sessionid: Optional[str] = Cookie(None)):
    if not sessionid:
        return None
        
    try:
        # Call AuthServer to validate session
        response = requests.get(
            f"{AUTH_SERVER_URL}/api/auth/status",
            cookies={"JSESSIONID": sessionid},
        )
        
        if response.status_code == 200:
            auth_data = response.json()
            if auth_data.get("authenticated"):
                return auth_data
        
        return None
    except Exception as e:
        print(f"Error validating session: {e}")
        return None

@app.get("/")
async def read_root(request: Request, auth_data: Optional[dict] = Depends(validate_session)):
    # Get recent attendance records
    attendance_records = db.collection("attendance").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
    attendance_data = [doc.to_dict() for doc in attendance_records]
    
    # Pass auth data to template
    context = {
        "request": request,
        "attendance_data": attendance_data
    }
    
    if auth_data:
        context.update({
            "authenticated": True,
            "user": {
                "id": auth_data.get("userId"),
                "email": auth_data.get("email"),
                "fullName": auth_data.get("fullName"),
                "role": auth_data.get("role")
            }
        })
    
    return templates.TemplateResponse("index.html", context)

@app.post("/attend")
async def mark_attendance(
    name: Annotated[str, Form()], 
    uid: Annotated[str, Form()], 
    courseId: Annotated[str, Form()], 
    role: Annotated[str, Form()],
    authServerId: Optional[str] = Form(None),
    auth_data: Optional[dict] = Depends(validate_session)
):
    # Check if user is authenticated with AuthServer
    if auth_data:
        # Use AuthServer user data if available
        user_id = auth_data.get("userId")
        user_role = auth_data.get("role")
        
        # If role doesn't match, validate
        if user_role != role and user_role == "Student":
            return JSONResponse(
                status_code=403,
                content={"error": "Students can only mark their own attendance"}
            )
    
    # Record attendance in Firestore
    timestamp = datetime.datetime.utcnow().isoformat()
    attendance_doc = {
        "name": name,
        "uid": uid,
        "timestamp": timestamp,
        "courseId": courseId,
        "role": role,
    }
    # Add AuthServer ID if available
    if auth_data and auth_data.get("userId"):
        attendance_doc["authServerId"] = auth_data.get("userId")
    elif authServerId:
        attendance_doc["authServerId"] = authServerId
    
    attendance_collection.add(attendance_doc)
    
    return {"detail": "Attendance recorded", "timestamp": timestamp}

@app.get("/confirm")
async def confirm_page(request: Request, auth_data: Optional[dict] = Depends(validate_session)):
    return templates.TemplateResponse("confirm.html", {"request": request})

@app.get("/attend")
async def show_attendance_page(
    request: Request, 
    courseId: str, 
    user_role: str,
    auth_data: Optional[dict] = Depends(validate_session)
):
    # Check if user is authenticated and is a professor
    if auth_data and auth_data.get("role") == "Professor":
        pass  # Authenticated professor, allow access
    elif user_role != "Professor":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get attendance records for the course
    records = attendance_collection.where("courseId", "==", courseId).stream()
    attendance_data = []

    for r in records:
        data = r.to_dict()
        attendance_data.append({
            "name": data.get("name"),
            "timestamp": data.get("timestamp")
        })

    # Sort attendance records by timestamp (most recent first)
    attendance_data.sort(key=lambda x: x["timestamp"], reverse=True)

    return templates.TemplateResponse("attendance_list.html", {
        "request": request,
        "attendance_records": attendance_data,
        "course_id": courseId
    })

# Get all classes for a professor
@app.get("/api/classes")
async def get_professor_classes(auth_data: Optional[dict] = Depends(validate_session)):
    if not auth_data or auth_data.get("role") != "Professor":
        raise HTTPException(status_code=403, detail="Only professors can access class lists")
    
    classes = [
        {"id": "CS1501", "name": "Algorithm Implementation"},
        {"id": "CS1502", "name": "Formal Methods in Computer Science"},
        {"id": "CS1520", "name": "Programming Languages for Web Applications"},
        {"id": "CS1550", "name": "Introduction to Operating Systems"},
        {"id": "CS1555", "name": "Database Management Systems"},
        {"id": "CS1635", "name": "Interface Design Methodology"},
        {"id": "CS1660", "name": "Introduction to Cloud Computing"}
    ]
    
    return {"classes": classes}

# Get all attendance records for a class
@app.get("/api/attendance/{course_id}")
async def get_course_attendance(
    course_id: str,
    auth_data: Optional[dict] = Depends(validate_session)
):
    if not auth_data or auth_data.get("role") != "Professor":
        raise HTTPException(status_code=403, detail="Only professors can access attendance records")
    
    # Get attendance records for the course
    records = attendance_collection.where("courseId", "==", course_id).stream()
    attendance_data = []

    for r in records:
        data = r.to_dict()
        attendance_data.append({
            "id": r.id,
            "name": data.get("name"),
            "timestamp": data.get("timestamp"),
            "uid": data.get("uid"),
            "authServerId": data.get("authServerId")
        })

    # Sort attendance records by timestamp (most recent first)
    attendance_data.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"course_id": course_id, "records": attendance_data}