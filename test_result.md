# Test Results - Phase 2B Core Modules

## Testing Scope
Testing Phase 2B implementations:
1. Software & License Module - New entity with CRUD and renewal tracking
2. Service Record Enhancement - Enhanced model with parts tracking
3. AMC_Device Join Table - Device assignment to AMC contracts
4. Request Support CTA - Button on warranty result page

## Test Scenarios

### 1. Licenses Page
- [ ] Navigate to Licenses page
- [ ] Stats cards show correctly (Total, Perpetual, Active, Expiring, Expired)
- [ ] Click Add License
- [ ] SmartSelect for Company works
- [ ] DateDurationInput for License End works
- [ ] Create a subscription license
- [ ] Create a perpetual license
- [ ] Edit license
- [ ] View license details
- [ ] Expiring summary shows alerts

### 2. AMC Device Assignment APIs
- [ ] GET /api/admin/amc-contracts/{id}/devices
- [ ] POST /api/admin/amc-contracts/{id}/assign-device
- [ ] POST /api/admin/amc-contracts/{id}/bulk-assign/preview
- [ ] POST /api/admin/amc-contracts/{id}/bulk-assign/confirm

### 3. Warranty Result - Request Support
- [ ] Button appears on warranty result page
- [ ] Links to correct support URL with params

## Credentials
- Admin Email: admin@demo.com
- Admin Password: admin123
