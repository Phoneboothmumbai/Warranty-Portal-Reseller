"""
Test Public Org Warranty API Endpoints
======================================
Tests for the public warranty check page on tenant subdomains.
- GET /api/public/org/{slug} - Get public org info
- GET /api/public/org/{slug}/warranty?q=serial_number - Search warranty
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://trackport-2.preview.emergentagent.com')

# Test data from main agent
TEST_ORG_SLUG = "demoit"
TEST_DEVICE_SERIAL = "DEMO123456"
TEST_DEVICE_ASSET_TAG = "ASSET-001"


class TestPublicOrgInfo:
    """Tests for GET /api/public/org/{slug} endpoint"""
    
    def test_get_org_info_success(self):
        """Test getting public org info for existing org"""
        response = requests.get(f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "name" in data
        assert "slug" in data
        assert data["slug"] == TEST_ORG_SLUG
        assert data["name"] == "Demo IT Solutions"
        print(f"✓ Org info retrieved: {data['name']} (slug: {data['slug']})")
    
    def test_get_org_info_not_found(self):
        """Test 404 for non-existent org"""
        response = requests.get(f"{BASE_URL}/api/public/org/nonexistent-org-xyz")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        print("✓ Non-existent org returns 404")
    
    def test_get_org_info_case_insensitive(self):
        """Test slug lookup is case-insensitive"""
        response = requests.get(f"{BASE_URL}/api/public/org/DEMOIT")
        
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == TEST_ORG_SLUG.lower()
        print("✓ Slug lookup is case-insensitive")


class TestPublicWarrantySearch:
    """Tests for GET /api/public/org/{slug}/warranty endpoint"""
    
    def test_warranty_search_by_serial_number(self):
        """Test warranty search by serial number"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": TEST_DEVICE_SERIAL}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify device info
        assert "device" in data
        device = data["device"]
        assert device["serial_number"] == TEST_DEVICE_SERIAL
        assert device["brand"] == "Dell"
        assert device["model"] == "Latitude 5520"
        assert device["device_type"] == "Laptop"
        assert "warranty_active" in device
        assert "warranty_end" in device
        
        print(f"✓ Device found: {device['brand']} {device['model']}")
        print(f"  Serial: {device['serial_number']}")
        print(f"  Warranty Active: {device['warranty_active']}")
    
    def test_warranty_search_by_asset_tag(self):
        """Test warranty search by asset tag"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": TEST_DEVICE_ASSET_TAG}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find the same device
        assert data["device"]["asset_tag"] == TEST_DEVICE_ASSET_TAG
        assert data["device"]["serial_number"] == TEST_DEVICE_SERIAL
        print(f"✓ Device found by asset tag: {TEST_DEVICE_ASSET_TAG}")
    
    def test_warranty_search_returns_parts(self):
        """Test that warranty search returns parts info"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": TEST_DEVICE_SERIAL}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify parts array
        assert "parts" in data
        assert isinstance(data["parts"], list)
        assert len(data["parts"]) > 0
        
        part = data["parts"][0]
        assert "part_name" in part
        assert "warranty_active" in part
        print(f"✓ Parts returned: {len(data['parts'])} part(s)")
        for p in data["parts"]:
            print(f"  - {p['part_name']} (Warranty: {'Active' if p['warranty_active'] else 'Expired'})")
    
    def test_warranty_search_returns_service_history(self):
        """Test that warranty search returns service history"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": TEST_DEVICE_SERIAL}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify service history
        assert "service_history" in data
        assert isinstance(data["service_history"], list)
        assert len(data["service_history"]) > 0
        
        service = data["service_history"][0]
        assert "service_type" in service
        assert "description" in service
        assert "status" in service
        print(f"✓ Service history returned: {len(data['service_history'])} entry(ies)")
        for s in data["service_history"]:
            print(f"  - {s['service_type']}: {s['description'][:50]}...")
    
    def test_warranty_search_not_found(self):
        """Test 404 for non-existent device"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": "INVALID-SERIAL-XYZ"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower() or "no device" in data["detail"].lower()
        print("✓ Non-existent device returns 404")
    
    def test_warranty_search_invalid_org(self):
        """Test 404 when org doesn't exist"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/nonexistent-org/warranty",
            params={"q": TEST_DEVICE_SERIAL}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print("✓ Invalid org returns 404")
    
    def test_warranty_search_query_too_short(self):
        """Test 400 for query too short"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": "A"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "short" in data["detail"].lower()
        print("✓ Short query returns 400")
    
    def test_warranty_search_case_insensitive(self):
        """Test serial number search is case-insensitive"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": TEST_DEVICE_SERIAL.lower()}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["device"]["serial_number"] == TEST_DEVICE_SERIAL
        print("✓ Serial number search is case-insensitive")
    
    def test_warranty_response_structure(self):
        """Test complete response structure"""
        response = requests.get(
            f"{BASE_URL}/api/public/org/{TEST_ORG_SLUG}/warranty",
            params={"q": TEST_DEVICE_SERIAL}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields
        expected_fields = ["device", "company_name", "parts", "service_history", "amc_contract", "coverage_source"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify device fields
        device_fields = ["id", "device_type", "brand", "model", "serial_number", "warranty_active", "warranty_end"]
        for field in device_fields:
            assert field in data["device"], f"Missing device field: {field}"
        
        print("✓ Response structure is complete")
        print(f"  Coverage source: {data['coverage_source']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
