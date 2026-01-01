# Warranty & Asset Tracking Portal - PRD

## Original Problem Statement
Build a web-based warranty lookup portal for customers where they can enter a Device Serial Number or Asset Tag and instantly view warranty status of:
- The main device (laptop, CCTV, printer, etc.)
- Any replaced or repaired parts
- AMC or service coverage (if applicable)

Support multiple parts with different warranty periods for the same device.

## User Personas
1. **End Customer** - Checks warranty status via public portal (no login required)
2. **IT Admin** - Manages companies, users, devices, parts, AMC, and portal branding

## Core Requirements
- JWT-based admin authentication
- Clean, light, trust-focused design
- PDF export for warranty reports
- Configurable branding (logo + accent color)
- Public customer portal (search by serial/asset tag only)

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT tokens (8-hour expiry)
- **PDF**: ReportLab for server-side generation

## Data Model
- Companies → Users (1:N)
- Companies → Devices (1:N)
- Devices → Parts (1:N)
- Devices → AMC (1:1)
- Users ↔ Devices (N:N via assigned_user_id)

## What's Been Implemented (January 2026)
- [x] Public landing page with warranty search ("The Monolith" layout)
- [x] Warranty result page with device/parts/AMC status ("The Receipt" layout)
- [x] PDF warranty report download
- [x] Admin authentication (setup + login)
- [x] Admin dashboard with stats
- [x] Companies CRUD
- [x] Users CRUD (per company)
- [x] Devices CRUD (with warranty dates, assign to company/user)
- [x] Parts CRUD (with auto-calculated warranty expiry)
- [x] AMC CRUD (per device)
- [x] Settings (portal name + accent color + logo upload)
- [x] Responsive design
- [x] All data-testid attributes for testing

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- None - MVP complete

### P1 (High Priority)
- Warranty expiry email/SMS reminders
- Bulk device import (CSV)
- QR code generation for devices

### P2 (Medium Priority)
- Customer login portal (view own assigned devices)
- AMC renewal workflow with Razorpay/Stripe
- Service history/ticket logging
- White-label multi-tenancy

### P3 (Nice to Have)
- WhatsApp integration for warranty queries
- Mobile app (React Native)
- API access for external systems
- Audit logs for admin actions

## Next Tasks
1. Deploy to production
2. Configure custom domain
3. Upload real company logo
4. Import existing device data
