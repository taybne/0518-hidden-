import requests

BASE_URL = "http://localhost:5000"

# Test registration page
print("Testing /register...")
response = requests.get(f"{BASE_URL}/register")
print(f"Status: {response.status_code}")
print(f"Available: {'Yes' if response.status_code == 200 else 'No'}\n")

# Test login page
print("Testing /login...")
response = requests.get(f"{BASE_URL}/login")
print(f"Status: {response.status_code}")
print(f"Available: {'Yes' if response.status_code == 200 else 'No'}\n")

# Test chats page (should be 302 redirect to login for unauthenticated)
print("Testing /chats (should redirect to login)...")
response = requests.get(f"{BASE_URL}/chats", allow_redirects=False)
print(f"Status: {response.status_code}")
print(f"Redirects to: {response.headers.get('Location', 'N/A')}\n")
