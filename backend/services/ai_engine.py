import asyncio
import logging
import json
import warnings
# Suppress Google deprecation FutureWarning
warnings.filterwarnings("ignore", category=FutureWarning)
from typing import Dict, Any
from google import genai
from pydantic import BaseModel, Field
from backend.core.config import settings
import os
import uuid
from backend.services.storage import storage_service

logger = logging.getLogger(__name__)

def extract_object_key(video_url_or_key: str) -> str:
    """
    Extracts S3 object key from a full presigned URL, or returns the key if already relative.
    """
    if not video_url_or_key.startswith("http"):
        return video_url_or_key
    try:
        from urllib.parse import urlparse
        path = urlparse(video_url_or_key).path
        parts = path.lstrip("/").split("/")
        if "uploads" in parts:
            idx = parts.index("uploads")
            return "/".join(parts[idx:])
        if len(parts) >= 2:
            return "/".join(parts[-2:])
        return parts[-1]
    except Exception:
        return video_url_or_key


class AIEvaluationSchema(BaseModel):
    communication_score: int = Field(..., description="Communication score (0-100) assessing clarity, expression, vocabulary, confidence.")
    technical_score: int = Field(..., description="Technical score (0-100) assessing correct usage of concepts, logic, accuracy.")
    telemetry_score: int = Field(..., description="Telemetry score (0-100) assessing focus, responsiveness, audio quality, and presence.")
    summary: str = Field(..., description="High-level evaluation summary.")
    strengths: list[str] = Field(..., description="List of positive traits or correct statements.")
    weaknesses: list[str] = Field(..., description="List of gaps in knowledge or communication lapses.")
    transcript: str = Field(..., description="Full text transcription of everything spoken by the candidate.")

