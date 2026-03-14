# HR Management System

A modern, role-based HR and attendance management platform built with Next.js, MongoDB, and Tailwind CSS.

## Overview

This project supports two user roles:

- HR Admin
- Employee

Core modules:

- Authentication (Email/Password + Google)
- Employee profile and records management
- Attendance (check-in/check-out, history, reports)
- Leave request and approval flow
- Document upload and verification
- Device-based attendance control
- Excel export support

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- MongoDB + Mongoose
- NextAuth.js
- Tailwind CSS + Radix UI
- Framer Motion

## Project Setup

1. Clone repository
2. Install dependencies
3. Create .env.local with required values
4. Run database seed
5. Start development server

## Environment Variables

Create a .env.local file at project root and configure values such as:

- MONGODB_URI
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- IMGBB_API_KEY

## Available Scripts

- npm run dev → Start local dev server
- npm run build → Build for production
- npm run start → Start production server
- npm run lint → Run lint checks
- npm run seed → Seed database with demo data
- npm run db:clear → Clear database

## Local Run

- Install: npm install
- Reset DB: npm run db:clear
- Seed DB: npm run seed
- Start app: npm run dev
- Open: http://localhost:3000

## Demo Login

- HR: hr@company.com / hr123
- Employee: rahim.ahmed@company.com / emp123

## Key Features

- Role-based route protection
- Attendance analytics and monthly reporting
- Leave lifecycle with HR review and comments
- Employee update history tracking
- Profile image and document management
- Responsive UI for desktop and mobile

## Deployment

Deploy to Vercel or any Node.js hosting provider:

- Set all environment variables
- Ensure MongoDB connection is reachable
- Build and run using npm run build and npm run start

## License

This project is for educational and internal business workflow use.
