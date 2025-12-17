# scraper_api.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from pymongo import MongoClient, errors
from datetime import datetime, timedelta
import uvicorn
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# 👇 IMPORT FROM main.py
from main import DetailedJobScraper, smart_search, rank_jobs, load_model

# -------------------------- FastAPI --------------------------
app = FastAPI(title="Job Scraper API")

# -------------------------- CORS --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------- MongoDB --------------------------
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["job_scraper_db"]
collection = db["jobs"]
collection.create_index("link", unique=True)

# -------------------------- AI + Scraper --------------------------
scraper = DetailedJobScraper()
model = load_model()

# -------------------------- SCHEMAS --------------------------
class SearchRequest(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    query: Optional[str] = None
    jobs_per_search: int = 5

class ManualJobRequest(BaseModel):
    title: str
    company: str
    location: str
    salary: Optional[str] = "Not specified"
    description: Optional[str] = ""
    link: str
    user_email: str  # <-- utilisateur qui reçoit l'email

# -------------------------- EMAIL SENDER --------------------------
async def send_new_jobs_email(subscribers: List[str], jobs: List[dict]):
    sender_email = "tonemail@gmail.com"          # <-- ton email
    sender_password = "ton_app_password"         # <-- mot de passe app Gmail

    subject = f"New Job Notification ({len(jobs)} new jobs)"
    body = ""
    for j in jobs:
        body += f"{j['title']} at {j['company']} in {j['location']}\n"
        body += f"Link: {j['link']}\nSalary: {j['salary']}\n\n"

    for receiver_email in subscribers:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, sender_password)
                server.send_message(msg)
            print(f"Email sent to {receiver_email}")
        except Exception as e:
            print(f"Failed to send email to {receiver_email}: {e}")

# -------------------------- /search --------------------------
@app.post("/search")
def search(req: SearchRequest):
    try:
        jobs = smart_search(
            scraper=scraper,
            user_query=req.query,
            title=req.title,
            location=req.location,
            jobs_per_search=req.jobs_per_search
        )

        if not jobs:
            return {"results": []}

        ranked_jobs = rank_jobs(
            model,
            req.query or f"{req.title} {req.location}",
            jobs
        )

        # ❌ SEARCH JOBS → NO NOTIFICATION
        for job in ranked_jobs:
            job["scraped_at"] = datetime.utcnow()
            job["source"] = "search"
            try:
                collection.insert_one(job)
            except errors.DuplicateKeyError:
                continue

        response = []
        for j in ranked_jobs:
            response.append({
                "title": j.get("title"),
                "company": j.get("company"),
                "location": j.get("location"),
                "salary": j.get("salary"),
                "description": j.get("description"),
                "link": j.get("link"),
                "score": j.get("score"),
            })

        return {"results": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------- /manual_job --------------------------
@app.post("/manual_job")
async def manual_job(req: ManualJobRequest):
    job = req.dict()
    job["scraped_at"] = datetime.utcnow()
    job["source"] = "manual"

    try:
        collection.insert_one(job)
    except errors.DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Job already exists")

    # Envoie l'email directement
    subscribers = [req.user_email]  # ou une liste d'abonnés
    await send_new_jobs_email(subscribers, [job])

    return {"message": "Job added and notification sent", "job": job}

# -------------------------- /notifications --------------------------
@app.get("/notifications")
def notifications():
    time_threshold = datetime.utcnow() - timedelta(minutes=15)

    # Seuls les jobs manuels déclenchent les notifications
    new_jobs = list(collection.find({
        "scraped_at": {"$gte": time_threshold},
        "source": "manual"
    }))

    jobs_list = []
    for j in new_jobs:
        jobs_list.append({
            "title": j.get("title"),
            "company": j.get("company"),
            "location": j.get("location"),
            "link": j.get("link"),
            "salary": j.get("salary"),
            "description": j.get("description")
        })

    return {
        "new_jobs_count": len(jobs_list),
        "jobs": jobs_list
    }

# -------------------------- RUN --------------------------
if __name__ == "__main__":
    uvicorn.run(
        "scraper_api:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )