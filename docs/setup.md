# Local Setup

1. Copy `.env.example` to `.env`.
2. Run `npm install` from the repository root.
3. Start MongoDB locally or run `npm run docker:up`.
4. Start the legacy-compatible public app with `npm run dev:public`.
5. Start supporting services as needed with `npm run dev:gateway`, `npm run dev:case`, and friends.
