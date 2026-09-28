#!/usr/bin/env python3
"""
AWS re:Invent 2026 Session Data Synchronizer
Author: Senior SRE & Developer Tooling
Purpose: Fetch, normalize, deduplicate, and compress the full re:Invent 2026 session catalog.
"""

import sys
import os
import json
import time
import gzip
import logging
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("sync_sessions")

WORKFLOW_RESOLVER_URL = (
    "https://registration.awsevents.com/flow/loadPage"
    "?pageUri=eventcatalog&workflowApiToken=awsevents.reinvent2026.eventcatalog"
)
CATALOG_SEARCH_URL = "https://catalog.awsevents.com/api/search"

# Fallback tokens discovered via reverse-engineering in case resolver is temporarily unavailable
FALLBACK_WIDGET_ID = "1782747647615002ute1"
FALLBACK_API_PROFILE_ID = "mSEPBdEOSHwzxJwd7H8MfSWVylSYQsS4"
PAGE_SIZE = 50
MAX_WORKERS = 8
MAX_RETRIES = 3

CAMPUS_MAP = {
    "venetian": "Venetian Campus",
    "palazzo": "Venetian Campus",
    "sands": "Venetian Campus",
    "caesars": "Caesars Campus",
    "wynn": "Wynn Campus",
    "encore": "Wynn Campus",
    "mandalay": "Mandalay Bay Campus",
    "mgm": "MGM Grand Campus"
}

