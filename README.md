<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/da8abd57-1f48-4b01-b0e9-a6a162e18b4f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy env values and configure `.env` (or `.env.local`), including `DATABASE_URL`.
3. Initialize SQLite schema:
   `npm run db:init`
4. Generate Prisma client:
   `npm run prisma:generate`
5. Run the app:
   `npm run dev`
