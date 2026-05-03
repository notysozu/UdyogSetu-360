# Document Storage

This folder holds local infrastructure notes for the document subsystem.

- Primary object storage is S3-compatible and defaults to MinIO in development.
- MongoDB stores only document metadata, hashes, permissions, version links, and audit references.
- Local fallback storage writes under `storage/documents` only for sandbox and development flows.
- The default bucket name is `udyogsetu-documents`.