class AIEngine:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key and self.api_key != "#reqd key":
            self.client = genai.Client(api_key=self.api_key)

    async def analyze_submission_async(self, video_url: str, job_title: str, job_description: str, questions: list[str] = None) -> Dict[str, Any]:
        """
        Asynchronously processes a candidate's video interview submission.
        Analyzes communication, technical, and telemetry indicators against job description.
        """
        # Simulate video download and preprocessing latency
        await asyncio.sleep(3)

        if not self.api_key or self.api_key == "#reqd key":
            logger.info("Gemini API Key is '#reqd key'. Returning mock structured evaluation.")
            return {
                "status": "Completed",
                "score_communication": 85,
                "score_technical": 78,
                "score_telemetry": 92,
                "ai_feedback": {
                    "summary": "The candidate presented strong technical concepts. They demonstrated structured problem-solving skills, and maintained clear pronunciation. Telemetry indicators showed a stable frame rate, normal sound levels, and steady eye tracking.",
                    "strengths": ["Excellent structure", "Calm pacing", "Correct explanation of concurrency"],
                    "weaknesses": ["Could have detailed database index optimizations more"],
                    "transcript": "Hello! I am excited to apply. Regarding React concurrent mode, it essentially allows React to interrupt long-running renders to handle urgent updates, like user typing. By breaking execution down into chunks and using the scheduler, we avoid page freezes. In my past project, we implemented transition hooks, which improved input latency by 40% across all analytics pages."
                }
            }

        local_files = []
        uploaded_files = []
        try:
            # 1. Download video files from storage
            if video_url:
                urls = [u.strip() for u in video_url.split(",") if u.strip()]
                for idx, url in enumerate(urls):
                    obj_key = extract_object_key(url)
                    local_path = os.path.join(os.getcwd(), f"temp_{uuid.uuid4()}_{idx}.webm")
                    logger.info(f"[GEMINI] Downloading {obj_key} to {local_path}...")
                    success = storage_service.download_object(obj_key, local_path)
                    if success and os.path.exists(local_path):
                        local_files.append(local_path)
                    else:
                        logger.warning(f"[GEMINI] Failed to download {obj_key} from storage.")
            model_name = "gemini-2.5-flash"


            # 2. Upload downloaded media to Gemini File API
            for lf in local_files:
                logger.info(f"[GEMINI] Uploading local file to Gemini: {lf}")
                gf = self.client.files.upload(file=lf)
                uploaded_files.append(gf)

            # 3. Wait for all uploads to become ACTIVE
            for gf in uploaded_files:
                logger.info(f"[GEMINI] Waiting for file {gf.name} to process...")
                import time
                start_wait = time.time()
                state_str = gf.state.name if hasattr(gf.state, "name") else str(gf.state)
                while state_str == "PROCESSING":
                    if time.time() - start_wait > 180:  # 3 minute timeout
                        raise TimeoutError(f"Gemini file processing timed out for {gf.name}")
                    await asyncio.sleep(2)
                    gf = self.client.files.get(name=gf.name)
                    state_str = gf.state.name if hasattr(gf.state, "name") else str(gf.state)
                if state_str == "FAILED":
                    raise Exception(f"Gemini file upload/processing failed: {gf.name}")
                logger.info(f"[GEMINI] File {gf.name} is now ACTIVE")

            # Match up uploaded files to their respective questions
            questions_context = ""
            if questions:
                questions_context = "Here are the specific assessment questions the candidate was asked to answer:\n"
                for idx, q in enumerate(questions):
                    file_info = f"Video {idx + 1}" if idx < len(uploaded_files) else f"Question {idx + 1}"
                    questions_context += f"- {file_info} corresponds to this question: \"{q}\"\n"
                questions_context += "\n"

            prompt = (
                "You are the Skreener AI Evaluation Engine. "
                "Your task is to analyze candidate interview submissions based on video, audio, or transcript URLs.\n\n"
                f"Target Job: {job_title}\n"
                f"Job Description: {job_description}\n\n"
                f"{questions_context}"
                "EVALUATION INSTRUCTIONS:\n"
                "1. For each video file provided, transcribe the candidate's spoken response completely and accurately.\n"
                "2. Evaluate whether the candidate's response is relevant to the specific question asked. Compare the answer against the question context.\n"
                "3. Assess if the candidate's response is coherent, accurate, and relevant in the context of the overall Target Job title and Job Description.\n"
                "4. If any answer is irrelevant, off-topic, generic, or completely fails to address the question prompt, explicitly state this in their 'weaknesses' and heavily penalize their 'technical_score' and 'communication_score'.\n\n"
                "You MUST return your output as a JSON object with these exact keys:\n"
                "{\n"
                '  "communication_score": (int 0-100),\n'
                '  "technical_score": (int 0-100),\n'
                '  "telemetry_score": (int 0-100),\n'
                '  "summary": (string summary of candidate performance),\n'
                '  "strengths": (list of strings),\n'
                '  "weaknesses": (list of strings),\n'
                '  "transcript": (full text transcription of everything spoken by the candidate, separated by question headers e.g. [Question 1 Response] ...)\n'
                "}"
            )

            logger.info(f"[GEMINI] Sending prompt and {len(uploaded_files)} files to {model_name}:")
            logger.info(f"[GEMINI] Prompt length: {len(prompt)} chars")

            # Executing blocking Google AI call in default thread pool executor to prevent event loop block
            loop = asyncio.get_running_loop()
            
            # Pack content list with uploaded files and text prompt
            contents = []
            for gf in uploaded_files:
                contents.append(gf)
            contents.append(prompt)

            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
            )

            text_content = response.text.strip()
            logger.info(f"[GEMINI] Raw response received ({len(text_content)} chars):")
            logger.info(f"[GEMINI] Full Response:\n{text_content}")

            # Clean markdown code fences if generated
            if text_content.startswith("```json"):
                text_content = text_content[7:]
            if text_content.startswith("```"):
                text_content = text_content[3:]
            if text_content.endswith("```"):
                text_content = text_content[:-3]
            text_content = text_content.strip()

            result = json.loads(text_content)
            logger.info(f"[GEMINI] Parsed JSON keys: {list(result.keys())}")
            logger.info(f"[GEMINI] Scores -> Comm: {result.get('communication_score')}, Tech: {result.get('technical_score')}, Telem: {result.get('telemetry_score')}")
            
            return {
                "status": "Completed",
                "score_communication": result.get("communication_score", 0),
                "score_technical": result.get("technical_score", 0),
                "score_telemetry": result.get("telemetry_score", 0),
                "ai_feedback": {
                    "summary": result.get("summary", ""),
                    "strengths": result.get("strengths", []),
                    "weaknesses": result.get("weaknesses", []),
                    "transcript": result.get("transcript", "")
                }
            }
        except Exception as e:
            logger.error(f"[GEMINI] Error during Gemini evaluation: {str(e)}")
            return {
                "status": "Failed",
                "score_communication": 0,
                "score_technical": 0,
                "score_telemetry": 0,
                "ai_feedback": {
                    "summary": f"Failed to complete AI evaluation due to error: {str(e)}",
                    "strengths": [],
                    "weaknesses": [],
                    "transcript": "Evaluation error occurred."
                }
            }
        finally:
            # 4. Clean up Gemini uploaded file resources
            for gf in uploaded_files:
                try:
                    logger.info(f"[GEMINI] Deleting remote file: {gf.name}")
                    self.client.files.delete(name=gf.name)
                except Exception as e:
                    logger.warning(f"[GEMINI] Failed to delete remote file {gf.name}: {str(e)}")

            # 5. Clean up temporary downloaded local files
            for lf in local_files:
                try:
                    if os.path.exists(lf):
                        logger.info(f"[GEMINI] Deleting temporary local file: {lf}")
                        os.remove(lf)
                except Exception as e:
                    logger.warning(f"[GEMINI] Failed to delete temporary local file {lf}: {str(e)}")

ai_engine = AIEngine()
