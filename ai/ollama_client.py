import requests

OLLAMA_URL = "http://localhost:11434/api/generate"


def ask_ollama(prompt: str, model: str = "llama3.2:3b") -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=90)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except requests.exceptions.ConnectionError:
        return "Cannot connect to Ollama. Please run: ollama serve"
    except requests.exceptions.Timeout:
        return "Ollama request timed out."
    except Exception as e:
        return f"Ollama error: {e}"