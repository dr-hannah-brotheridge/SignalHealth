## SignalHealth PWA
**https://signalhealth.dev/**

## Tech Stack: 
Node.js, Supabase (PostgreSQL/RLS), Anthropic API (Claude), Vercel.

## Core Achievement: 
Architected a deterministic "Clinical Control Engine" that utilizes 18+ pages of safety-critical prompt logic to manage health triage. Implemented longitudinal memory using Supabase, allowing the AI to maintain a persistent, structured health profile across sessions.

## Key Skill: 
Built a robust, RLS-protected authentication flow and API integration that handles complex state-based conversations while strictly adhering to safety/medical-risk guardrails.

## Cost Efficiency using AI LLM:
- Switched profile extraction from `claude-sonnet-4-6` → `claude-haiku-4-5-20251001`
- Capped chat messages at 15 with health_story as long-term context
- Profile extraction now runs every 5 messages instead of every message after 2
- Prompt caching
- = Saved 75% on tokens 
