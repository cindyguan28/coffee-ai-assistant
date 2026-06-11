import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def ask_ollama(prompt: str, model: str = "llama3.2:3b") -> str:
    payload = {"model": model, "prompt": prompt, "stream": False}
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=90)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except requests.exceptions.ConnectionError:
        return "无法连接 Ollama。请确认 Ollama 已启动：ollama serve"
    except requests.exceptions.Timeout:
        return "Ollama 响应超时。可以换更小模型，或减少历史记录数量。"
    except Exception as e:
        return f"Ollama 调用失败：{e}"
