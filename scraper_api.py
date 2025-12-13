from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from typing import List
from pymongo import MongoClient, errors
from datetime import datetime
import uvicorn
from main import DetailedJobScraper

# -------------------------- FastAPI --------------------------
app = FastAPI(title="Job Scraper API")  # <-- d'abord créer l'instance

# --- CORS ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------- MongoDB --------------------------
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["job_scraper_db"]
collection = db["jobs"]
collection.create_index("link", unique=True)

# -------------------------- Scraper --------------------------
scraper = DetailedJobScraper()

class SearchRequest(BaseModel):
    title: str
    location: str = "Paris"
    jobs_per_search: int = 5
    user_id: Optional[str] = None

@app.post("/search")
def search(req: SearchRequest):
    try:

        results = scraper.search_jobs([req.title], [req.location], req.jobs_per_search)


        # Insérer dans MongoDB avec user_id
        if req.user_id:
         for job in results:
            job["scraped_at"] = datetime.now()
            job["userId"] = req.user_id
            try:
                collection.insert_one(job)
            except errors.DuplicateKeyError:
                pass

        # Normaliser pour le frontend
        normalized = []
        for j in results:
            normalized.append({
                "title": j.get("title", "N/A"),
                "company": j.get("company", "N/A"),
                "location": j.get("location", "N/A"),
                "contract": j.get("contract", "N/A"),
                "salary": j.get("salary", "N/A"),
                "description": j.get("description", ""),
                "link": j.get("link", ""),
                "posted_at": j.get("posted_at", datetime.now().strftime("%Y-%m-%d"))
            })

        return {"results": normalized}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run("scraper_api:app", host="127.0.0.1", port=8000, reload=True)