def resolve_tokens():
    """Dynamically resolve widget and apiProfile tokens from the live RainFocus workflow page."""
    logger.info("Resolving live API tokens from workflow configuration...")
    try:
        req = urllib.request.Request(
            WORKFLOW_RESOLVER_URL,
            headers={"User-Agent": "Mozilla/5.0 (re:Invent 2026 Finder Synchronizer)"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        widget_conf = data.get("data", {}).get("widgetConf", {})
        widget_id = widget_conf.get("widgetId")
        api_profile_id = widget_conf.get("apiProfileToken")
        
        if widget_id and api_profile_id:
            logger.info("Resolved tokens successfully: widgetId=%s, apiProfileToken=%s", widget_id, api_profile_id)
            return widget_id, api_profile_id
    except Exception as e:
        logger.warning("Token resolution failed (%s). Falling back to known valid tokens.", e)

    return FALLBACK_WIDGET_ID, FALLBACK_API_PROFILE_ID

def fetch_page(offset, widget_id, api_profile_id, retries=MAX_RETRIES):
    """Fetch a single page of sessions with exponential backoff retry."""
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "rfWidgetId": widget_id,
        "rfApiProfileId": api_profile_id,
        "User-Agent": "Mozilla/5.0 (re:Invent 2026 Finder Synchronizer)"
    }
    body = f"type=session&size={PAGE_SIZE}&from={offset}".encode("utf-8")
    
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(CATALOG_SEARCH_URL, data=body, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                result = json.loads(resp.read().decode("utf-8"))
            return result
        except Exception as e:
            if attempt == retries:
                logger.error("Failed to fetch offset %d after %d attempts: %s", offset, retries, e)
                raise
            sleep_time = 0.5 * (2 ** (attempt - 1))
            logger.warning("Attempt %d failed for offset %d (%s). Retrying in %.2fs...", attempt, offset, e, sleep_time)
            time.sleep(sleep_time)

def determine_campus(venue_name, room_name=""):
    """Categorize physical venue and room into campus clusters for transit calculation."""
    combined = f"{venue_name or ''} {room_name or ''}".lower()
    for key, campus in CAMPUS_MAP.items():
        if key in combined:
            return campus
    if venue_name:
        return f"{venue_name} Campus"
    return "Other / Virtual"

def normalize_session(raw):
    """Prune raw RainFocus bloat and extract clean, indexed session record."""
    session_id = raw.get("sessionID") or raw.get("externalID")
    code = raw.get("code") or ""
    title = raw.get("title") or ""
    session_type = raw.get("type") or ""
    abstract = raw.get("abstract") or ""
    
    # Parse attributes
    topics = []
    areas_of_interest = []
    roles = []
    level = ""
    venue = ""
    
    for attr in raw.get("attributevalues", []):
        attr_name = (attr.get("attribute") or attr.get("attribute_id") or "").lower()
        val = attr.get("value") or ""
        if not val:
            continue
            
        if "topic" in attr_name:
            if val not in topics:
                topics.append(val)
        elif "area of interest" in attr_name or "areaofinterest" in attr_name:
            if val not in areas_of_interest:
                areas_of_interest.append(val)
        elif "level" in attr_name:
            level = val
        elif "role" in attr_name:
            if val not in roles:
                roles.append(val)
        elif "venue" in attr_name:
            venue = val
            
    # Parse scheduled times
    times = []
    for t in raw.get("times", []):
        room = t.get("room") or ""
        time_venue = venue
        if not time_venue and room:
            # Extract venue from room string e.g. "Caesars Palace | Promenade Level | Roman I"
            time_venue = room.split("|")[0].strip()
            
        times.append({
            "id": t.get("sessionTimeID") or "",
            "date": t.get("date") or "",
            "day": t.get("dayDisplayName") or t.get("dayName") or "",
            "startTime": t.get("startTime") or "",
            "endTime": t.get("endTime") or "",
            "startTimeFormatted": t.get("startTimeFormatted") or "",
            "endTimeFormatted": t.get("endTimeFormatted") or "",
            "duration": int(t.get("length") or 60),
            "room": room,
            "venue": time_venue
        })
        if not venue and time_venue:
            venue = time_venue

    campus = determine_campus(venue, times[0]["room"] if times else "")

    return {
        "id": session_id,
        "code": code,
        "title": title,
        "type": session_type,
        "level": level,
        "topics": sorted(topics),
        "areasOfInterest": sorted(areas_of_interest),
        "roles": sorted(roles),
        "venue": venue or "TBD",
        "campus": campus,
        "abstract": abstract,
        "times": times
    }

def extract_items_from_response(page_data):
    """Extract item array regardless of whether wrapped in sectionList or root items."""
    if not page_data:
        return []
    if page_data.get("items"):
        return page_data["items"]
    sec_list = page_data.get("sectionList", [])
    if sec_list and sec_list[0].get("items"):
        return sec_list[0]["items"]
    return []

def main():
    start_time = time.time()
    logger.info("=== Starting AWS re:Invent 2026 Session Data Sync ===")
    
    widget_id, api_profile_id = resolve_tokens()
    
    # Initial request to get total count
    logger.info("Fetching initial batch to determine total session count...")
    initial_res = fetch_page(0, widget_id, api_profile_id)
    total_items = initial_res.get("totalSearchItems") or initial_res.get("total")
    
    if not total_items:
        section_list = initial_res.get("sectionList", [])
        if section_list:
            total_items = section_list[0].get("total", 0)
            
    if not total_items:
        logger.error("Could not determine total session count. Aborting.")
        sys.exit(1)
        
    logger.info("Discovered total indexed sessions: %d", total_items)
    
    all_raw_items = []
    # Collect items from page 0
    all_raw_items.extend(extract_items_from_response(initial_res))
        
    # Queue remaining pages
    offsets = list(range(PAGE_SIZE, total_items, PAGE_SIZE))
    logger.info("Fetching remaining %d pages using %d worker threads...", len(offsets), MAX_WORKERS)
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_offset = {
            executor.submit(fetch_page, offset, widget_id, api_profile_id): offset
            for offset in offsets
        }
        
        completed = 0
        for future in as_completed(future_to_offset):
            offset = future_to_offset[future]
            try:
                page_data = future.result()
                items = extract_items_from_response(page_data)
                all_raw_items.extend(items)
                completed += 1
                if completed % 10 == 0 or completed == len(offsets):
                    logger.info("Progress: %d/%d pages fetched (%d sessions so far)", completed, len(offsets), len(all_raw_items))
            except Exception as e:
                logger.error("Error fetching offset %d: %s", offset, e)
                sys.exit(1)
                
    elapsed = time.time() - start_time
    logger.info("All pages downloaded in %.2f seconds! Total raw items: %d", elapsed, len(all_raw_items))
    
    # Deduplicate and normalize
    seen_ids = set()
    normalized_sessions = []
    venues_count = {}
    campuses_count = {}
    days_count = {}
    levels_count = {}
    topics_set = set()
    types_count = {}
    
    for raw in all_raw_items:
        session = normalize_session(raw)
        sid = session["id"]
        if not sid or sid in seen_ids:
            continue
        seen_ids.add(sid)
        normalized_sessions.append(session)
        
        # Aggregate statistics
        v = session["venue"]
        venues_count[v] = venues_count.get(v, 0) + 1
        
        c = session["campus"]
        campuses_count[c] = campuses_count.get(c, 0) + 1
        
        lvl = session["level"] or "Unspecified"
        levels_count[lvl] = levels_count.get(lvl, 0) + 1
        
        stype = session["type"] or "Other"
        types_count[stype] = types_count.get(stype, 0) + 1
        
        for t in session["topics"]:
            topics_set.add(t)
            
        for time_slot in session["times"]:
            day = time_slot.get("day") or "Unscheduled"
            days_count[day] = days_count.get(day, 0) + 1
            
    # Sort sessions by session code, then title
    normalized_sessions.sort(key=lambda x: (x["code"] or "ZZZ", x["title"]))
    
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    public_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "data"))
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(public_data_dir, exist_ok=True)
    
    json_path = os.path.join(output_dir, "sessions.json")
    min_json_path = os.path.join(output_dir, "sessions.min.json")
    meta_path = os.path.join(output_dir, "metadata.json")
    
    logger.info("Writing normalized datasets...")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(normalized_sessions, f, indent=2, ensure_ascii=False)
        
    with open(min_json_path, "w", encoding="utf-8") as f:
        json.dump(normalized_sessions, f, separators=(",", ":"), ensure_ascii=False)
        
    # Also write to public/data for frontend static hosting
    with open(os.path.join(public_data_dir, "sessions.min.json"), "w", encoding="utf-8") as f:
        json.dump(normalized_sessions, f, separators=(",", ":"), ensure_ascii=False)
        
    metadata = {
        "event": "AWS re:Invent 2026",
        "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalSessions": len(normalized_sessions),
        "scheduledTimeSlots": sum(len(s["times"]) for s in normalized_sessions),
        "campuses": campuses_count,
        "venues": venues_count,
        "levels": levels_count,
        "sessionTypes": types_count,
        "days": days_count,
        "topics": sorted(topics_set)
    }
    
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    with open(os.path.join(public_data_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    # File size metrics
    raw_size_mb = os.path.getsize(json_path) / (1024 * 1024)
    min_size_mb = os.path.getsize(min_json_path) / (1024 * 1024)
    
    with open(min_json_path, "rb") as f_in:
        compressed_bytes = gzip.compress(f_in.read(), compresslevel=9)
    gz_size_kb = len(compressed_bytes) / 1024
    
    logger.info("=== Extraction & Optimization Summary ===")
    logger.info("Total unique sessions indexed: %d", len(normalized_sessions))
    logger.info("Uncompressed JSON size: %.2f MB", raw_size_mb)
    logger.info("Minified JSON size: %.2f MB", min_size_mb)
    logger.info("Gzipped payload size: %.1f KB (Edge CDN transfer size)", gz_size_kb)
    logger.info("Venues represented: %s", list(venues_count.keys()))
    logger.info("Campuses clustered: %s", list(campuses_count.keys()))
    logger.info("Saved to: %s", min_json_path)
    logger.info("Done in %.2f seconds.", time.time() - start_time)

if __name__ == "__main__":
    main()
