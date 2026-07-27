"""
Bob Context Builder — compiles trusted sources into bob_context.json.

Run this script whenever your documentation or knowledge base changes:
    python build_bob_context.py

It scans the following sources defined in the SOURCES list below:
  - frontend/src/data/bobKnowledge.js  (existing keyword Q&A)
  - docs/INDEX.md                       (documentation index)
  - docs/DOCUMENTS.md                   (Print Cosmos platform documentation)
  - docs/ADMIN_MAINTENANCE.md           (admin docs)
  - memory/PRD.md                       (product requirements)
  - README.md                           (project overview)
  - DESIGN_SYSTEM.md                    (design guidelines)

Adding a new trusted source:
  1. Create or update the source file (e.g., docs/NEW_TOPIC.md)
  2. Add an entry to the SOURCES list below with:
     - "path": absolute path to the file
     - "label": human-readable name for the source
     - "type": "doc" for markdown documents, "knowledge" for keyword Q&A
  3. Run `python build_bob_context.py` to regenerate bob_context.json
  4. Bob will now include the new source in its LLM context for more
     predictable, grounded replies.

Output: backend/bob_context.json

Trusted sources are compiled into bob_context.json by build_bob_context.py.
Bob's AI (bob_ai.py) uses these trusted sources to ground its LLM responses,
ensuring answers are predictable and based only on authoritative platform knowledge.
"""

import json
import re
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent  # backend/
PROJECT_DIR = ROOT_DIR.parent     # project root

SOURCES = [
    {
        "path": PROJECT_DIR / "frontend" / "src" / "data" / "bobKnowledge.js",
        "label": "Bob's Knowledge Base (keyword Q&A)",
        "type": "knowledge",
    },
    {
        "path": PROJECT_DIR / "docs" / "INDEX.md",
        "label": "Documentation Index",
        "type": "doc",
    },
    {
        "path": PROJECT_DIR / "docs" / "DOCUMENTS.md",
        "label": "Print Cosmos Documents",
        "type": "doc",
    },
    {
        "path": PROJECT_DIR / "docs" / "ADMIN_MAINTENANCE.md",
        "label": "Admin Maintenance Guide",
        "type": "doc",
    },
    {
        "path": PROJECT_DIR / "memory" / "PRD.md",
        "label": "Product Requirements Document",
        "type": "doc",
    },
    {
        "path": PROJECT_DIR / "README.md",
        "label": "Project README",
        "type": "doc",
    },
    {
        "path": PROJECT_DIR / "DESIGN_SYSTEM.md",
        "label": "Design System Guidelines",
        "type": "doc",
    },
]


def extract_knowledge_from_js(filepath: Path) -> dict:
    """Parse bobKnowledge.js and extract the keyword-response structure."""
    if not filepath.exists():
        print(f"  [SKIP] {filepath.name} not found")
        return {}

    content = filepath.read_text(encoding="utf-8")

    # Remove the export statement and find the bobKnowledge object
    # Strategy: find each category block by matching `categoryName: {`
    # then extract keywords and responses arrays using balanced bracket matching
    knowledge = {}

    # Find all category blocks: word: { keywords: [...], responses: [...] }
    # We use a simpler approach: find the start of each category, then
    # extract the keywords and responses arrays
    lines = content.split('\n')
    current_category = None
    in_keywords = False
    in_responses = False
    keywords = []
    responses = []
    bracket_depth = 0
    in_string = False
    string_char = None

    for line in lines:
        stripped = line.strip()
        
        # Skip comments and empty lines
        if stripped.startswith('//') or not stripped:
            continue
            
        # Check for category start: `word: {` (skip export const and default_response)
        if 'export const' in stripped or 'default_response' in stripped:
            continue
        category_match = re.match(r'(\w+):\s*\{', stripped)
        if category_match and not in_keywords and not in_responses:
            if current_category and keywords and responses:
                knowledge[current_category] = {"keywords": keywords, "responses": responses}
            current_category = category_match.group(1)
            keywords = []
            responses = []
            in_keywords = False
            in_responses = False
            continue
            
        # Check for keywords array
        if 'keywords:' in stripped and current_category:
            in_keywords = True
            in_responses = False
            # Extract from this line
            arr_match = re.search(r'\[(.*)\]', stripped)
            if arr_match:
                kw = re.findall(r'"([^"]*)"', arr_match.group(1))
                keywords.extend(kw)
                # Check if array ends on same line
                if stripped.rstrip().endswith(']'):
                    in_keywords = False
            continue
            
        # Check for responses array
        if 'responses:' in stripped and current_category:
            in_keywords = False
            in_responses = True
            # Extract from this line
            arr_match = re.search(r'\[(.*)\]', stripped)
            if arr_match:
                resp = re.findall(r'"([^"]*)"', arr_match.group(1))
                responses.extend(resp)
                if stripped.rstrip().endswith(']'):
                    in_responses = False
            continue
            
        # If we're inside keywords, extract strings
        if in_keywords:
            kw = re.findall(r'"([^"]*)"', stripped)
            keywords.extend(kw)
            if stripped.rstrip().endswith('],') or stripped.rstrip().endswith(']'):
                in_keywords = False
            continue
            
        # If we're inside responses, extract strings
        if in_responses:
            resp = re.findall(r'"([^"]*)"', stripped)
            responses.extend(resp)
            if stripped.rstrip().endswith('],') or stripped.rstrip().endswith(']'):
                in_responses = False
            continue

    # Don't forget the last category
    if current_category and keywords and responses:
        knowledge[current_category] = {"keywords": keywords, "responses": responses}

    print(f"  [OK]   {filepath.name} — {len(knowledge)} categories extracted")
    return knowledge


def extract_doc_text(filepath: Path) -> str:
    """Read a markdown/doc file and return its text content."""
    if not filepath.exists():
        print(f"  [SKIP] {filepath.name} not found")
        return ""

    text = filepath.read_text(encoding="utf-8")
    print(f"  [OK]   {filepath.name} — {len(text)} chars")
    return text


def build():
    print("=" * 60)
    print("Bob Context Builder")
    print("=" * 60)
    print()

    knowledge = {}
    docs = []
    sources_meta = []

    for source in SOURCES:
        filepath = source["path"]
        label = source["label"]
        stype = source["type"]

        if stype == "knowledge":
            extracted = extract_knowledge_from_js(filepath)
            knowledge.update(extracted)
            if extracted:
                sources_meta.append({"label": label, "type": stype, "categories": list(extracted.keys())})
        elif stype == "doc":
            text = extract_doc_text(filepath)
            if text:
                docs.append(f"## {label}\n\n{text}")
                sources_meta.append({"label": label, "type": stype, "chars": len(text)})

    # Build the context document (all docs concatenated)
    docs_text = "\n\n---\n\n".join(docs)

    # Build the output
    context = {
        "version": 1,
        "sources": sources_meta,
        "knowledge": knowledge,
        "docs": docs_text,
    }

    # Write to backend/bob_context.json
    output_path = ROOT_DIR / "bob_context.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(context, f, indent=2, ensure_ascii=False)

    print()
    print("=" * 60)
    print(f"Done! Written to {output_path}")
    print(f"  - {len(knowledge)} knowledge categories")
    print(f"  - {len(docs)} documentation sources")
    print(f"  - {len(docs_text)} total chars of context")
    print("=" * 60)


if __name__ == "__main__":
    build()