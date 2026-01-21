from fastapi import FastAPI, UploadFile, File
from nudenet import NudeClassifier
import logging
import os

app = FastAPI(title="NudeNet Moderation Service", version="1.0.0")
classifier = NudeClassifier()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "nudenet-moderation"}

@app.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    """
    Scan image for unsafe content using NudeNet
    
    Returns:
        {
            "unsafe": bool,
            "scores": {
                "unsafe": float (0-1),
                "safe": float (0-1)
            }
        }
    """
    try:
        # Save uploaded file temporarily
        temp_path = f"/tmp/{file.filename}"
        
        # Ensure temp directory exists
        os.makedirs("/tmp", exist_ok=True)
        
        # Write file
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Scanning image: {file.filename}")
        
        # Classify image
        result = classifier.classify(temp_path)
        
        # Extract scores
        image_result = result[temp_path]
        unsafe_score = image_result['unsafe']
        safe_score = image_result['safe']
        
        # Determine if unsafe (threshold 0.6)
        is_unsafe = unsafe_score > 0.6
        
        logger.info(f"Image {file.filename}: unsafe={unsafe_score:.2f}, safe={safe_score:.2f}")
        
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return {
            "unsafe": is_unsafe,
            "scores": {
                "unsafe": float(unsafe_score),
                "safe": float(safe_score)
            }
        }
        
    except Exception as e:
        logger.error(f"Error scanning image: {str(e)}")
        return {"error": str(e), "status": "error"}, 500

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
