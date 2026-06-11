# Coffee AI Assistant

A local-first personal coffee database and AI brewing assistant.

This project uses:

- SQLite for structured coffee data
- Streamlit for a simple local UI
- Ollama for local AI recommendations
- English normalized database fields and values
- Chinese UI hints for easier daily use

## Why English data?

Coffee information is usually described in English on bags and roaster websites: `washed`, `natural`, `light`, `medium_light`, `jasmine`, `citrus`, `dark_chocolate`, `balanced`, `low`.

Using English normalized values makes the database easier to query, analyze, and later connect to LangChain / RAG.

## Install

```bash
pip install -r requirements.txt
```

## Start Ollama

```bash
ollama pull llama3.2:3b
ollama serve
```

If Ollama already runs in the background, you can skip `ollama serve`.

## Initialize database

```bash
python db.py
```

## Run app

```bash
streamlit run app.py
```

## Suggested workflow

1. Add a bean in the Beans tab.
2. Record each brew in the Brew Logs tab.
3. Use AI Recommendation after you have a few records.
4. Update Grinder Profiles when you find stable settings.
