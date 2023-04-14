const { Storage } = require("@google-cloud/storage");
const ee = require("@google/earthengine");

// Set up your Google Cloud Storage credentials
const storage = new Storage({
  projectId: "season-mapsea",
  keyFilename: "./private-key.json",
});

// Set up your Google Earth Engine credentials
const privateKey = require("./private-key.json");
const clientId = "105585495914122280022";
const scopes = ["https://www.googleapis.com/auth/earthengine"];

ee.data.authenticateViaPrivateKey(privateKey, () => {
  ee.initialize(null, null, () => {
    var landsat = ee
      .Image("LANDSAT/LC08/C02/T1_TOA/LC08_123032_20140515")
      .select(["B4", "B3", "B2"]);

    // Create a geometry representing an export region.
    var geometry = ee.Geometry.Rectangle([
      116.2621, 39.8412, 116.4849, 40.01236,
    ]);
    var projection = landsat.select("B2").projection().getInfo();

    ee.batch.Export.image.toCloudStorage(
      {
        image: landsat,
        bucketName: "explorer-earthengine-bucket",
        region: geometry,
        fileNamePrefix: "haha",
        crs: projection.crs,
        crsTransform: projection.transform,
      },
      (err, task) => {
        if (err) {
          console.error(`Error exporting image: ${err}`);
          return;
        }
        console.log(`Image exported to Google Cloud Storage: ${task}`);
      }
    );
  });
});
