from fastapi import FastAPI, Form, Request, HTTPException, Depends, Header
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from google.cloud import firestore
from typing import Annotated
import datetime
from fastapi.responses import JSONResponse

app = FastAPI()

app.mount("/static", StaticFiles(directory="/app/static"), name="static")
templates = Jinja2Templates(directory="/app/template")

db = firestore.Client()
attendance_collection = db.collection("attendance")

@app.get("/")
async def read_root(request: Request):
    attendance_records = db.collection("attendance").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
    attendance_data = [doc.to_dict() for doc in attendance_records]
    return templates.TemplateResponse("index.html", {
        "request": request,
        "attendance_data": attendance_data
    })

@app.post("/attend")
async def mark_attendance(name: Annotated[str, Form()], uid: Annotated[str, Form()], courseId: Annotated[str, Form()], role: Annotated[str, Form()]):
    timestamp = datetime.datetime.utcnow().isoformat()
    attendance_collection.add({
        "name": name,
        "uid": uid,
        "timestamp": timestamp,
        "courseId": courseId,
        "role": role,
    })
    return {"detail": "Attendance recorded", "timestamp": timestamp}


@app.get("/confirm")
async def confirm_page(request: Request):
    return templates.TemplateResponse("confirm.html", {"request": request})


@app.get("/attendance")
async def show_attendance_page(request: Request, courseId: str):
    records = attendance_collection.where("courseId", "==", courseId).stream()
    attendance_data = []

    for r in records:
        data = r.to_dict()
        attendance_data.append({
            "name": data.get("name"),
            "timestamp": data.get("timestamp")
        })

    return templates.TemplateResponse("index.html", {
        "request": request,
        "attendance_records": attendance_data
    })


@app.post("/attendance")
async def add_attendance(name: Annotated[str, Form()], courseId: Annotated[str, Form()]):
    if not name or not courseId:
        raise HTTPException(status_code=400, detail="Missing user name or course ID")

    attendance_collection.add({
        "name": name,
        "courseId": courseId,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    
    return {"message": "Attendance recorded", "name": name}


