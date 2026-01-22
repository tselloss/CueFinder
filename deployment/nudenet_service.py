import io
import logging
import os
from typing import Tuple

import numpy as np
import opennsfw2 as n2
from fastapi import FastAPI, File, UploadFile
from PIL import Image

app = FastAPI(title="NSFW Moderation Service", version="2.0.0")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_model() -> "n2.tf.keras.Model":
    """Instantiate the OpenNSFW2 model and ensure weights are present."""
    try:
        model = n2.make_open_nsfw_model()
        logger.info("OpenNSFW2 model ready")
        return model
    except Exception as exc:
        logger.exception("Failed to load OpenNSFW2 model")
        raise RuntimeError(f"Failed to load OpenNSFW2 model: {exc}") from exc


model = load_model()


def predict_scores(image_bytes: bytes) -> Tuple[float, float]:
    """Return (safe_score, nsfw_score) for an image payload."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        preprocessed = n2.preprocess_image(img, n2.Preprocessing.YAHOO)

    inputs = np.expand_dims(preprocessed, axis=0)
    predictions = model.predict(inputs, verbose=0)

    sfw_probability, nsfw_probability = predictions[0]
    return float(sfw_probability), float(nsfw_probability)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "opennsfw2-moderation"}


@app.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    """
    Scan image for unsafe content using OpenNSFW2.

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
        content = await file.read()
        logger.info("Scanning image: %s", file.filename)

        safe_score, nsfw_score = predict_scores(content)
        # Lowered threshold to catch borderline explicit content
        is_unsafe = nsfw_score > 0.5

        logger.info(
            "Image %s: unsafe=%.2f, safe=%.2f",
            file.filename,
            nsfw_score,
            safe_score,
        )

        return {
            "unsafe": is_unsafe,
            "scores": {
                "unsafe": nsfw_score,
                "safe": safe_score,
            },
        }

    except Exception as exc:
        logger.exception("Error scanning image")
        return {"error": str(exc), "status": "error"}, 500


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
