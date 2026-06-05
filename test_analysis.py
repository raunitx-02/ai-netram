import requests
import sys

url = "http://127.0.0.1:5010/api/analyze"
file_path = "/Users/raunitjha/Documents/train-sample/uploads/NVR_ch2_main_good_door3.dav"

print(f"Uploading {file_path} for analysis...")
try:
    with open(file_path, 'rb') as f:
        files = {'video': f}
        data = {'bogie_count': 4}
        response = requests.post(url, files=files, data=data)
        
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())
except Exception as e:
    print(f"Error occurred: {e}")
