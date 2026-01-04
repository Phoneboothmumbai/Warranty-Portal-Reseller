"""
Company Portal API Tests
Tests for company user registration, login, dashboard, devices, tickets, AMC, and profile endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from requirements
COMPANY_CODE = "ACME001"
COMPANY_USER_EMAIL = "jane@acme.com"
COMPANY_USER_PASSWORD = "company123"
ADMIN_EMAIL = "admin@demo.com"
ADMIN_PASSWORD = "admin123"


class TestCompanyAuth:
    """Company authentication endpoint tests"""
    
    def test_company_login_success(self):
        """Test successful company user login"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == COMPANY_USER_EMAIL
        assert "company_name" in data["user"]
        
    def test_company_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        print(f"Invalid login response: {response.status_code}")
        
        assert response.status_code == 401
        
    def test_company_register_invalid_code(self):
        """Test registration with invalid company code"""
        response = requests.post(f"{BASE_URL}/api/company/auth/register", json={
            "company_code": "INVALID123",
            "name": "Test User",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "password": "testpass123"
        })
        print(f"Invalid code register response: {response.status_code}")
        
        assert response.status_code == 404
        data = response.json()
        assert "Invalid company code" in data.get("detail", "")
        
    def test_company_register_duplicate_email(self):
        """Test registration with existing email"""
        response = requests.post(f"{BASE_URL}/api/company/auth/register", json={
            "company_code": COMPANY_CODE,
            "name": "Test User",
            "email": COMPANY_USER_EMAIL,  # Already exists
            "password": "testpass123"
        })
        print(f"Duplicate email register response: {response.status_code}")
        
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data.get("detail", "").lower()
        
    def test_company_register_success(self):
        """Test successful company user registration"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/company/auth/register", json={
            "company_code": COMPANY_CODE,
            "name": "Test New User",
            "email": unique_email,
            "phone": "1234567890",
            "password": "testpass123"
        })
        print(f"Register response status: {response.status_code}")
        print(f"Register response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "Registration successful" in data["message"]


class TestCompanyAuthMe:
    """Test /company/auth/me endpoint"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_get_current_user_info(self, company_token):
        """Test getting current user info"""
        response = requests.get(f"{BASE_URL}/api/company/auth/me", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Auth/me response: {response.status_code}")
        print(f"Auth/me data: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        assert "company_id" in data
        assert "company_name" in data
        
    def test_get_current_user_unauthorized(self):
        """Test getting user info without token"""
        response = requests.get(f"{BASE_URL}/api/company/auth/me")
        assert response.status_code in [401, 403]


class TestCompanyDashboard:
    """Company dashboard endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_get_dashboard(self, company_token):
        """Test getting company dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/company/dashboard", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Dashboard response: {response.status_code}")
        print(f"Dashboard data: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "total_devices" in data
        assert "warranties_expiring_30_days" in data
        assert "warranties_expiring_60_days" in data
        assert "warranties_expiring_90_days" in data
        assert "active_amc_contracts" in data
        assert "open_service_tickets" in data
        assert "recent_tickets" in data
        
        # Verify data types
        assert isinstance(data["total_devices"], int)
        assert isinstance(data["recent_tickets"], list)
        
    def test_dashboard_unauthorized(self):
        """Test dashboard without authentication"""
        response = requests.get(f"{BASE_URL}/api/company/dashboard")
        assert response.status_code in [401, 403]


class TestCompanyDevices:
    """Company devices endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_list_devices(self, company_token):
        """Test listing company devices"""
        response = requests.get(f"{BASE_URL}/api/company/devices", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Devices list response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # If devices exist, verify structure
        if len(data) > 0:
            device = data[0]
            assert "id" in device
            assert "serial_number" in device
            assert "device_type" in device
            
    def test_list_devices_with_search(self, company_token):
        """Test listing devices with search filter"""
        response = requests.get(f"{BASE_URL}/api/company/devices?search=test", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Devices search response: {response.status_code}")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_list_devices_with_warranty_filter(self, company_token):
        """Test listing devices with warranty status filter"""
        response = requests.get(f"{BASE_URL}/api/company/devices?warranty_status=active", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Devices warranty filter response: {response.status_code}")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestCompanyAMCContracts:
    """Company AMC contracts endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_list_amc_contracts(self, company_token):
        """Test listing company AMC contracts"""
        response = requests.get(f"{BASE_URL}/api/company/amc-contracts", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"AMC contracts response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # If contracts exist, verify structure
        if len(data) > 0:
            contract = data[0]
            assert "id" in contract
            assert "name" in contract
            assert "start_date" in contract
            assert "end_date" in contract


class TestCompanyTickets:
    """Company service tickets endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_list_tickets(self, company_token):
        """Test listing company tickets"""
        response = requests.get(f"{BASE_URL}/api/company/tickets", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Tickets list response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_list_tickets_with_status_filter(self, company_token):
        """Test listing tickets with status filter"""
        response = requests.get(f"{BASE_URL}/api/company/tickets?status=open", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Tickets status filter response: {response.status_code}")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_create_ticket_no_device(self, company_token):
        """Test creating ticket with invalid device"""
        response = requests.post(f"{BASE_URL}/api/company/tickets", 
            headers={"Authorization": f"Bearer {company_token}"},
            json={
                "device_id": "invalid-device-id",
                "issue_category": "hardware",
                "subject": "Test Ticket",
                "description": "Test description"
            }
        )
        print(f"Create ticket invalid device response: {response.status_code}")
        
        # Should fail because device doesn't exist
        assert response.status_code == 404


class TestCompanyDeployments:
    """Company deployments endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_list_deployments(self, company_token):
        """Test listing company deployments"""
        response = requests.get(f"{BASE_URL}/api/company/deployments", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Deployments list response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCompanyUsers:
    """Company users/contacts endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_list_users(self, company_token):
        """Test listing company users/contacts"""
        response = requests.get(f"{BASE_URL}/api/company/users", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Users list response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCompanySites:
    """Company sites endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_list_sites(self, company_token):
        """Test listing company sites"""
        response = requests.get(f"{BASE_URL}/api/company/sites", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Sites list response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCompanyProfile:
    """Company profile endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_get_profile(self, company_token):
        """Test getting user profile"""
        response = requests.get(f"{BASE_URL}/api/company/profile", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Profile response: {response.status_code}")
        print(f"Profile data: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "name" in data
        assert "email" in data
        assert "company_id" in data
        assert "company_name" in data
        
    def test_update_profile(self, company_token):
        """Test updating user profile"""
        response = requests.put(f"{BASE_URL}/api/company/profile", 
            headers={"Authorization": f"Bearer {company_token}"},
            json={"name": "Jane Smith Updated"}
        )
        print(f"Update profile response: {response.status_code}")
        
        assert response.status_code == 200
        
        # Revert the change
        requests.put(f"{BASE_URL}/api/company/profile", 
            headers={"Authorization": f"Bearer {company_token}"},
            json={"name": "Jane Smith"}
        )


class TestCompanyRenewalRequests:
    """Company renewal requests endpoint tests"""
    
    @pytest.fixture
    def company_token(self):
        """Get company user token"""
        response = requests.post(f"{BASE_URL}/api/company/auth/login", json={
            "email": COMPANY_USER_EMAIL,
            "password": COMPANY_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Company login failed")
        
    def test_list_renewal_requests(self, company_token):
        """Test listing renewal requests"""
        response = requests.get(f"{BASE_URL}/api/company/renewal-requests", headers={
            "Authorization": f"Bearer {company_token}"
        })
        print(f"Renewal requests response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
