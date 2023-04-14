var ee = require("@google/earthengine");
const express = require("express");
const cors = require("cors");
const app = express();

const earthEngineProxy = createProxyMiddleware("/earthengine", {
  target: "https://earthengine.googleapis.com",
  changeOrigin: true,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept",
  },
});

app.use(cors());
app.use(earthEngineProxy);

// Authenticate using one (but not both) of the methods below.
const PRIVATE_KEY = require("./private-key.json");
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  let tileUrlTemplate;

  ee.data.authenticateViaPrivateKey(PRIVATE_KEY, async () => {
    await ee.initialize(null, null, async () => {
      const dataset = await ee
        .ImageCollection("JAXA/GCOM-C/L3/OCEAN/SST/V2")
        .filterDate("2020-01-01", "2020-02-01")
        .filter(ee.Filter.eq("SATELLITE_DIRECTION", "D"));

      // Multiply with slope coefficient and add offset
      const image = await dataset.mean().multiply(0.0012).add(-10);

      // Get the map ID for the image
      const mapid = await image.getMap({
        bands: ["SST_AVE"],
        min: 0,
        max: 30,
        palette: ["000000", "005aff", "43c8c8", "fff700", "ff0000"],
      });

      // Construct a tile URL template using the map ID
      tileUrlTemplate = `https://earthengine.googleapis.com/map/${mapid.mapid}/{z}/{x}/{y}?token=${mapid.token}`;
      console.log(tileUrlTemplate);

      res.json({
        tileUrlTemplate,
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
