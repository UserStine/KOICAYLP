# Peko knowledge base seed

`public-knowledge.json` is now a **one-time migration seed only**. Peko does not read this JSON file at runtime.

The live knowledge base is stored in Supabase table `knowledge_articles` and managed from **Admin → Knowledge Base**.

Initial setup:
1. Run `backend/sql/006_knowledge_base.sql` in Supabase SQL Editor.
2. Run `npm run supabase:migrate-knowledge` from the backend directory.
3. Use Admin → Knowledge Base for all future edits/publishing.
4. Run `npm run rag:build` after major knowledge changes if you want the local Gemini embedding index refreshed.
