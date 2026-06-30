## Vigil
https://vigil-monitor.com/

## Overview

Vigil is a self-hosted infrastructure monitoring platform that monitors live endpoints, ingests and parses logs,
detects anomalies, tracks incidents, fires alerts, and displays everything on a real-time analytics dashboard.

## Features

* Live endpoint monitoring at 60-second intervals
* Real-time dashboard showing average uptime, average response time, open incidents, and alerts fired
* Alerts page displaying alert status, average response time, and message
* Incident logging and tracking
* Automated alerting with Discord webhook notifications
* Ingests and parses 1.8M NASA HTTP server log records into structured PostgreSQL records, with anomaly detection flagging 404 spikes and suspicious IP activity
* JWT auth with role-based access control

## Architecture

Request flow: Browser -> Caddy (reverse proxy) -> FastAPI  (backend) -> PostgresSQL -> back to React -> Browser
Background loop: Monitoring Agent -> PostgresSQL -> Discord Webhook

## Tech Stack

* Backend — FastAPI, Python, psycopg2
* Frontend — React, Vite, JavaScript, Chart.js
* Database — PostgreSQL
* Infrastructure — Docker Compose, AWS EC2, Caddy
* Auth — JWT, RBAC
* Integrations — Discord Webhooks

## Getting Started (Local)

### Prerequisites
- Docker
- Docker Compose

### Installation
git clone https://github.com/dandrecollins07-ctrl/monitoring-platform
cd monitoring-platform
docker compose up

Visit http://localhost to view the app.

## Deployment 
* Deployed on AWS EC2 (t3.micro)
* Docker Compose runs all services
* Caddy handles HTTPS and reverse proxy
* Live at vigil-monitor.com

## Screenshots
<img width="944" height="473" alt="image" src="https://github.com/user-attachments/assets/d4c32709-5c48-4785-a345-d536560aa27f" />
<img width="945" height="470" alt="image" src="https://github.com/user-attachments/assets/6d021355-b10b-445b-a93e-4516ff1cdac4" />
<img width="735" height="50" alt="image" src="https://github.com/user-attachments/assets/4a5ad1e5-9c09-422d-88e5-d099e050095b" />

## Roadmap 

* Email alerting via SendGrid (second notification channel alongside Discord)
* Add more mobile friendliness
* Add lightmode option
* Status page (public-facing page showing uptime for all monitored services)
* Multi-user support (invite team members)
* Categorize 403s separately from actual downtime
