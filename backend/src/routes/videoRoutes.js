const Video = require('../../models/viewModel');
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { uploadFileToGCS } = require('../services/gcpStorage');
const crypto = require('crypto');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const generateVideoHash = (filePath) =>{
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    }); 
}

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Process a video into frames
 *     description: Receives a video file and returns an array of frames.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: video
 *         in: formData
 *         required: true
 *         type: file
 *         description: Video file to process
 *     responses:
 *       200:
 *         description: Successfully processed video frames
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videoId:
 *                   type: integer
 *                 videoUrl:
 *                   type: string
 *                 framesCount:
 *                   type: integer
 *                 frames:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: No video uploaded.
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
router.post('/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video uploaded' });
    }

    console.log(`Received video: ${req.file.filename}`);

    try {
        
        const videoId = await generateVideoHash(req.file.path);
        const existingVideo = await Video.findOne({ videoId });
        if (existingVideo) {
            return res.status(200).json({ message: 'Video already processed', video: existingVideo });
        }

        const gcsVideoUrl = await uploadFileToGCS(req.file.path, `videos/${videoId}`);

        const response = await axios.post('https://video-processor-microservice-251997476317.us-central1.run.app/api/process-video', {
            videoUrl: gcsVideoUrl,
            videoId: videoId
        });

        const { frameCount, frames } = response.data;

        // Save to MongoDB (store GCS URLs instead of file paths)
        const video = new Video({
            videoId,
            videoUrl: gcsVideoUrl, // Store the GCS URL
            frameCount,
            frames: frames.map(f => ({ framePath: f, detections: [] }))
        });

        await video.save();

        res.status(200).json({ message: 'Video processed and saved', video });
    } catch (error) {
        console.error('❌ Error sending video to processing service:', error.message);
        res.status(500).json({ error: 'Failed to process video' });
    }
});

module.exports = router;
