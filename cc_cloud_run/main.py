from fastapi import FastAPI, Form, Request, HTTPException, Depends
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from google.cloud import firestore
from typing import Annotated
import datetime

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
async def mark_attendance(name: Annotated[str, Form()], uid: Annotated[str, Form()], courseId: Annotated[str, Form()]):
    timestamp = datetime.datetime.utcnow().isoformat()
    attendance_collection.add({
        "name": name,
        "uid": uid,
        "timestamp": timestamp,
        "courseId": courseId,
    })
    return {"detail": "Attendance recorded", "timestamp": timestamp}

@app.get("/confirm")
async def confirm_page(request: Request):
    return templates.TemplateResponse("confirm.html", {"request": request})

@app.get("/professor/{user_id}")
async def professor_page(request: Request, user_id: str):
    return templates.TemplateResponse("professor.html", {"request": request, "user_id": user_id})

