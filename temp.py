import requests

url = "http://localhost:3500/api/v1/grams"

data = {
    "corpus": "monkeyracer",
    "ngram": 2,
    "count": 50,
    "noshift": False,
    "nospace": True,
    "regex": "^[bcd].*[aeiou]"
}

req = requests.post(url, json=data)

if req.status_code == 200:
    for a, b in req.json():
        print(f"{a} {b:.3%}")
else:
    print(req.content)