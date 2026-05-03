# Adapter Runtime Notes

The adapter runtime hosts the plug-and-play department adapter framework for UdyogSetu 360. Department-specific integration logic stays here so CAF, orchestration, Kafka, and RabbitMQ consumers can rely on a single normalised adapter service boundary.

Current development defaults:
- static mock adapter configs are available when Mongo-backed adapter config documents are unavailable
- RabbitMQ workers call the adapter runtime service instead of directly invoking adapter classes
- no raw credentials are stored in config documents; only references are expected
