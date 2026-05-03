# External RabbitMQ Notes

For production, prefer a managed or centrally operated RabbitMQ cluster if available.

Required configuration:
- AMQP URL from secret manager
- management endpoint access controls
- exchange and queue topology
- dead-letter retention
- quorum/classic queue decision
- monitoring for backlog, retries and dead letters

The local `rabbitmq-statefulset.yaml` is a development/pilot placeholder.
