# main.py
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote, urljoin
import time
import re
from typing import List, Dict

# ---------------------------
# LinkedIn Scraper
# ---------------------------
class DetailedJobScraper:
    def __init__(self):
        self.session = requests.Session()
        self.setup_session()

    def setup_session(self):
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        })

    def search_jobs(self, job_titles: List[str], locations: List[str], jobs_per_search: int = 5) -> List[Dict]:
        """Search many title/location combinations and return a list of job dicts."""
        all_jobs = []
        for job_title in job_titles:
            for location in locations:
                jobs = self.single_search(job_title, location, jobs_per_search)
                all_jobs.extend(jobs)
                time.sleep(1)
        return all_jobs

    def single_search(self, job_title: str, location: str, max_jobs: int):
        jobs = []
        try:
            url = f"https://www.linkedin.com/jobs/search/?keywords={quote(job_title)}&location={quote(location)}"
            resp = self.session.get(url, timeout=15)
            if resp.status_code == 200:
                listings = self.parse_search_results(resp.content, max_jobs)
                for i, job in enumerate(listings):
                    if i >= max_jobs:
                        break
                    detailed = self.get_job_details(job)
                    if detailed:
                        jobs.append(detailed)
                    time.sleep(0.5)
        except Exception as e:
            print(f"⚠️ single_search error: {e}")
        return jobs

    def parse_search_results(self, html, max_jobs):
        soup = BeautifulSoup(html, 'html.parser')
        jobs = []
        selectors = [
            'div.base-card', 'li.job-result-card', 'div.job-search-card',
            'section.jobs-search__results-list li', '[data-entity-urn*="jobPosting"]'
        ]
        for sel in selectors:
            cards = soup.select(sel)
            if cards:
                for card in cards[:max_jobs]:
                    job_data = self.extract_job_info(card)
                    if job_data:
                        jobs.append(job_data)
                break
        return jobs

    def extract_job_info(self, card):
        def safe_text(selectors):
            for sel in selectors:
                e = card.select_one(sel)
                if e:
                    return e.get_text(strip=True)
            return "N/A"

        title = safe_text(['h3.base-search-card__title', 'h3.job-result-card__title', '.base-search-card__title', 'span.sr-only'])
        company = safe_text(['h4.base-search-card__subtitle', 'a.job-result-card__company', '.base-search-card__subtitle'])
        location = safe_text(['span.job-search-card__location', 'span.job-result-card__location', '.job-search-card__location'])
        link_elem = card.select_one('a.base-card__full-link,a.job-result-card__full-card-link,.base-card__full-link')
        link = link_elem.get('href') if link_elem else "N/A"
        if isinstance(link, str) and link.startswith('/'):
            link = urljoin('https://www.linkedin.com', link)
        return {'title': title, 'company': company, 'location': location, 'link': link}

    def get_job_details(self, job):
        url = job.get('link')
        if not url or url == "N/A":
            return {
                'title': job.get('title', 'N/A'),
                'company': job.get('company', 'N/A'),
                'location': job.get('location', 'N/A'),
                'link': 'N/A',
                'contract': 'Not specified',
                'description': 'Description not available'
            }
        try:
            resp = self.session.get(url, timeout=10)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.content, 'html.parser')

            # Description
            desc_sel = ['.description__text', '.show-more-less-html__markup', '.jobs-box__html-content', '.description', '.jobs-description__content', 'div.description__text']
            description = "Description not available"
            for sel in desc_sel:
                e = soup.select_one(sel)
                if e:
                    description = re.sub(r'\s+', ' ', e.get_text(strip=True))
                    break

            # Contract / job type
            type_sel = ['.jobs-description-details__list-item span', '.jobs-unified-top-card__job-insight', '.jobs-details-top-card__job-type']
            job_type = "Not specified"
            for sel in type_sel:
                elems = soup.select(sel)
                for e in elems:
                    t = e.get_text(strip=True).lower()
                    if any(w in t for w in ['full-time', 'part-time', 'contract', 'internship', 'temporary', 'cdi', 'cdd']):
                        job_type = t.title()
                        break
                if job_type != "Not specified":
                    break

            return {
                'title': job.get('title', 'N/A'),
                'company': job.get('company', 'N/A'),
                'location': job.get('location', 'N/A'),
                'link': url,
                'contract': job_type,
                'description': description
            }
        except Exception as e:
            print(f"⚠️ get_job_details error: {e}")
            return {
                'title': job.get('title', 'N/A'),
                'company': job.get('company', 'N/A'),
                'location': job.get('location', 'N/A'),
                'link': url,
                'contract': 'Not specified',
                'description': 'Description not available'
            }

# ---------------------------
# AI Ranking (all-MiniLM-L6-v2)
# ---------------------------
from sentence_transformers import SentenceTransformer
import numpy as np

def load_model(model_name="all-MiniLM-L6-v2"):
    print(f"⏳ Loading embedding model: {model_name}")
    model = SentenceTransformer(model_name)
    print("✅ Model loaded")
    return model

def embed_texts(model, texts):
    return model.encode(texts, show_progress_bar=False, convert_to_tensor=False)

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0: return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def rank_jobs(model, user_query, jobs):
    """Rank job dicts by similarity to user_query using all-MiniLM embeddings"""
    if not jobs:
        return []
    job_texts = [f"{j.get('title','')} {j.get('description','')}" for j in jobs]
    query_emb = embed_texts(model, [user_query])[0]
    job_embs = embed_texts(model, job_texts)
    ranked = []
    for job, emb in zip(jobs, job_embs):
        score = cosine_similarity(query_emb, emb)
        r = dict(job)
        r['score'] = round(score, 6)
        ranked.append(r)
    ranked.sort(key=lambda x: x['score'], reverse=True)
    return ranked

# ---------------------------
# Script Entry
# ---------------------------
if __name__ == "__main__":
    scraper = DetailedJobScraper()
    # Example scraping
    results = scraper.search_jobs(["Backend Developer"], ["Paris"], jobs_per_search=3)

    print("\n🔹 Scraped jobs:")
    import json
    print(json.dumps(results, ensure_ascii=False, indent=2))

    # Example AI ranking
    model = load_model("all-MiniLM-L6-v2")
    query = "Python developer with machine learning experience"
    ranked = rank_jobs(model, query, results)

    print("\n🔹 Top ranked jobs for query:", query)
    for i, job in enumerate(ranked, 1):
        print(f"{i}. {job['title']} — {job['company']} — {job['location']} — Score: {job['score']}")
