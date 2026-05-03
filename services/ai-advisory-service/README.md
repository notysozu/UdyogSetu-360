# AI Advisory Service Extraction Point

The current implementation exposes operational intelligence under `services/ai-service` at `/ai/v1/advisory/*`.

This folder is reserved for a future standalone service if deployment separation becomes necessary. Until then, `services/ai-advisory-service/Dockerfile` delegates to the existing AI service image contract.
