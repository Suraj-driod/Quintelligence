# Quintelligence

**Quintelligence** is an AI-powered adaptive onboarding engine that creates personalized learning pathways based on a user's resume, target job description, GitHub profile, and learning preferences. Instead of a fixed one-size-fits-all onboarding flow, the platform identifies skill gaps and generates a customized roadmap to help users reach role-specific competency faster.

## Live Demo

Deployed application: `https://quintelligence.vercel.app/`

## GitHub Repository

Source code: `https://github.com/Suraj-driod/Quintelligence`

---

## Features

- Resume PDF upload and parsing
- Job description analysis
- GitHub project and language analysis
- Skill-gap detection
- Adaptive pathway generation
- Personalized learning material recommendations
- Interactive pathway visualization
- User feedback-based pathway adjustment

---

## Tech Stack

- Next.js
- Tailwind CSS
- Firebase
- Gemini 2.5 Flash
- PDF Parser

---

## Prerequisites

Before running the project, make sure you have the following installed:

- Node.js
- npm
- Docker Desktop

---

## Environment Variables

Create a `.env` file in the root directory and add the following values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_key_here
```

---

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Suraj-driod/Quintelligence.git
cd Quintelligence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open in browser

Visit:

```text
http://localhost:3000
```

---

## 🐳 Run with Docker (Recommended)

The easiest way to run the platform is using Docker Compose. This ensures all environment variables and build arguments are handled automatically.

### 1. Build and Start
Ensure you have a `.env` file in the root with your API keys. Then run:

```bash
docker-compose up --build
```

### 2. Access the Application
Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Manual Docker Build (Optional)

If you prefer to build the image manually, you must pass the Firebase public keys as build arguments:

```bash
docker build \
  -t quintelligence \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=your_key \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=your_id \
  --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_id \
  .
```

### Run the Image
```bash
docker run -p 3000:3000 --env-file .env quintelligence
```

---

## 💡 Docker Architecture Notes

- **Standalone Mode**: The project uses Next.js `standalone` output, which optimizes the image size by including only the necessary files to run the production server.
- **Build Args**: `NEXT_PUBLIC_*` variables are required at build time to be baked into the client-side bundles.
- **Runtime Env**: `GEMINI_API_KEY` and other secret keys are kept out of the image and passed at runtime via the environment for security.


---

## Submission Notes

This repository includes:

- Source code
- Dockerfile for reproducible setup
- Environment variable template
- Local and Docker-based setup instructions



## License

This project was built for hackathon submission and educational purposes.

<div align="center">
  <i>Built At ArtPark CodeForge Hackathon 2026</i>
</div>
