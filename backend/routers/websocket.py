from fastapi import WebSocket, WebSocketDisconnect
import json
import traceback

async def websocket_endpoint(websocket: WebSocket, company_name: str):
    await websocket.accept()
    try:
        from services.github_ingester import fetch_github_data, save_signals
        from services.news_ingester import fetch_news_data
        from services.ai_analyzer import analyze_company, save_summary

        await websocket.send_text(json.dumps({
            "status": "fetching",
            "message": f"Fetching GitHub data for {company_name}..."
        }))
        github_signals = fetch_github_data(company_name)
        save_signals(company_name, github_signals)

        await websocket.send_text(json.dumps({
            "status": "fetching",
            "message": "Fetching news..."
        }))
        news_signals = fetch_news_data(company_name)
        save_signals(company_name, news_signals)

        await websocket.send_text(json.dumps({
            "status": "analyzing",
            "message": "Analyzing with AI..."
        }))
        result = analyze_company(company_name)
        save_summary(company_name, result["summary"], result["sentiment"])

        await websocket.send_text(json.dumps({
            "status": "complete",
            "summary": result["summary"],
            "sentiment": result["sentiment"],
            "company": company_name
        }))

    except WebSocketDisconnect:
        # Client closed the tab/connection mid-stream — nothing to send, nothing to log as an error
        print(f"Client disconnected during processing for {company_name}")
        return

    except Exception as e:
        print("WEBSOCKET ERROR:", traceback.format_exc())
        try:
            await websocket.send_text(json.dumps({
                "status": "error",
                "message": str(e)
            }))
        except (WebSocketDisconnect, RuntimeError):
            pass

    finally:
        try:
            await websocket.close()
        except RuntimeError:
            # Already closed — ignore
            pass