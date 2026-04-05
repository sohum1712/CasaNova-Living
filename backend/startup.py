#!/usr/bin/env python3

import uvicorn
import sys


def startup():
    """Start the server (DB pool is initialized by FastAPI startup event in main.py)"""
    try:
        print("Starting Brickhouse Brands API...")
        print("Starting FastAPI server on http://localhost:8000 ...")

        # Start the server - DB pool is initialized via @app.on_event("startup") in main.py
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,  # Enable auto-reload for development
            log_level="info",
        )

    except KeyboardInterrupt:
        print("\n🛑 Server shutdown requested by user")
        sys.exit(0)
    except Exception as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    startup()
