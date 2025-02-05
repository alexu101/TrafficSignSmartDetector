const express = require('express')
const axios = require('axios')
const multer = require('multer')
const fs = require('fs')
const FormData = require('form-data');
const {getTrafficSignDetails} = require('../services/ontologyService')
const {TrafficSignClassMap} = require('../utils/trafficSignClassMapping')
const Video = require('../../models/viewModel');

const router = express.Router()
const upload = multer({dest: 'uploads/'})

const downloadImage = async (imageUrl, outputPath) => {
    const response = await axios({
      url: imageUrl,
      responseType: "stream",
    });
  
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  };

/**
 * @swagger
 * /detect:
 *   post:
 *     summary: Detect traffic signs inside the image and retrieve informations about them.
 *     description: Receives an image and returns all the traffic signs found and related informations.
 *     consumes:
 *       - image/jpg
 *     parameters:
 *       - name: image
 *         in: image
 *         required: true
 *         type: jpeg
 *         description: Image to process
 *     responses:
 *       200:
 *         description: Successfully processed image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 frames:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: No image uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Processing microservice error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/detect', upload.single('image'), async(req, res)=>{
    
    let imagePath = null
    
    try{
        if (!req.body.imageUrl || !req.body.videoId){
            return res.status(400).json({error: 'No image url or video id!'})
        }

        const imageUrl = req.body.imageUrl;
        const videoId = req.body.videoId
        console.log(`Downloading image from URL: ${imageUrl}`);
  
        const fileName = `uploads/${Date.now()}-image.jpg`;
        await downloadImage(imageUrl, fileName);
        imagePath = fileName;
        

        const formData = new FormData()
        formData.append('image', fs.createReadStream(imagePath),{
            filename: "input.jpg",
            contentType: "image/jpeg",
        });

        console.log("Sending image to YOLO service...")
        
        const yoloResponse = await axios.post('https://yolo-microservice-251997476317.us-central1.run.app/api/detect', formData, {
            headers: formData.getHeaders(),
        })
        
        // console.log('Received response from YOLO service:', yoloResponse.data);

        fs.unlinkSync(imagePath);

        const detections = yoloResponse.data;
        const combinedResults = [];
        for (const detection of detections){
            const classId = detection["class_id"];
            const confidence = detection["confidence"]
            const bbox = detection["bounding_box"]
            const ontologyDetails = await getTrafficSignDetails(TrafficSignClassMap[classId])
            console.log(classId, TrafficSignClassMap[classId])
            combinedResults.push({
                class: {
                    classId: classId,
                    trafficSign: TrafficSignClassMap[classId]
                },
                confidence: confidence,
                bbox: bbox,
                ontologyDetails: ontologyDetails || 'No details found in the ontology'
            })
        }

        const video = await Video.findOne({ videoId });
        if (!video) {
            return res.status(404).json({ error: "Video not found" })
        }
        const frame = video.frames.find(f => f.framePath === imageUrl)
        
        if (!frame) {
            return res.status(404).json({ error: "Frame not found in the video" });
        }

        frame.detections = [];
        frame.detections.push(...combinedResults);
        await video.save();

        console.log("Detection results saved in video frame");

        res.status(200).json({ message: 'Detection done!', video })
        
    } catch(error){
        console.log('Error communicating with YOLO service: ', error.message);

        if (error.response) {
            console.error('YOLO Service Error Response:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }

        res.status(500).json({error: 'Failed to process image. Please try again'})
    }
})

module.exports = router