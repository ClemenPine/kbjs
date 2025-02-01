import requests

# Define the API endpoint
url = "http://localhost:3500/api/v1/grams"

# Define the JSON payload
data = {
    "corpus": "monkeyracer",
    "ngram": 1,
    "count": 1000000,
    "noshift": False,
    "nospace": True,
}

# Send a POST request
response = requests.post(url, json=data)

# Print response
print(response.content)
# print("Status Code:", response.status_code)
# print("Response JSON:", response.json())
