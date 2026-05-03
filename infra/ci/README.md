# CI/CD

GitHub Actions workflows live in `.github/workflows/`.

Pipeline stages:
1. checkout
2. setup Node
3. install Node dependencies
4. lint Node
5. test Node
6. setup Python
7. install Python dependencies
8. lint Python placeholder
9. test Python
10. validate n8n workflow JSON placeholder
11. validate OpenAPI placeholder
12. run contract tests
13. run security checks
14. build Docker images
15. run smoke tests
16. upload artefacts placeholder
