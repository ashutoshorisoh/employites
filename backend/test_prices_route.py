import sys
import os
import json
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import backend.api.routes.payments as payments_route
    
    class MockPrice:
        def __init__(self, price_id, amount, currency, interval):
            self.id = price_id
            
            class UnitPrice:
                def __init__(self, a, c):
                    self.amount = a
                    self.currency_code = c
            
            class BillingCycle:
                def __init__(self, i):
                    self.interval = i
                    
            self.unit_price = UnitPrice(amount, currency)
            self.billing_cycle = BillingCycle(interval)
            
    mock_prices = {
        "pri_01kxa97pyg0qhntxxpc6wrqb26": MockPrice("pri_01kxa97pyg0qhntxxpc6wrqb26", "75000", "USD", "month"),
        "pri_01kxa1starter_annual": MockPrice("pri_01kxa1starter_annual", "750000", "USD", "year"),
        "pri_02pro_monthly": MockPrice("pri_02pro_monthly", "13900", "USD", "month"),
        "pri_02pro_annual": MockPrice("pri_02pro_annual", "139000", "USD", "year"),
        "pri_03advanced_monthly": MockPrice("pri_03advanced_monthly", "20000", "USD", "month"),
        "pri_03advanced_annual": MockPrice("pri_03advanced_annual", "200000", "USD", "year"),
    }
    
    class MockPaddleClient:
        @property
        def prices(self):
            class PriceMock:
                def get(self, price_id, *args, **kwargs):
                    if price_id in mock_prices:
                        return mock_prices[price_id]
                    raise Exception(f"Price {price_id} not found")
            return PriceMock()
            
    payments_route.paddle_client = MockPaddleClient()

    from backend.main import app
    client = TestClient(app)

    # Test the public /prices endpoint (new array format)
    print("=" * 60)
    print("TEST 1: GET /v1/payments/prices (public array format)")
    print("=" * 60)
    response = client.get("/v1/payments/prices")
    print(f"Status Code: {response.status_code}")
    data = response.json()
    print(f"Response type: {type(data).__name__}")
    print(f"Response JSON:\n{json.dumps(data, indent=2)}")

    # Validate array format and true price values
    assert isinstance(data, list), f"Expected list, got {type(data).__name__}"
    assert len(data) == 3, f"Expected 3 tiers, got {len(data)}"
    
    starter_item = None
    pro_item = None
    enterprise_item = None
    
    for item in data:
        assert "tier" in item, f"Missing 'tier' field in {item}"
        assert "id" in item, f"Missing 'id' field in {item}"
        assert "numeric_price" in item, f"Missing 'numeric_price' field in {item}"
        assert "display_price" in item, f"Missing 'display_price' field in {item}"
        assert isinstance(item["numeric_price"], int), f"numeric_price should be int, got {type(item['numeric_price']).__name__}"
        
        if item["tier"] == "starter":
            starter_item = item
        elif item["tier"] == "professional":
            pro_item = item
        elif item["tier"] == "enterprise":
            enterprise_item = item

    assert starter_item is not None, "Starter tier not found"
    assert starter_item["numeric_price"] == 750, f"Expected 750, got {starter_item['numeric_price']}"
    assert starter_item["display_price"] == "$750 / month", f"Expected '$750 / month', got {starter_item['display_price']}"

    assert pro_item is not None, "Professional tier not found"
    assert pro_item["numeric_price"] == 139, f"Expected 139, got {pro_item['numeric_price']}"
    
    assert enterprise_item is not None, "Enterprise tier not found"
    assert enterprise_item["numeric_price"] == 200, f"Expected 200, got {enterprise_item['numeric_price']}"
    
    print("\n[PASS] All assertions PASSED for /v1/payments/prices\n")

    # Test the admin /pricing-tiers endpoint (same array format)
    print("=" * 60)
    print("TEST 2: GET /v1/admin/billing/pricing-tiers (admin array format)")
    print("=" * 60)
    response2 = client.get("/v1/admin/billing/pricing-tiers")
    print(f"Status Code: {response2.status_code}")
    data2 = response2.json()
    print(f"Response type: {type(data2).__name__}")
    print(f"Response JSON:\n{json.dumps(data2, indent=2)}")

    assert isinstance(data2, list), f"Expected list, got {type(data2).__name__}"
    
    starter_monthly_found = False
    starter_annual_found = False
    
    for item in data2:
        assert "tier" in item
        assert "numeric_price" in item
        assert isinstance(item["numeric_price"], int)
        
        if item["tier"] == "starter":
            assert item["numeric_price"] == 750
            starter_monthly_found = True
        elif item["tier"] == "starter_annual":
            assert item["numeric_price"] == 7500
            starter_annual_found = True
            
    assert starter_monthly_found, "Admin pricing-tiers missing 'starter'"
    assert starter_annual_found, "Admin pricing-tiers missing 'starter_annual'"
    print("\n[PASS] All assertions PASSED for /v1/admin/billing/pricing-tiers\n")

except Exception as e:
    print(f"[FAIL] TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
