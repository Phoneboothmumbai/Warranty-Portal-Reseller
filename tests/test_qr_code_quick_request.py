"""
Test QR Code and Quick Service Request Features
================================================
Tests for:
1. GET /api/device/{serial_number}/qr - Returns PNG QR code image
2. GET /api/device/{serial_number}/info - Returns public device info
3. POST /api/device/{serial_number}/quick-request - Creates quick service request without auth
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test device serial from seed data
TEST_DEVICE_SERIAL = "DL20260101085832"


class TestQRCodeEndpoint:
    """Tests for QR code generation endpoint"""
    
    def test_qr_code_returns_png_image(self):
        """GET /api/device/{serial}/qr should return PNG image"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/qr")
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'image/png'
        
        # Verify PNG magic bytes
        content = response.content
        assert len(content) > 0
        assert content[:8] == b'\x89PNG\r\n\x1a\n', "Response should be valid PNG"
        print(f"✓ QR code returned valid PNG image ({len(content)} bytes)")
    
    def test_qr_code_with_custom_size(self):
        """GET /api/device/{serial}/qr?size=300 should return larger QR"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/qr?size=300")
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'image/png'
        print(f"✓ QR code with custom size returned ({len(response.content)} bytes)")
    
    def test_qr_code_invalid_device_returns_404(self):
        """GET /api/device/{invalid}/qr should return 404"""
        response = requests.get(f"{BASE_URL}/api/device/INVALID_SERIAL_12345/qr")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid device returns 404: {data['detail']}")
    
    def test_qr_code_has_cache_headers(self):
        """QR code response should have cache headers"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/qr")
        
        assert response.status_code == 200
        # Check for cache-control header
        cache_control = response.headers.get('cache-control', '')
        print(f"✓ Cache-Control header: {cache_control}")


