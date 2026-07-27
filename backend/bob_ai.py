"""
Bob AI — Print Cosmos's intelligent assistant.

Architecture:
1. First tries keyword matching against bobKnowledge (fast, predictable)
2. Falls back to an LLM call (OpenAI / Anthropic / OpenRouter) with trusted
   context injected into the system prompt
3. Returns a clean JSON response

Trusted sources are compiled into bob_context.json by build_bob_context.py.
"""

import json
import os
import re
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

# ---------------------------------------------------------------------------
# 2.5. SearX-NG search configuration (optional)
# ---------------------------------------------------------------------------
SEARXNG_URL = os.environ.get("SEARXNG_URL", "")

TRUSTED_SOURCES = [
    "help.prusa3d.com",
    "wiki.bambulab.com",
    "ic3dprinters.com",
    "3dfuel.com",
    "support.makerbot.com",
    "wiki.polymaker.com",
    "3dxtech.com",
    "all3dp.com",
    "reprap.org",
    "formlabs.com",
]


# ---------------------------------------------------------------------------
# 1. Load trusted context (compiled by build_bob_context.py)
# ---------------------------------------------------------------------------
_CONTEXT_CACHE = None

def load_context() -> dict:
    global _CONTEXT_CACHE
    if _CONTEXT_CACHE is not None:
        return _CONTEXT_CACHE
    ctx_path = ROOT_DIR / "bob_context.json"
    if ctx_path.exists():
        try:
            with open(ctx_path, "r") as f:
                _CONTEXT_CACHE = json.load(f)
            logger.info(f"Bob context loaded ({len(_CONTEXT_CACHE.get('sources', []))} sources)")
        except Exception as e:
            logger.warning(f"Failed to load bob_context.json: {e}")
            _CONTEXT_CACHE = {"sources": [], "knowledge": {}, "docs": ""}
    else:
        logger.warning("bob_context.json not found — run build_bob_context.py")
        _CONTEXT_CACHE = {"sources": [], "knowledge": {}, "docs": ""}
    return _CONTEXT_CACHE


# ---------------------------------------------------------------------------
# 2. Keyword matcher (from bobKnowledge)
# ---------------------------------------------------------------------------
def keyword_match(message: str, knowledge: dict) -> Optional[str]:
    """Try to match the message against keyword-based knowledge entries.
    Returns a response string if found, None otherwise."""
    if not message or not knowledge:
        return None

    lower = message.lower().strip()

    for category, data in knowledge.items():
        keywords = data.get("keywords", [])
        responses = data.get("responses", [])
        if not keywords or not responses:
            continue
        for keyword in keywords:
            if keyword.lower() in lower:
                import random
                return random.choice(responses)

    return None

