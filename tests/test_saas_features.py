"""
SaaS Multi-Tenant Features Test Suite
=====================================
Tests for:
- Subdomain availability check
- Organization signup with subdomain
- Org Dashboard API (/api/org/me)
- Org Settings API (GET/PUT /api/org/settings)
- Admin Plan Management CRUD (/api/admin/plans)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://trackport-2.preview.emergentagent.com')


class TestSubdomainAvailability:
    """Test /api/check-subdomain/{subdomain} endpoint"""
    
    def test_subdomain_available(self):
        """Test that a unique subdomain is available"""
        unique_subdomain = f"testorg{uuid.uuid4().hex[:8]}"
        response = requests.get(f"{BASE_URL}/api/check-subdomain/{unique_subdomain}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["available"] == True
        assert data["subdomain"] == unique_subdomain
    
    def test_subdomain_reserved_admin(self):
        """Test that reserved subdomain 'admin' is not available"""
        response = requests.get(f"{BASE_URL}/api/check-subdomain/admin")
        
        assert response.status_code == 200
        data = response.json()
        assert data["available"] == False
        assert "reserved" in data["reason"].lower()
    
    def test_subdomain_reserved_support(self):
        """Test that reserved subdomain 'support' is not available"""
        response = requests.get(f"{BASE_URL}/api/check-subdomain/support")
        
        assert response.status_code == 200
        data = response.json()
        assert data["available"] == False
        assert "reserved" in data["reason"].lower()
    
    def test_subdomain_too_short(self):
        """Test that subdomain less than 4 chars is rejected"""
        response = requests.get(f"{BASE_URL}/api/check-subdomain/abc")
        
        assert response.status_code == 200
        data = response.json()
        assert data["available"] == False
        assert "4-32 characters" in data["reason"] or "4" in data["reason"]
    
    def test_subdomain_invalid_format(self):
        """Test that subdomain with invalid chars is rejected"""
        response = requests.get(f"{BASE_URL}/api/check-subdomain/test_company!")
        
        assert response.status_code == 200
        data = response.json()
        assert data["available"] == False


class TestOrganizationSignup:
    """Test /api/signup endpoint"""
    
    def test_signup_success(self):
        """Test successful organization signup"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Test Org {unique_id}",
            "subdomain": f"testorg{unique_id}",
            "owner_name": "Test Owner",
            "owner_email": f"owner{unique_id}@test.com",
            "owner_password": "password123",
            "owner_phone": "+91 9876543210",
            "industry": "Technology",
            "company_size": "11-50"
        }
        
        response = requests.post(f"{BASE_URL}/api/signup", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "organization" in data
        assert "user" in data
        assert "access_token" in data
        assert data["organization"]["name"] == payload["organization_name"]
        assert data["user"]["email"] == payload["owner_email"]
        assert data["user"]["role"] == "owner"
    
    def test_signup_duplicate_email(self):
        """Test signup with duplicate email fails"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Test Org {unique_id}",
            "subdomain": f"testorg{unique_id}",
            "owner_name": "Test Owner",
            "owner_email": f"owner{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology"
        }
        
        # First signup
        response1 = requests.post(f"{BASE_URL}/api/signup", json=payload)
        assert response1.status_code == 200
        
        # Second signup with same email but different subdomain
        payload["subdomain"] = f"testorg{uuid.uuid4().hex[:8]}"
        payload["organization_name"] = f"Test Org 2 {unique_id}"
        response2 = requests.post(f"{BASE_URL}/api/signup", json=payload)
        
        assert response2.status_code == 400
        assert "email" in response2.json()["detail"].lower() or "registered" in response2.json()["detail"].lower()
    
    def test_signup_duplicate_subdomain(self):
        """Test signup with duplicate subdomain fails"""
        unique_id = uuid.uuid4().hex[:8]
        subdomain = f"testorg{unique_id}"
        
        payload1 = {
            "organization_name": f"Test Org 1 {unique_id}",
            "subdomain": subdomain,
            "owner_name": "Test Owner 1",
            "owner_email": f"owner1{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology"
        }
        
        # First signup
        response1 = requests.post(f"{BASE_URL}/api/signup", json=payload1)
        assert response1.status_code == 200
        
        # Second signup with same subdomain
        payload2 = {
            "organization_name": f"Test Org 2 {unique_id}",
            "subdomain": subdomain,
            "owner_name": "Test Owner 2",
            "owner_email": f"owner2{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology"
        }
        response2 = requests.post(f"{BASE_URL}/api/signup", json=payload2)
        
        assert response2.status_code == 400
        assert "subdomain" in response2.json()["detail"].lower() or "taken" in response2.json()["detail"].lower()
    
    def test_signup_short_password(self):
        """Test signup with short password fails"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Test Org {unique_id}",
            "subdomain": f"testorg{unique_id}",
            "owner_name": "Test Owner",
            "owner_email": f"owner{unique_id}@test.com",
            "owner_password": "short",  # Less than 8 chars
            "industry": "Technology"
        }
        
        response = requests.post(f"{BASE_URL}/api/signup", json=payload)
        
        assert response.status_code == 400
        assert "password" in response.json()["detail"].lower() or "8" in response.json()["detail"]
    
    def test_signup_reserved_subdomain(self):
        """Test signup with reserved subdomain fails"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Test Org {unique_id}",
            "subdomain": "admin",  # Reserved
            "owner_name": "Test Owner",
            "owner_email": f"owner{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology"
        }
        
        response = requests.post(f"{BASE_URL}/api/signup", json=payload)
        
        assert response.status_code == 400
        assert "reserved" in response.json()["detail"].lower()


class TestOrgLogin:
    """Test /api/org/login endpoint"""
    
    @pytest.fixture
    def test_org(self):
        """Create a test organization for login tests"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Login Test Org {unique_id}",
            "subdomain": f"logintest{unique_id}",
            "owner_name": "Login Test Owner",
            "owner_email": f"logintest{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology"
        }
        
        response = requests.post(f"{BASE_URL}/api/signup", json=payload)
        assert response.status_code == 200
        return {
            "email": payload["owner_email"],
            "password": payload["owner_password"],
            "token": response.json()["access_token"]
        }
    
    def test_org_login_success(self, test_org):
        """Test successful org user login"""
        response = requests.post(f"{BASE_URL}/api/org/login", json={
            "email": test_org["email"],
            "password": test_org["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert "organization" in data
        assert data["user"]["email"] == test_org["email"]
        assert data["user"]["role"] == "owner"
    
    def test_org_login_wrong_password(self, test_org):
        """Test login with wrong password fails"""
        response = requests.post(f"{BASE_URL}/api/org/login", json={
            "email": test_org["email"],
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
    
    def test_org_login_nonexistent_email(self):
        """Test login with non-existent email fails"""
        response = requests.post(f"{BASE_URL}/api/org/login", json={
            "email": "nonexistent@test.com",
            "password": "password123"
        })
        
        assert response.status_code == 401


class TestOrgDashboard:
    """Test /api/org/me endpoint"""
    
    @pytest.fixture
    def authenticated_org(self):
        """Create and authenticate a test organization"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Dashboard Test Org {unique_id}",
            "subdomain": f"dashtest{unique_id}",
            "owner_name": "Dashboard Test Owner",
            "owner_email": f"dashtest{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology",
            "company_size": "11-50"
        }
        
        response = requests.post(f"{BASE_URL}/api/signup", json=payload)
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["access_token"],
            "org": data["organization"],
            "user": data["user"]
        }
    
    def test_org_me_success(self, authenticated_org):
        """Test getting org dashboard data"""
        headers = {"Authorization": f"Bearer {authenticated_org['token']}"}
        response = requests.get(f"{BASE_URL}/api/org/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify user data
        assert "user" in data
        assert data["user"]["email"] == authenticated_org["user"]["email"]
        assert data["user"]["role"] == "owner"
        
        # Verify organization data
        assert "organization" in data
        assert data["organization"]["id"] == authenticated_org["org"]["id"]
        assert data["organization"]["plan_id"] == "plan_free"
        assert data["organization"]["subscription_status"] == "trialing"
        
        # Verify plan data
        assert "plan" in data
        assert "features" in data["plan"]
        
        # Verify usage data
        assert "usage" in data
    
    def test_org_me_unauthorized(self):
        """Test org/me without token fails"""
        response = requests.get(f"{BASE_URL}/api/org/me")
        assert response.status_code == 401
    
    def test_org_me_invalid_token(self):
        """Test org/me with invalid token fails"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/api/org/me", headers=headers)
        assert response.status_code == 401


class TestOrgSettings:
    """Test /api/org/settings GET and PUT endpoints"""
    
    @pytest.fixture
    def authenticated_org(self):
        """Create and authenticate a test organization"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Settings Test Org {unique_id}",
            "subdomain": f"settest{unique_id}",
            "owner_name": "Settings Test Owner",
            "owner_email": f"settest{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology"
        }
        
        response = requests.post(f"{BASE_URL}/api/signup", json=payload)
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["access_token"],
            "org": data["organization"]
        }
    
    def test_get_settings(self, authenticated_org):
        """Test getting org settings"""
        headers = {"Authorization": f"Bearer {authenticated_org['token']}"}
        response = requests.get(f"{BASE_URL}/api/org/settings", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify settings structure
        assert "ticketing_url" in data
        assert "ticketing_api_key" in data
        assert "ticketing_enabled" in data
        
        # Default values should be empty/false
        assert data["ticketing_url"] == ""
        assert data["ticketing_api_key"] == ""
        assert data["ticketing_enabled"] == False
    
    def test_update_settings_free_plan_blocked(self, authenticated_org):
        """Test that free plan cannot enable ticketing integration"""
        headers = {"Authorization": f"Bearer {authenticated_org['token']}"}
        
        # Try to enable ticketing on free plan
        payload = {
            "ticketing_url": "https://support.example.com/api",
            "ticketing_api_key": "test-api-key",
            "ticketing_enabled": True
        }
        
        response = requests.put(f"{BASE_URL}/api/org/settings", json=payload, headers=headers)
        
        # Should be blocked because free plan doesn't have osticket_integration
        assert response.status_code == 403
        assert "pro" in response.json()["detail"].lower() or "upgrade" in response.json()["detail"].lower()
    
    def test_update_settings_save_without_enable(self, authenticated_org):
        """Test saving settings without enabling (should work on free plan)"""
        headers = {"Authorization": f"Bearer {authenticated_org['token']}"}
        
        # Save settings without enabling
        payload = {
            "ticketing_url": "https://support.example.com/api",
            "ticketing_api_key": "test-api-key",
            "ticketing_enabled": False  # Not enabling
        }
        
        response = requests.put(f"{BASE_URL}/api/org/settings", json=payload, headers=headers)
        
        assert response.status_code == 200
        
        # Verify settings were saved
        get_response = requests.get(f"{BASE_URL}/api/org/settings", headers=headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["ticketing_url"] == payload["ticketing_url"]
        assert data["ticketing_api_key"] == payload["ticketing_api_key"]
        assert data["ticketing_enabled"] == False
    
    def test_settings_unauthorized(self):
        """Test settings without token fails"""
        response = requests.get(f"{BASE_URL}/api/org/settings")
        assert response.status_code == 401


class TestAdminPlanManagement:
    """Test /api/admin/plans CRUD endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_all_plans(self, admin_token):
        """Test getting all plans as admin"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/plans", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) >= 3  # At least free, pro, enterprise
        
        # Verify plan structure
        for plan in data["plans"]:
            assert "id" in plan
            assert "name" in plan
            assert "display_name" in plan
            assert "features" in plan
            assert "price_monthly" in plan
    
    def test_create_plan(self, admin_token):
        """Test creating a new plan"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = uuid.uuid4().hex[:8]
        
        payload = {
            "id": f"plan_test_{unique_id}",
            "name": f"test_{unique_id}",
            "display_name": f"Test Plan {unique_id}",
            "description": "A test plan for testing",
            "price_monthly": 49900,  # ₹499
            "price_yearly": 499900,  # ₹4,999
            "is_active": True,
            "is_popular": False,
            "sort_order": 10,
            "features": {
                "max_devices": 50,
                "max_users": 5,
                "max_companies": 2,
                "ai_support_bot": True,
                "qr_codes": True,
                "api_access": False,
                "custom_branding": False,
                "priority_support": False,
                "osticket_integration": True,
                "engineer_portal": False
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/plans", json=payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["id"] == payload["id"]
        
        # Verify plan was created by fetching it
        get_response = requests.get(f"{BASE_URL}/api/admin/plans", headers=headers)
        plans = get_response.json()["plans"]
        created_plan = next((p for p in plans if p["id"] == payload["id"]), None)
        assert created_plan is not None
        assert created_plan["display_name"] == payload["display_name"]
        assert created_plan["features"]["max_devices"] == 50
    
    def test_update_plan(self, admin_token):
        """Test updating an existing plan"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a plan
        unique_id = uuid.uuid4().hex[:8]
        create_payload = {
            "id": f"plan_update_{unique_id}",
            "name": f"update_{unique_id}",
            "display_name": f"Update Test {unique_id}",
            "description": "Original description",
            "price_monthly": 29900,
            "price_yearly": 299900,
            "is_active": True,
            "sort_order": 11,
            "features": {
                "max_devices": 25,
                "max_users": 3,
                "max_companies": 1,
                "ai_support_bot": False,
                "qr_codes": True
            }
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/plans", json=create_payload, headers=headers)
        assert create_response.status_code == 200
        
        # Update the plan
        update_payload = {
            **create_payload,
            "display_name": f"Updated Plan {unique_id}",
            "description": "Updated description",
            "price_monthly": 39900,
            "features": {
                **create_payload["features"],
                "max_devices": 30,
                "ai_support_bot": True
            }
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/admin/plans/{create_payload['id']}", 
            json=update_payload, 
            headers=headers
        )
        
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/admin/plans", headers=headers)
        plans = get_response.json()["plans"]
        updated_plan = next((p for p in plans if p["id"] == create_payload["id"]), None)
        assert updated_plan is not None
        assert updated_plan["display_name"] == update_payload["display_name"]
        assert updated_plan["price_monthly"] == 39900
        assert updated_plan["features"]["max_devices"] == 30
        assert updated_plan["features"]["ai_support_bot"] == True
    
    def test_toggle_plan_status(self, admin_token):
        """Test toggling plan active status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a plan
        unique_id = uuid.uuid4().hex[:8]
        create_payload = {
            "id": f"plan_toggle_{unique_id}",
            "name": f"toggle_{unique_id}",
            "display_name": f"Toggle Test {unique_id}",
            "description": "Test plan for toggle",
            "price_monthly": 19900,
            "is_active": True,
            "sort_order": 12,
            "features": {
                "max_devices": 15,
                "max_users": 2,
                "max_companies": 1
            }
        }
        
        create_response = requests.post(f"{BASE_URL}/api/admin/plans", json=create_payload, headers=headers)
        assert create_response.status_code == 200
        
        # Toggle to inactive
        toggle_response = requests.patch(
            f"{BASE_URL}/api/admin/plans/{create_payload['id']}/toggle",
            headers=headers
        )
        
        assert toggle_response.status_code == 200
        data = toggle_response.json()
        assert data["is_active"] == False
        
        # Toggle back to active
        toggle_response2 = requests.patch(
            f"{BASE_URL}/api/admin/plans/{create_payload['id']}/toggle",
            headers=headers
        )
        
        assert toggle_response2.status_code == 200
        data2 = toggle_response2.json()
        assert data2["is_active"] == True
    
    def test_create_duplicate_plan_fails(self, admin_token):
        """Test creating plan with duplicate ID fails"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to create a plan with existing ID
        payload = {
            "id": "plan_free",  # Already exists
            "name": "duplicate",
            "display_name": "Duplicate Plan",
            "description": "Should fail",
            "price_monthly": 0,
            "features": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/plans", json=payload, headers=headers)
        
        assert response.status_code == 400
        assert "exists" in response.json()["detail"].lower()
    
    def test_update_nonexistent_plan_fails(self, admin_token):
        """Test updating non-existent plan fails"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        payload = {
            "id": "plan_nonexistent",
            "name": "nonexistent",
            "display_name": "Non-existent Plan",
            "description": "Should fail",
            "price_monthly": 0,
            "features": {}
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/plans/plan_nonexistent", json=payload, headers=headers)
        
        assert response.status_code == 404
    
    def test_plans_unauthorized(self):
        """Test admin plans without token fails"""
        response = requests.get(f"{BASE_URL}/api/admin/plans")
        # Should return 401 or 403 (both are acceptable for unauthorized access)
        assert response.status_code in [401, 403]


class TestPublicPlans:
    """Test public /api/plans endpoint"""
    
    def test_get_public_plans(self):
        """Test getting public pricing plans (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/plans")
        
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) > 0  # Should have at least some plans
        
        # Verify plan structure
        for plan in data["plans"]:
            assert "id" in plan
            assert "display_name" in plan or "name" in plan
            assert "features" in plan
            assert "price_monthly" in plan


class TestTicketingConnectionTest:
    """Test /api/org/settings/test-ticketing endpoint"""
    
    @pytest.fixture
    def authenticated_org(self):
        """Create and authenticate a test organization"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "organization_name": f"Ticketing Test Org {unique_id}",
            "subdomain": f"ticktest{unique_id}",
            "owner_name": "Ticketing Test Owner",
            "owner_email": f"ticktest{unique_id}@test.com",
            "owner_password": "password123",
            "industry": "Technology"
        }
        
        response = requests.post(f"{BASE_URL}/api/signup", json=payload)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_ticketing_connection_test(self, authenticated_org):
        """Test ticketing connection test endpoint"""
        headers = {"Authorization": f"Bearer {authenticated_org}"}
        
        # Test with a valid URL format (will fail connection but endpoint should work)
        payload = {
            "url": "https://httpbin.org/get",
            "api_key": "test-api-key"
        }
        
        response = requests.post(f"{BASE_URL}/api/org/settings/test-ticketing", json=payload, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data
    
    def test_ticketing_connection_test_unauthorized(self):
        """Test ticketing connection test without auth fails"""
        payload = {
            "url": "https://example.com/api",
            "api_key": "test-api-key"
        }
        
        response = requests.post(f"{BASE_URL}/api/org/settings/test-ticketing", json=payload)
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
