const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

const uploadFileToGCS = async (filePath, destination) => {
    return new Promise((resolve, reject) => {
        bucket.upload(filePath, {
            destination: destination,
            predefinedAcl: undefined,
        }, (err, file) => {
            if (err) {
                reject(err);
            } else {
                resolve(`https://storage.googleapis.com/${bucketName}/${destination}`);
            }
        });
    });
};

module.exports = { uploadFileToGCS };
