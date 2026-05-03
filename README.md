# PrivaResume AI - Vercel Deployment Guide

This project is a privacy-first, AI-powered resume analyzer built with React, Vite, and Gemini.

## Deployment Steps

To deploy this application to Vercel:

1. **Push to GitHub**: Upload this codebase to a GitHub repository.
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com) and click **"Add New" -> "Project"**.
   - Import your GitHub repository.
3. **Configure Framework**: Vercel should automatically detect **Vite**.
4. **Add Environment Variables**:
   - Add `GEMINI_API_KEY` to the **Environment Variables** section.
   - You can get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
5. **Deploy**: Click **"Deploy"**.

## Privacy Features
The application processes all resume text locally in the browser's memory. No resume data is stored on any server or database.

## Technologies Used
- **React 19 & Vite**
- **Google Gemini API** (via `@google/genai`)
- **pdfjs-dist** (for client-side PDF parsing)
- **Tailwind CSS**
- **Framer Motion** (for animations)
