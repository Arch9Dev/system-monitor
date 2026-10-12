from fastapi import FastAPI

app = FastAPI(title="System Monitor API")


@app.get("/health")
def health():
    return {"status": "ok"}