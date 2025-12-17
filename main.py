# main.py
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote, urljoin
import time
import re
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer

# =========================================================
# 🔍 QUERY UNDERSTANDING
# =========================================================

KNOWN_LOCATIONS = [
    "paris", "london", "berlin", "madrid", "rome",
    "france", "uk", "germany", "spain", "italy",
    "remote"
]

KNOWN_TITLES = [
    "backend developer", "frontend developer", "full stack developer",
    "software engineer", "data scientist", "machine learning engineer",
    "devops engineer"
]

def extract_location(query: str):
    q = query.lower()
    for loc in KNOWN_LOCATIONS:
        if loc in q:
            return loc.title()
    return None

def extract_titles(query: str):
    q = query.lower()
    return [t.title() for t in KNOWN_TITLES if t in q]

# =========================================================
# 💰 SALARY EXTRACTION
# =========================================================

def extract_salary_from_text(text: str):
    if not text:
        return None

    text = text.lower().replace(",", "")

    patterns = [
        r'(\d{2,3})\s*-\s*(\d{2,3})\s*k',
        r'(\d{2,3})\s*k',
        r'€\s*(\d{4,6})',
        r'(\d{4,6})\s*€'
    ]

    for p in patterns:
        m = re.search(p, text)
        if m:
            if len(m.groups()) == 2:
                return f"{m.group(1)}k - {m.group(2)}k"
            return f"{m.group(1)}k"

    return None

# =========================================================
# 🔒 MASK DETECTION
# =========================================================

def is_masked(text: str) -> bool:
    if not text or text == "N/A":
        return True
    stars = text.count("*")
    return stars >= len(text) * 0.5

# =========================================================
# 🌐 LINKEDIN SCRAPER
# =========================================================

class DetailedJobScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "text/html"
        })

    def search_jobs(self, job_titles, locations, jobs_per_search=5):
        all_jobs = []

        for title in job_titles:
            for loc in locations:
                jobs = self.single_search(title, loc, jobs_per_search)
                all_jobs.extend(jobs)
                time.sleep(1)

        return all_jobs

    def single_search(self, job_title, location, target_count):
        jobs = []

        # 🔁 Over-fetch cards to replace masked ones
        fetch_limit = target_count * 3

        url = f"https://www.linkedin.com/jobs/search/?keywords={quote(job_title)}&location={quote(location)}"
        resp = self.session.get(url, timeout=15)

        if resp.status_code != 200:
            return jobs

        soup = BeautifulSoup(resp.content, "html.parser")
        cards = soup.select("div.base-card")[:fetch_limit]

        for card in cards:
            if len(jobs) >= target_count:
                break

            job = self.extract_job_info(card)

            # 🚫 Drop masked cards early
            if is_masked(job["title"]) or is_masked(job["company"]):
                continue

            detailed = self.get_job_details(job)
            if not detailed:
                continue

            # 🚫 Drop masked details
            if is_masked(detailed["title"]) or is_masked(detailed["company"]):
                continue

            jobs.append(detailed)
            time.sleep(0.5)

        return jobs

    def extract_job_info(self, card):
        def safe(sel):
            e = card.select_one(sel)
            return e.get_text(strip=True) if e else "N/A"

        link = card.select_one("a.base-card__full-link")
        link = link.get("href") if link else "N/A"
        if link.startswith("/"):
            link = urljoin("https://www.linkedin.com", link)

        return {
            "title": safe("h3"),
            "company": safe("h4"),
            "location": safe("span.job-search-card__location"),
            "link": link
        }

    def get_job_details(self, job):
        resp = self.session.get(job["link"], timeout=10)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.content, "html.parser")

        desc = soup.select_one(".show-more-less-html__markup")
        description = desc.get_text(" ", strip=True) if desc else ""

        salary = extract_salary_from_text(description)

        return {
            **job,
            "description": description,
            "salary": salary or "Not specified"
        }

# =========================================================
# 🧠 AI RANKING
# =========================================================

def load_model():
    return SentenceTransformer("all-MiniLM-L6-v2")

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def rank_jobs(model, query, jobs):
    texts = [j["title"] + " " + j["description"] for j in jobs]
    q_emb = model.encode([query])[0]
    job_embs = model.encode(texts)

    ranked = []
    for job, emb in zip(jobs, job_embs):
        score = cosine_similarity(q_emb, emb)
        job["score"] = round(score, 5)
        ranked.append(job)

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked

# =========================================================
# 🔁 SMART SEARCH
# =========================================================

def smart_search(scraper, user_query=None, title=None, location=None, jobs_per_search=5):
    if title and location:
        job_titles = [title]
        locations = [location]
    else:
        job_titles = extract_titles(user_query) or ["Software Engineer"]
        locations = [extract_location(user_query)] if extract_location(user_query) else ["Paris", "Remote"]

    print("🔎 Titles:", job_titles)
    print("📍 Locations:", locations)

    return scraper.search_jobs(job_titles, locations, jobs_per_search)

# =========================================================
# 🚀 ENTRY POINT
# =========================================================

if __name__ == "__main__":
    scraper = DetailedJobScraper()

    user_query = "backend developer london 60k"

    jobs = smart_search(scraper, user_query=user_query, jobs_per_search=5)

    model = load_model()
    ranked = rank_jobs(model, user_query, jobs)

    print("\n🔹 RESULTS")
    for j in ranked:
        print(
            f"{j['title']} | {j['company']} | {j['location']} | "
            f"Salary: {j['salary']} | Score: {j['score']}"
        )