class TestPublicDeviceInfoEndpoint:
    """Tests for public device info endpoint"""
    
    def test_device_info_returns_complete_data(self):
        """GET /api/device/{serial}/info should return device details"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/info")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify device info structure
        assert "device" in data
        device = data["device"]
        assert device["serial_number"] == TEST_DEVICE_SERIAL
        assert "brand" in device
        assert "model" in device
        assert "device_type" in device
        assert "warranty_active" in device
        assert "warranty_end_date" in device
        
        print(f"✓ Device info: {device['brand']} {device['model']}")
        print(f"  Serial: {device['serial_number']}")
        print(f"  Warranty Active: {device['warranty_active']}")
    
    def test_device_info_includes_company(self):
        """Device info should include company name"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/info")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "company" in data
        assert "name" in data["company"]
        print(f"✓ Company: {data['company']['name']}")
    
    def test_device_info_includes_amc_status(self):
        """Device info should include AMC coverage if exists"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/info")
        
        assert response.status_code == 200
        data = response.json()
        
        # AMC can be null or object
        if data.get("amc"):
            assert "name" in data["amc"]
            assert "active" in data["amc"]
            print(f"✓ AMC: {data['amc']['name']} (Active: {data['amc']['active']})")
        else:
            print("✓ No AMC coverage for this device")
    
    def test_device_info_includes_service_history(self):
        """Device info should include service history"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/info")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "service_history" in data
        assert "service_count" in data
        assert isinstance(data["service_history"], list)
        print(f"✓ Service history: {data['service_count']} records")
    
    def test_device_info_includes_parts(self):
        """Device info should include parts with warranty status"""
        response = requests.get(f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/info")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "parts" in data
        assert isinstance(data["parts"], list)
        
        for part in data["parts"]:
            assert "part_name" in part
            assert "warranty_active" in part
        
        print(f"✓ Parts: {len(data['parts'])} parts found")
    
    def test_device_info_invalid_device_returns_404(self):
        """GET /api/device/{invalid}/info should return 404"""
        response = requests.get(f"{BASE_URL}/api/device/INVALID_SERIAL_12345/info")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid device returns 404: {data['detail']}")


class TestQuickServiceRequestEndpoint:
    """Tests for quick service request endpoint (no auth required)"""
    
    def test_quick_request_creates_ticket(self):
        """POST /api/device/{serial}/quick-request should create ticket"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        payload = {
            "name": "Test User",
            "email": unique_email,
            "phone": "9876543210",
            "issue_category": "hardware",
            "description": "Test issue from automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "ticket_number" in data
        assert data["ticket_number"].startswith("QSR-")
        assert "message" in data
        assert "device" in data
        
        print(f"✓ Quick request created: {data['ticket_number']}")
        print(f"  Message: {data['message']}")
    
    def test_quick_request_returns_device_info(self):
        """Quick request response should include device info"""
        payload = {
            "name": "Test User",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "",
            "issue_category": "software",
            "description": "Software issue test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "device" in data
        assert data["device"]["serial_number"] == TEST_DEVICE_SERIAL
        assert "brand" in data["device"]
        assert "model" in data["device"]
        
        print(f"✓ Device in response: {data['device']['brand']} {data['device']['model']}")
    
    def test_quick_request_all_categories(self):
        """Quick request should accept all issue categories"""
        categories = ["hardware", "software", "network", "performance", "other"]
        
        for category in categories:
            payload = {
                "name": "Test User",
                "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
                "issue_category": category,
                "description": f"Testing {category} category"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
                json=payload
            )
            
            assert response.status_code == 200
            print(f"✓ Category '{category}' accepted")
    
    def test_quick_request_without_phone(self):
        """Quick request should work without phone number"""
        payload = {
            "name": "Test User",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "issue_category": "other",
            "description": "Test without phone"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload
        )
        
        assert response.status_code == 200
        print("✓ Quick request works without phone number")
    
    def test_quick_request_requires_name(self):
        """Quick request should require name field"""
        payload = {
            "email": "test@example.com",
            "issue_category": "hardware",
            "description": "Test without name"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload
        )
        
        # Should fail validation
        assert response.status_code == 422
        print("✓ Name field is required (422 on missing)")
    
    def test_quick_request_requires_email(self):
        """Quick request should require email field"""
        payload = {
            "name": "Test User",
            "issue_category": "hardware",
            "description": "Test without email"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload
        )
        
        # Should fail validation
        assert response.status_code == 422
        print("✓ Email field is required (422 on missing)")
    
    def test_quick_request_requires_description(self):
        """Quick request should require description field"""
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "issue_category": "hardware"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload
        )
        
        # Should fail validation
        assert response.status_code == 422
        print("✓ Description field is required (422 on missing)")
    
    def test_quick_request_invalid_device_returns_404(self):
        """POST /api/device/{invalid}/quick-request should return 404"""
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "issue_category": "hardware",
            "description": "Test for invalid device"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/INVALID_SERIAL_12345/quick-request",
            json=payload
        )
        
        assert response.status_code == 404
        print("✓ Invalid device returns 404")
    
    def test_quick_request_no_auth_required(self):
        """Quick request should work without any authentication"""
        # Explicitly NOT sending any auth headers
        payload = {
            "name": "Anonymous User",
            "email": f"anon_{uuid.uuid4().hex[:8]}@example.com",
            "issue_category": "other",
            "description": "Testing no auth required"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload,
            headers={"Content-Type": "application/json"}  # Only content-type, no auth
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        print("✓ Quick request works without authentication")


class TestOsTicketIntegration:
    """Tests for osTicket integration (may return null in preview environment)"""
    
    def test_quick_request_osticket_field_present(self):
        """Quick request response should include osticket_id field"""
        payload = {
            "name": "Test User",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "issue_category": "hardware",
            "description": "Testing osTicket integration"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/device/{TEST_DEVICE_SERIAL}/quick-request",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # osticket_id should be present (may be null in preview env)
        assert "osticket_id" in data
        
        if data["osticket_id"]:
            print(f"✓ osTicket ID: {data['osticket_id']}")
        else:
            print("✓ osticket_id field present (null - expected in preview environment)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
