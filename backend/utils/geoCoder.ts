const NodeGeocoder = require("node-geocoder");

const options = {
  provider: process.env.GEOCODER_PROVIDER,
  apiKey: process.env.GEOCODER_API_KEY, // for Mapquest, OpenCage, APlace, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

const geoCoder = NodeGeocoder(options);

export default geoCoder;
