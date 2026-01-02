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
- Companies → Sites (1:N)
- Sites → Deployments (1:N)
- Companies → AMC Contracts V2 (1:N)
- AMC_Device (join table for device-contract relationships)

## What's Been Implemented

### Phase 1 - MVP Complete (January 2026)
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

### Phase 1.5 - Extended Features
- [x] Master Data Management page
- [x] AMC Contracts V2 (company-level contracts with coverage rules)
- [x] Site & Deployment Module
- [x] Universal Search in admin header
- [x] Deployment Guide for Vultr server

### Phase 2A - Foundation (January 2026) ✅ COMPLETE
- [x] **SmartSelect Component** - Reusable searchable dropdown using Shadcn Combobox
  - Search-as-you-type with debounce (300ms)
  - Async API loading with pagination (`?q=&limit=20`)
  - Keyboard navigation
  - Inline "➕ Add New" option
  - Auto-select after inline creation
- [x] **DateDurationInput Component** - Dual mode input
  - Radio toggle: End Date / Duration
  - Duration mode: Number + Unit selector (Days/Months/Years)
  - Auto-calculate and display end date
  - Always stores start_date + end_date (no duration stored)
- [x] **Quick Create Forms** - Inline master creation
  - QuickCreateCompany
  - QuickCreateUser
  - QuickCreateSite
  - QuickCreateMaster
- [x] **Backend Search Support** - All list APIs now support `?q=&limit=&page=`
  - /api/admin/companies
  - /api/admin/users
  - /api/admin/sites
  - /api/masters/public
- [x] **Quick Create Endpoints** - For inline creation
  - POST /api/admin/companies/quick-create
  - POST /api/admin/users/quick-create
  - POST /api/admin/sites/quick-create
  - POST /api/admin/masters/quick-create
- [x] **Duration Units Master** - Days, Months, Years for warranty calculations
- [x] **Devices Page Updated** - Now uses SmartSelect with inline creation

## Phase 2 Roadmap (In Progress)

### P0 - CRITICAL ARCHITECTURE FIXES ✅ COMPLETE (January 2026)

**Core Data Model Fix - AMC-Device JOIN Relationship:**
- [x] `amc_device_assignments` JOIN table properly integrated across all APIs
- [x] Device List API returns `amc_status`, `amc_contract_name`, `amc_coverage_end`
- [x] Device Detail API JOINs `amc_device_assignments` → `amc_contracts` with full details
- [x] Device list table shows AMC column (Active/None/Expired badges)
- [x] "With AMC" stats card on Devices page

**AMC Serial Number Search:**
- [x] `GET /api/admin/amc-contracts?serial=XXX&asset_tag=YYY`
- [x] JOINs `amc_contracts` → `amc_device_assignments` → `devices`
- [x] Search by serial number, asset tag, company

**Warranty Search AMC Override Rule:**
- [x] IF device has ACTIVE AMC → Show AMC coverage (ignore device warranty)
- [x] ELSE → Show device warranty
- [x] Returns `coverage_source` (amc_contract | legacy_amc | device_warranty)
- [x] Returns full `amc_contract` object with name, type, dates, entitlements
- [x] Warranty result page shows AMC contract details prominently

**Request Support CTA:**
- [x] Button on warranty result page
- [x] Links to `https://support.thegoodmen.in?source=warranty-portal&serial=XXX`

### Phase 2A - Foundation ✅ COMPLETE (January 2026)
- [x] SmartSelect Component - Searchable dropdown with async API search
- [x] DateDurationInput Component - Dual mode (End Date / Duration)
- [x] Quick Create Forms - Inline entity creation
- [x] Backend Search Support - All list APIs support `?q=&limit=&page=`
- [x] Duration Units Master - Days, Months, Years

### Phase 2B - Core Modules ✅ COMPLETE (January 2026)
- [x] Software & License Module - Full CRUD with renewal tracking
- [x] AMC Device Assignment APIs - Single + bulk assignment with preview
- [x] Service Record Enhancement - Parts used, warranty impact, costs

### P1 - ADMIN & USER ROLE MANAGEMENT (Next)
- [ ] Admin Users Module
  - Roles: Super Admin, Admin, Staff, Service Engineer
  - User CRUD with role assignment
  - Enable/disable users, password reset
  - Activity logs
- [ ] Engineer Site Assignment
  - `engineer_site_assignment` table
  - Engineers assigned at Site level
  - Can only see/service assigned sites' devices

### P2 - BULK OPERATIONS & ENGINEER PORTAL
- [ ] Bulk Upload System (Template → Preview → Confirm)
  - Priority: Devices → Users → Companies → Sites → Parts → Licenses → AMC Assignments
- [ ] Engineer Portal
  - Engineer role login
  - View assigned sites/devices
  - Add service records with parts, warranty impact
- [ ] Service Record UI Enhancement

### Phase 3 - Future
- [ ] WhatsApp Integration (QR-based notifications)
- [ ] PDF Export for Service History
- [ ] Advanced admin list customization
- [ ] Customer login portal
- [ ] Advanced role-based permissions
- [ ] SLA timers and ticket automation

## Design Principles (Phase 2+)
1. **Searchable dropdowns everywhere** - Never load full datasets
2. **Inline master creation** - No context switching
3. **Duration OR End Date** - User chooses, system stores dates
4. **Enterprise-grade bulk uploads** - Template → Preview → Import → Summary
5. **Service records create history** - Parts + warranty impact tracking

## Key Components Created (Phase 2A)
- `/app/frontend/src/components/ui/smart-select.jsx`
- `/app/frontend/src/components/ui/date-duration-input.jsx`
- `/app/frontend/src/components/forms/QuickCreateCompany.jsx`
- `/app/frontend/src/components/forms/QuickCreateUser.jsx`
- `/app/frontend/src/components/forms/QuickCreateSite.jsx`
- `/app/frontend/src/components/forms/QuickCreateMaster.jsx`

## Admin Credentials
- Email: admin@demo.com
- Password: admin123
