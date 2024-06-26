import AWS from "aws-sdk";
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

export const connectionAws = () => {
  AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_IMG,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_IMG,
    region: process.env.REGION_IMG,
  });

  return new AWS.S3();
};
