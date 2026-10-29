"""
BrandGuard AI - Fine-Tuned LoRA Specialist Inference Module
Base Model: Qwen/Qwen3-4B-Instruct-2507
Adapter: aliasLLM/brandguard-ai-model (PEFT LoRA)
Quantization: 4-bit (bitsandbytes)
Contract: JSON_Schema_v1.1
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import PeftModel
    TRANSFORMERS_AVAILABLE = True
except Exception as _e:
    TRANSFORMERS_AVAILABLE = False


SYSTEM_PROMPT = "You are a Brand Governance AI. Review the draft against Rules and SER. Return ONLY valid JSON matching BrandGuardReview_v1.1 schema."


class BrandGuardInferenceEngine:
    def __init__(
        self,
        base_model_id: str = "Qwen/Qwen3-4B-Instruct-2507",
        adapter_id: str = "aliasLLM/brandguard-ai-model",
        hf_token: Optional[str] = None,
        device_map: str = "auto",
        load_in_4bit: bool = True,
    ):
        self.base_model_id = base_model_id
        self.adapter_id = adapter_id
        self.hf_token = hf_token or os.getenv("HF_TOKEN")
        self.model = None
        self.tokenizer = None

        if not TRANSFORMERS_AVAILABLE:
            print("[BrandGuard AI] transformers or peft not installed. Engine running in mock/dry-run mode.")
            return

        print(f"[BrandGuard AI] Initializing base model: {base_model_id}...")
        bnb_config = None
        if load_in_4bit and torch.cuda.is_available():
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
            )

        self.tokenizer = AutoTokenizer.from_pretrained(
            base_model_id,
            token=self.hf_token,
            trust_remote_code=True,
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            base_model_id,
            quantization_config=bnb_config,
            device_map=device_map,
            token=self.hf_token,
            trust_remote_code=True,
            torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
        )

        print(f"[BrandGuard AI] Attaching fine-tuned LoRA adapter: {adapter_id}...")
        self.model = PeftModel.from_pretrained(
            self.model,
            adapter_id,
            token=self.hf_token,
        )
        self.model.eval()
        print("[BrandGuard AI] Specialist model loaded and ready.")

    def build_chatml_prompt(self, brand_id: str, rules: Any, ser: Any, draft_text: str) -> str:
        rules_json = json.dumps(rules) if not isinstance(rules, str) else rules
        ser_json = json.dumps(ser) if not isinstance(ser, str) else ser
        user_message = f"Brand: {brand_id} Rules: {rules_json} SER: {ser_json} Draft: {draft_text}"

        prompt = (
            f"<|im_start|>system\n{SYSTEM_PROMPT}<|im_end|>\n"
            f"<|im_start|>user\n{user_message}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )
        return prompt

    def generate_review(
        self,
        brand_id: str,
        rules: Any,
        ser: Any,
        draft_text: str,
        max_new_tokens: int = 2048,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        prompt = self.build_chatml_prompt(brand_id, rules, ser, draft_text)

        if not self.model or not self.tokenizer:
            # Fallback mock for local development/testing without GPU
            return self._mock_review(brand_id, draft_text)

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=False,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        # Slice off input tokens to get generated assistant text
        generated_tokens = outputs[0][inputs.input_ids.shape[1]:]
        raw_output = self.tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

        # Extract JSON from response
        try:
            start_idx = raw_output.find("{")
            end_idx = raw_output.rfind("}") + 1
            if start_idx != -1 and end_idx != 0:
                parsed = json.loads(raw_output[start_idx:end_idx])
                return parsed
        except Exception as e:
            pass

        return {
            "review_id": str(uuid.uuid4()),
            "brand_id": brand_id,
            "status": "Incomplete",
            "human_review_required": True,
            "incomplete_reasons": ["Structural failure: Invalid JSON format"],
            "findings": [],
            "model_version": "brandguard-ai-model-qwen3-4b",
            "rulebook_version": "v1.1",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def _mock_review(self, brand_id: str, draft_text: str) -> Dict[str, Any]:
        """Deterministic mock review adhering to BrandGuardAIReview_v1.1 schema."""
        findings = []
        lower = draft_text.lower()
        if "cheap" in lower:
            findings.append({
                "finding_id": 1,
                "issue_category": "Tone",
                "severity": "Medium",
                "affected_text": "cheap",
                "rule_reference": f"{brand_id}_R1",
                "evidence_references": ["SER_VERDANT_ORGANIC"],
                "claim_status": "Supported",
                "explanation": "Off-brand tone: use 'affordable' or 'accessible' rather than 'cheap'.",
                "corrected_text": "accessible",
                "human_review_required": False,
            })

        return {
            "review_id": str(uuid.uuid4()),
            "brand_id": brand_id,
            "status": "Complete" if len(findings) == 0 else "Complete",
            "human_review_required": len(findings) > 0,
            "incomplete_reasons": [],
            "findings": findings,
            "model_version": "brandguard-ai-model-qwen3-4b-mock",
            "rulebook_version": "v1.1",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


def run_http_server(host: str = "127.0.0.1", port: int = 8000):
    from http.server import HTTPServer, BaseHTTPRequestHandler

    print(f"[BrandGuard AI] Initializing Qwen3-4B LoRA inference server on http://{host}:{port}...")
    engine = BrandGuardInferenceEngine()

    class ReviewHandler(BaseHTTPRequestHandler):
        def do_POST(self):
            if self.path != "/review":
                self.send_response(404)
                self.end_headers()
                return

            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")

            try:
                data = json.loads(body)
                brand_id = data.get("brand_id", "Unknown")
                rules = data.get("rules", [])
                ser = data.get("ser", {})
                draft_text = data.get("draft_text", "")

                review = engine.generate_review(brand_id, rules, ser, draft_text)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(review).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        def do_GET(self):
            if self.path == "/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "ok",
                    "model": "Qwen/Qwen3-4B-Instruct-2507",
                    "adapter": "aliasLLM/brandguard-ai-model",
                    "quantization": "4-bit (bitsandbytes)"
                }).encode("utf-8"))
            else:
                self.send_response(404)
                self.end_headers()

    server = HTTPServer((host, port), ReviewHandler)
    print(f"[BrandGuard AI] Inference server listening at http://{host}:{port}/review")
    print(f"[BrandGuard AI] Health check at http://{host}:{port}/health")
    server.serve_forever()


if __name__ == "__main__":
    import sys
    if "--serve" in sys.argv:
        port = 8000
        for i, arg in enumerate(sys.argv):
            if arg == "--port" and i + 1 < len(sys.argv):
                port = int(sys.argv[i + 1])
        run_http_server(port=port)
    else:
        print("BrandGuard AI Qwen3-4B LoRA Module.")
        print("To start inference server: python scripts/brandguard_lora_inference.py --serve --port 8000")

