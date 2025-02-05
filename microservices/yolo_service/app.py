from flask import Flask, request, jsonify
from ultralytics import YOLO
import os
import logging
from flasgger import Swagger

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
Swagger(app)
app.logger.info("YOLO microservice started.")

model = YOLO('./models/best_1.pt')


@app.route('/api/detect', methods = ['POST'])
def detect():
    """
    Upload an image to detect traffic signs
    ---
    consumes: 
     - image/jpg
    parameters: 
     - name: image
       type: image/jpeg
       required: true
       description: The image file to process
    responses:
      200:
        description: Successfully detected traffic signs
        schema:
            type: object
            properties:
                detections:
                    type: array
                    items: { class_id: int, confidence: double, bounding_box: array }
                    example: [ class_id: 1, confidence: 0.99, bounding_box: [x_min: 0, y_min: 0, x_max: 10, y_max: 10] ]
      400:
        description: Bad Request - No file uploaded or invalid file type
        schema:
          type: object
          properties:
            message:
              type: string
    """
    if 'image' not in request.files:
        app.logger.error("No image uploaded")
        return jsonify({'error':'No image uploaded'}), 400
    
    image = request.files['image']
    if not image.content_type.startswith('image/'):
        app.logger.error("Invalid file type")
        return jsonify({'error': 'Invalid file type. Please upload an image. '}), 400
    
    file_extension = os.path.splitext(image.filename)[-1].lower()
    print(file_extension)
    
    temp_image_path = './temp/' + image.filename
    os.makedirs('./temp', exist_ok=True)
    image.save(temp_image_path)
    
    try:
        results = model.predict(source=temp_image_path)
        detections = []
        for res in results:
            for box in res.boxes:
                class_id = int(box.cls.item())
                confidence = box.conf.item()
                x_min, y_min, x_max, y_max = box.xyxy.tolist()[0]
                bounding_box = {"x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max}

                detection = {
                    "class_id": class_id,
                    "confidence": confidence,
                    "bounding_box": bounding_box
                }

                detections.append(detection)
        response = detections
    finally:
        os.remove(temp_image_path)

    return jsonify(response)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