# ---------------------------------------------------------------------------
# 2.5. Live web search via SearX-NG
# ---------------------------------------------------------------------------
def bob_search(query: str, num_results: int = 5) -> str:
    """Query SearX-NG for live web search results from trusted sources only.
    Only uses results from TRUSTED_SOURCES domains.
    Returns formatted search results or empty string if unavailable."""
    if not SEARXNG_URL or "REPLACE_WITH" in SEARXNG_URL:
        return ""
    try:
        import requests
        resp = requests.get(SEARXNG_URL, params={
            "q": query,
            "format": "json",
            "no_html": "1",
            "safe_search": "1",
        }, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])[:num_results]
        # Priority 1: trusted sources
        trusted_results = [r for r in results if any(t in r.get("url", "") for t in TRUSTED_SOURCES)]
        # Priority 2: non-Wikipedia, non-social media results
        skip_domains = ["wikipedia.org", "wikimedia.org", "reddit.com", "facebook.com", "twitter.com", "youtube.com", "tiktok.com", "instagram.com"]
        non_wiki_results = [r for r in results if not any(d in r.get("url", "") for d in skip_domains)]
        non_wiki_trusted = [r for r in non_wiki_results if any(t in r.get("url", "") for t in TRUSTED_SOURCES)]
        # Use trusted first, then non-wiki, then all as last resort
        if trusted_results:
            filtered_results = trusted_results
        elif non_wiki_results:
            filtered_results = non_wiki_results
        else:
            filtered_results = results
        if not filtered_results:
            return ""
        lines = []
        for r in filtered_results:
            title = r.get("title", "")
            url = r.get("url", "")
            content = r.get("content", "")
            if title:
                lines.append(f"- {title}: {url}")
                if content:
                    lines.append(f"  {content[:150]}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"SearX-NG search failed: {e}")
        return ""


# ---------------------------------------------------------------------------
# 3. LLM caller
# ---------------------------------------------------------------------------
def call_llm(
    message: str,
    context: str,
    conversation_history: Optional[list] = None,
    search_results: str = "",
) -> str:
    """Call the configured LLM with the user's message and trusted context.
    Supports OpenAI, Anthropic, and OpenRouter via a single API key pattern.
    For OpenRouter, falls through a list of free models if the primary model fails."""
    api_key = os.environ.get("BOB_AI_API_KEY", "")
    model = os.environ.get("BOB_AI_MODEL", "gpt-4o-mini")
    provider = os.environ.get("BOB_AI_PROVIDER", "openai")

    if not api_key or "REPLACE_WITH" in api_key:
        return (
            "I'm not connected to my AI brain yet! "
            "An API key needs to be configured in the backend .env file. "
            "Ask the platform owner to set one up."
        )

    system_prompt = (
        "You are Bob, the official AI assistant for Print Cosmos and a general knowledge helper — a 3D printing marketplace and design platform. "
        "You are knowledgeable, friendly, and concise. Answer in 2-4 sentences unless the question requires more detail.\n\n"
        "PREDICTABLE REPLY RULES:\n"
        "1. For Print Cosmos questions, use the TRUSTED SOURCES (docs) as your primary source.\n"
        "2. For general questions, use TRUSTED SEARCH RESULTS from the live web search.\n"
        "3. Only answer based on the TRUSTED SOURCES and SEARCH RESULTS provided. Do not make up facts.\n"
        "4. If you cannot find an answer in trusted sources, say you're not sure and suggest related topics.\n"
        "5. Never invent technical specifications, prices, or features.\n"
        "6. Be warm and encouraging — you're a guide for makers of all skill levels.\n"
        "7. Use simple language. Avoid jargon unless explaining it.\n\n"
        "TRUSTED SOURCES — Print Cosmos Documents:\n"
        f"{context}\n\n"
    )
    if search_results:
        system_prompt += "TRUSTED SEARCH RESULTS:\n" + search_results + "\n\n"
    system_prompt += "Remember: You are Bob, Print Cosmos AI helper and a general knowledge assistant via SearX-NG. Stay in character."


    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history if provided (last 6 messages)
    if conversation_history:
        for entry in conversation_history[-6:]:
            messages.append(entry)

    messages.append({"role": "user", "content": message})

    # Build list of models to try (primary model, then free models)
    models_to_try = [model]
    if provider == "openrouter":
        free_models_str = os.environ.get("BOB_AI_FREE_MODELS", "")
        if free_models_str:
            for m in free_models_str.split(","):
                m = m.strip()
                if m and m not in models_to_try:
                    models_to_try.append(m)

    last_error = None
    for attempt_model in models_to_try:
        try:
            if provider == "openai" or provider == "openrouter":
                return _call_openai(messages, api_key, attempt_model, provider)
            elif provider == "anthropic":
                return _call_anthropic(messages, api_key, attempt_model)
            else:
                return f"Unknown AI provider: {provider}. Use 'openai', 'openrouter', or 'anthropic'."
        except Exception as e:
            last_error = e
            logger.warning(f"LLM call failed for model {attempt_model}: {e}")
            continue

    logger.error(f"LLM call failed for all models: {last_error}")
    return (
        "Sorry, I had trouble reaching my AI brain! "
        "Please try again in a moment, or check that the API key is valid."
    )


def _call_openai(messages: list, api_key: str, model: str, provider: str) -> str:
    import requests

    if provider == "openrouter":
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://printcosmos.app",
            "X-Title": "Print Cosmos Bob AI",
        }
    else:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 500,
        "temperature": 0.3,
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if "choices" not in data or not data["choices"]:
        raise ValueError(f"Unexpected API response format for model {model}")

    message = data["choices"][0]["message"]
    content = message.get("content")

    if content is None:
        reasoning = message.get("reasoning", "")
        if isinstance(reasoning, list):
            reasoning_parts = [r.get("text", "") for r in reasoning if isinstance(r, dict)]
            content = " ".join(reasoning_parts)
        elif isinstance(reasoning, str):
            content = reasoning
        else:
            content = message.get("refusal") or ""

    return content.strip()


def _call_anthropic(messages: list, api_key: str, model: str) -> str:
    import requests

    # Extract system prompt and convert to Anthropic format
    system_content = ""
    anthropic_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_content = msg["content"]
        else:
            anthropic_messages.append(msg)

    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model or "claude-3-haiku-20240307",
        "max_tokens": 500,
        "system": system_content,
        "messages": anthropic_messages,
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data["content"][0]["text"].strip()


# ---------------------------------------------------------------------------
# 4. Main entry point
# ---------------------------------------------------------------------------
def bob_ask(
    message: str,
    conversation_history: Optional[list] = None,
) -> dict:
    """Process a user message and return Bob's response.

    Returns:
        {"response": str, "source": "keyword"|"llm", "matched_category": str|None}
    """
    context = load_context()
    knowledge = context.get("knowledge", {})
    docs_text = context.get("docs", "")

    # Step 1: Try keyword matching first (fast, predictable)
    keyword_response = keyword_match(message, knowledge)
    if keyword_response:
        return {
            "response": keyword_response,
            "source": "keyword",
            "matched_category": _find_category(message, knowledge),
        }

    # Step 2: Try live web search (if configured)
    live_search = ""
    if SEARXNG_URL:
        live_search = bob_search(message)

    # Step 3: Fall back to LLM
    llm_response = call_llm(message, docs_text, conversation_history, live_search)
    return {
        "response": llm_response,
        "source": "llm",
        "matched_category": None,
    }


def _find_category(message: str, knowledge: dict) -> Optional[str]:
    """Find which knowledge category matched the message."""
    lower = message.lower().strip()
    for category, data in knowledge.items():
        for keyword in data.get("keywords", []):
            if keyword.lower() in lower:
                return category
    return None