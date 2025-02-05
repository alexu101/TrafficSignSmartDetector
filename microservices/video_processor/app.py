import requests
from flask import Flask, request, jsonify
import cv2
import os
import uuid
from google.cloud import storage
from dotenv import load_dotenv
import io
import tempfile
from flasgger import Swagger

load_dotenv()

GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

if GOOGLE_CREDENTIALS_PATH:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_CREDENTIALS_PATH
else:
    print("ERROR: GOOGLE_APPLICATION_CREDENTIALS not set in .env")
    
if GCS_BUCKET_NAME:
    os.environ["GCS_BUCKET_NAME"] = GCS_BUCKET_NAME
else:
    print("ERROR: GCS_BUCKET_NAME not set in .env")

app = Flask(__name__)
Swagger(app)

FRAMES_DIR = "./frames"
os.makedirs(FRAMES_DIR, exist_ok=True)

@app.route('/api/process-video', methods=['POST'])
def process_video():
    """
    Process a video into frames
    ---
    consumes:
      - application/json
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - videoUrl
            - videoId
          properties:
            videoUrl:
              type: string
              description: URL of the video to process
            videoId:
              type: string
              description: Unique video identifier
            fps:
              type: integer
              description: Number of frames to create
    responses:
      200:
        description: Successfully processed video frames
        schema:
          type: object
          properties:
            framesCount:
              type: integer
            frames:
              type: array
              items:
                type: string
      400:
        description: Bad Request - Missing parameters or invalid file
        schema:
          type: object
          properties:
            message:
              type: string
              example: "No video file uploaded or missing videoId"
      500:
        description: Internal Server Error - Google Cloud Storage issue
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Error uploading to Google Cloud Storage"
    """
    data = request.json
    video_url = data.get('videoUrl')
    predefined_fps = data.get('fps', 1)

    print(f"Received Request: Video URL={video_url}, FPS={predefined_fps}")

    if not video_url:
        print("ERROR: No video URL provided")
        return jsonify({'error': 'No video URL provided'}), 400

    video_id = data.get('videoId')
    temp_dir = tempfile.gettempdir()
    video_path = os.path.join(temp_dir, f"{video_id}.mp4")

    print(f"Downloading video from: {video_url} to {video_path}")

    try:
        r = requests.get(video_url, stream=True)

        if r.status_code != 200:
            print(f"ERROR: Failed to download video. HTTP Status Code: {r.status_code}")
            return jsonify({'error': 'Failed to download video from GCS'}), 500

        with open(video_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)
                    
        if os.path.exists(video_path):
            print(f"Video file successfully saved at {video_path}")
        else:
            print(f"ERROR: Video file was NOT saved at {video_path}")
            return jsonify({'error': 'Video file was not saved correctly'}), 500

    except Exception as e:
        print(f"Exception while downloading video: {str(e)}")
        return jsonify({'error': 'Failed to download video'}), 500

    cap = cv2.VideoCapture(video_path)
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    
    if original_fps == 0:
        print("ERROR: Could not determine FPS, defaulting to 1 FPS")
        original_fps = 5  # Default FPS if reading fails

    frame_interval = max(1, int(original_fps / predefined_fps))

    frame_count = 0
    saved_frame_count = 0
    frame_urls = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            _, buffer = cv2.imencode(".jpg", frame)
            frame_bytes = io.BytesIO(buffer)

            gcs_path = f'frames/{video_id}/{saved_frame_count}.jpg'
            frame_url = upload_bytes_to_gcs(frame_bytes, gcs_path)
            if frame_url:
                frame_urls.append(frame_url)

            saved_frame_count += 1

        frame_count += 1

    cap.release()

    return jsonify({
        'frameCount': saved_frame_count,
        'frames': frame_urls
    })

storage_client = storage.Client()
def upload_bytes_to_gcs(image_bytes, gcs_path):
    """
    Uploads a file to Google Cloud Storage and returns the public URL.
    """
    try:
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(gcs_path)
        
        blob.upload_from_file(image_bytes, content_type='image/jpeg')
        blob.make_public()

        public_url = blob.public_url
        return public_url
    except Exception as e:
        print(f"ERROR uploading to GCS: {str(e)}")
        return None

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
