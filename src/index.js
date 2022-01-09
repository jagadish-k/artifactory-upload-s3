const core = require('@actions/core');
const github = require('@actions/github');
const fs = require("fs");
const path = require("path");
const AWS = require('aws-sdk');
// Set the Region 
AWS.config.update({ region: core.getInput('aws-region') });

try {
  const artifactToUpload = core.getInput('artifact');
  if (fs.lstatSync(artifactToUpload).isDirectory()) {
    throw new Error('"artifact" must be a single file. Directories are not supported.');
  } else {
    // const spacesEndpoint = new aws.Endpoint(process.env.S3_ENDPOINT);
    const s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    });
    // get `app-name` the root app for which the build is being done.
    const appName = core.getInput('app-name');
    const destDir = core.getInput('destination-dir');
    const uploadPath = `${appName}${destDir ? `/${destDir}` : ''}/builds/`;
    const fileContent = fs.readFileSync(artifactToUpload);
    const artifactName = artifactToUpload.split('/').slice(-1);
    const params = {
      Bucket: core.getInput('s3-bucket'),
      Key: path.normalize(`${uploadPath}/${artifactName}`),
      Body: fileContent,
    };

    s3.upload(params, function (err, data) {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successful. ${data.Location}`);
    });
  }
} catch (error) {
  core.setFailed(error.message);
}
