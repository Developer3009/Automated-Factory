# SmartPlant Factory Automation Platform

SmartPlant is a full-stack factory monitoring and AI-assisted production dashboard inspired by the provided design references. It combines a React frontend, an Express API, PostgreSQL persistence, and a local Ollama AI layer for predictive and operational guidance.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- AI: Ollama (local, free model hosting)
- Digital twin: in-process telemetry simulator for machine status streaming
- Deployment: Docker Compose

## Features

- Overview dashboard with KPI tiles and live production table
- Machine monitoring page and digital twin data feed
- Inventory and production tracking
- AI-generated production recommendations using Ollama
- Deployment-ready Docker configuration

## Local development

1. Copy `.env.example` to `.env`
2. Install root dependencies:
   npm install
3. Start the stack:
   npm run dev
4. Open the frontend at http://localhost:5173
5. The backend API is available at http://localhost:4000

## Docker deployment

1. Copy `.env.example` to `.env`
2. Start the stack:
   docker compose up --build
3. Open the app at http://localhost

## AI setup

Install Ollama locally and pull a model such as `llama3.2`:

ollama pull llama3.2

The API will call the local Ollama engine automatically when it is running.

## Project structure

- `apps/web` — frontend dashboard application
- `apps/server` — Express API and digital twin logic
- `docker-compose.yml` — full deployment setup
- `.env.example` — environment template
