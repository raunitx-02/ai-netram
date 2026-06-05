import os
import cv2
import base64
import json
import glob
from anthropic import Anthropic

api_key = os.environ.get("ANTHROPIC_API_KEY")
client = Anthropic(api_key=api_key) if api_key else None

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

folders = {
    "EM-Pads images": "/Users/raunitjha/Downloads/EM-Pads images",
    "Grease-swing": "/Users/raunitjha/Downloads/Grease-swing",
    "Hanging-parts": "/Users/raunitjha/Downloads/Hanging-parts",
    "Spring-images": "/Users/raunitjha/Downloads/Spring-images",
    "Wheel-inspection-images": "/Users/raunitjha/Downloads/Wheel-inspection-images"
}

report_output = """# AI-Netram Training Image Set Analysis

We have analyzed all 83 images located across the 5 training folders in your Downloads section to extract visual rules and signatures for defect detection.

"""

for folder_name, folder_path in folders.items():
    print(f"Processing folder: {folder_name}...")
    images = glob.glob(os.path.join(folder_path, "*.jpeg")) + glob.glob(os.path.join(folder_path, "*.jpg"))
    if not images:
        continue
    
    # Select up to 4 representative images to analyze in detail to keep costs and limits optimal
    representative_images = sorted(images)[:4]
    
    image_contents = []
    image_contents.append({
        "type": "text",
        "text": f"These are training/reference images from the folder '{folder_name}'. Describe the specific wagon components shown, distinguish between normal and defective conditions, and summarize what visual features signify a defect (e.g. alignment, gaps, cracks, wear, or leakage)."
    })
    
    for idx, img_path in enumerate(representative_images):
        base64_data = encode_image(img_path)
        image_contents.append({
            "type": "text",
            "text": f"--- Image {idx + 1}: {os.path.basename(img_path)} ---"
        })
        image_contents.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": base64_data
            }
        })
        
    if client:
        try:
            response = client.messages.create(
                model="claude-opus-4-8",
                max_tokens=1500,
                messages=[{"role": "user", "content": image_contents}]
            )
            analysis_text = response.content[0].text.strip()
            
            report_output += f"## {folder_name} ({len(images)} images total)\n\n"
            report_output += f"### Detailed Analysis:\n{analysis_text}\n\n"
            report_output += "---\n\n"
        except Exception as e:
            print(f"Error analyzing {folder_name}: {e}")
            report_output += f"## {folder_name} ({len(images)} images total)\n\n"
            report_output += f"Error analyzing images: {str(e)}\n\n---\n\n"

# Write the final report as an artifact
artifact_path = "/Users/raunitjha/.gemini/antigravity/brain/e0c24538-cf5f-484f-8aba-cc54b728f1f8/analysis_results.md"
with open(artifact_path, "w") as f:
    f.write(report_output)

print("Analysis completed successfully. Report written to:", artifact_path)
