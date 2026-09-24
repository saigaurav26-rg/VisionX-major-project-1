"""
Vision Assistant Service.

Uses Gemini Vision-Language Model (VLM) to provide natural, 
human-friendly visual reasoning for user questions.
"""

import os
from PIL import Image
from google import genai
from google.genai import types

# Load API key from environment
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

# Active Flash model name as requested by Google API
MODEL_NAME = "gemini-3.6-flash"

SYSTEM_INSTRUCTION = """
You are VisionX, an expert Vision-Language Assistant.
You will be provided with two images: 
1. The Original Image (with distortion like rain/noise).
2. The Restored Image (processed result).

Your goal:
- Answer the user's question about the image in plain, natural, friendly human language.
- Explain visual details, clarity improvements, and objects accurately.
- DO NOT output raw mathematical/statistical metrics (e.g., edge density, mean absolute difference, frequency numbers) unless the user specifically asks for scientific numbers.
- Keep responses concise, helpful, and conversational.
"""


def summarize(original: Image.Image, derained: Image.Image) -> str:
    """Generate a natural VLM summary comparing original and restored images."""
    if not client:
        return "Gemini API key missing. Please configure GEMINI_API_KEY in backend/.env file."

    prompt = "Describe the visual improvements in the restored image compared to the original image in 2 simple sentences."

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                "Original Image:", original,
                "Restored Image:", derained,
                prompt
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.3
            )
        )
        return response.text.strip()
    except Exception as e:
        return f"Error generating summary: {str(e)}"


def answer_question(question: str, original: Image.Image, derained: Image.Image) -> str:
    """Answer user questions using real VLM reasoning on image pairs."""
    if not client:
        return "Gemini API key missing. Please set GEMINI_API_KEY in backend/.env file."

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                "Original Image:", original,
                "Restored Image:", derained,
                f"User Question: {question}"
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.4
            )
        )
        return response.text.strip()
    except Exception as e:
        return f"An error occurred while analyzing the image: {str(e)}"