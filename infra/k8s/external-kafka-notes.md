# External Kafka Notes

For production, prefer a managed or centrally operated Kafka cluster if available.

Required configuration:
- broker list
- TLS/SASL settings
- topic creation policy
- retention policy
- consumer group naming
- monitoring and lag alerts

The local `kafka-statefulset.yaml` is a development/pilot placeholder.
