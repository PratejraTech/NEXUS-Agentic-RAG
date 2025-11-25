# Nexus Graph-RAG

A hybrid Agentic Graph-RAG intelligence engine.

## Architecture

*   **Frontend**: React + Vite + Tailwind + D3.js
*   **Backend**: Python FastAPI + LangGraph
*   **Database**: PostgreSQL (Metadata), ChromaDB (Vectors), Memgraph (Graph)
*   **LLM**: Google Gemini 2.5 Flash / Pro

## Quick Start

1.  **Set API Key**
    Create a `.env` file in the root directory:
    ```bash
    API_KEY=your_google_genai_api_key
    ```

2.  **Run the System**
    Use the startup script to ensure you have the latest code and build the containers:
    ```bash
    sh start.sh
    ```
    *This script will automatically `git pull` the latest changes from GitHub before starting.*

3.  **Access Interfaces**
    *   Frontend: `http://localhost:5173`
    *   Backend API Docs: `http://localhost:8000/docs`
    *   Memgraph Lab: `http://localhost:3000`

## Folder Structure

*   `/backend`: Python FastAPI application and LangGraph agents.
*   `/components`: React frontend components.
*   `/services`: Frontend API service adapters.
*   `/data_model`: Database initialization scripts.

## Development

To run the frontend in the provided preview environment, simply use the built-in runner. The backend code is provided for local deployment via Docker.

If you prefer manual Docker control:
```bash
docker-compose up --build
```
