#!/usr/bin/env python3
"""
Test script for card API endpoints
Tests GET and PUT operations on /api/mobile/user/cards/<card_id>
Uses the Supabase-compatible sync-user endpoint
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5001"

def test_card_endpoints():
    """Test the card GET and PUT endpoints"""
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    print("=" * 60)
    print("STEP 1: Sync user with Flask backend (Supabase-style)")
    print("=" * 60)
    
    # Sync user (simulating Supabase auth)
    sync_response = session.post(
        f"{BASE_URL}/api/mobile/auth/sync-user",
        json={
            "email": "test@example.com",
            "full_name": "Test User",
            "phone": "1234567890"
        }
    )
    
    print(f"Sync Response: {sync_response.status_code}")
    
    if sync_response.status_code != 200:
        print(f"Response text: {sync_response.text}")
        print("❌ Sync failed!")
        return
    
    sync_data = sync_response.json()
    print(json.dumps(sync_data, indent=2))
    
    user_id = sync_data['user']['id']
    print(f"✅ Synced as user_id: {user_id}")
    
    print("\n" + "=" * 60)
    print("STEP 2: Get all user cards")
    print("=" * 60)
    
    # Get all cards to find a card_id
    cards_response = session.get(f"{BASE_URL}/api/mobile/user/cards")
    print(f"Cards Response: {cards_response.status_code}")
    cards_data = cards_response.json()
    print(json.dumps(cards_data, indent=2))
    
    if not cards_data.get('cards'):
        print("\n⚠️  No cards found. Creating a test card by scanning...")
        
        # Need to create a card first - scan at a company
        # First get companies
        companies_response = session.get(f"{BASE_URL}/api/mobile/companies")
        companies = companies_response.json().get('companies', [])
        
        if not companies:
            print("❌ No companies found. Please run migrate_and_seed.py first.")
            return
        
        company_id = companies[0]['id']
        print(f"Using company_id: {company_id} ({companies[0]['name']})")
        
        # Perform a scan to create a card
        scan_response = session.post(
            f"{BASE_URL}/api/mobile/scan",
            json={"user_id": user_id, "company_id": company_id}
        )
        print(f"Scan Response: {scan_response.status_code}")
        print(json.dumps(scan_response.json(), indent=2))
        
        # Get cards again
        cards_response = session.get(f"{BASE_URL}/api/mobile/user/cards")
        cards_data = cards_response.json()
        print("\nUpdated cards:")
        print(json.dumps(cards_data, indent=2))
    
    if not cards_data.get('cards'):
        print("❌ Still no cards found!")
        return
    
    # Get the first card
    card_id = cards_data['cards'][0]['id']
    print(f"\n✅ Using card_id: {card_id}")
    
    print("\n" + "=" * 60)
    print(f"STEP 3: Get specific card (card_id={card_id})")
    print("=" * 60)
    
    # Test GET specific card
    get_card_response = session.get(f"{BASE_URL}/api/mobile/user/cards/{card_id}")
    print(f"Get Card Response: {get_card_response.status_code}")
    card_before = get_card_response.json()
    print(json.dumps(card_before, indent=2))
    
    if get_card_response.status_code != 200:
        print("❌ Failed to get card!")
        return
    
    original_score = card_before['card']['punches']
    print(f"\n✅ Original punches: {original_score}")
    
    print("\n" + "=" * 60)
    print(f"STEP 4: Update card score (add 5 points)")
    print("=" * 60)
    
    # Test PUT to update score
    update_response = session.put(
        f"{BASE_URL}/api/mobile/user/cards/{card_id}",
        json={"score_increment": 5}
    )
    print(f"Update Response: {update_response.status_code}")
    update_data = update_response.json()
    print(json.dumps(update_data, indent=2))
    
    if update_response.status_code != 200:
        print("❌ Failed to update card!")
        return
    
    updated_score = update_data['card']['punches']
    print(f"\n✅ Updated punches: {updated_score}")
    print(f"✅ Score increased by: {updated_score - original_score}")
    
    print("\n" + "=" * 60)
    print(f"STEP 5: Fetch card again to verify update")
    print("=" * 60)
    
    # Fetch again to verify
    verify_response = session.get(f"{BASE_URL}/api/mobile/user/cards/{card_id}")
    print(f"Verify Response: {verify_response.status_code}")
    card_after = verify_response.json()
    print(json.dumps(card_after, indent=2))
    
    final_score = card_after['card']['punches']
    print(f"\n✅ Final punches: {final_score}")
    
    print("\n" + "=" * 60)
    print("VERIFICATION RESULTS")
    print("=" * 60)
    
    if final_score == updated_score == original_score + 5:
        print("✅ SUCCESS! Score was correctly updated and persisted.")
        print(f"   Original: {original_score}")
        print(f"   Updated:  {updated_score}")
        print(f"   Verified: {final_score}")
    else:
        print("❌ FAILED! Score mismatch.")
        print(f"   Original: {original_score}")
        print(f"   Expected: {original_score + 5}")
        print(f"   Got:      {final_score}")

if __name__ == "__main__":
    try:
        test_card_endpoints()
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to server at", BASE_URL)
        print("   Make sure the Flask server is running:")
        print("   cd server && python3 server.py")
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
