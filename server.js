const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware for cross-origin requests and parsing form data
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0.auq90.mongodb.net/activism?retryWrites=true&w=majority';

(async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
})();

// Schema for retrieving GeoJSON data from `activistdata`
const geoSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Feature" },
    properties: { type: Object },
    geometry: {
      type: { type: String, enum: ["Point", "LineString", "Polygon"], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  { collection: "activistdata" } // MongoDB collection name
);

// Model for GeoJSON retrieval
const GeoModel = mongoose.model('GeoCollection', geoSchema);

// Schema for form submissions
const formSchema = new mongoose.Schema({
  organization_name: { type: String, required: true },
  site_name: { type: String, required: true },
  site_address: { type: String, required: true },
  year_built: { type: Number },
  historic_uses: { type: String, required: true },
  current_uses: { type: String, required: true },
  associated_activists: [
    {
      name: { type: String },
      paragraph: { type: String, maxlength: 500 },
    },
  ],
  archival_materials: { type: String },
  archival_description: { type: String, maxlength: 500 },
});

// Model for form submissions
const FormData = mongoose.model('HistoricalLocation', formSchema);

// API endpoint to retrieve GeoJSON data
app.get('/api/geojson', async (req, res) => {
  try {
    const features = await GeoModel.find(); // Fetch data from activistdata
    console.log('Features retrieved from MongoDB:', features); // Debugging

    res.json({
      type: "FeatureCollection",
      features: features.map((feature) => ({
        type: feature.type,
        properties: feature.properties,
        geometry: feature.geometry,
      })),
    });
  } catch (error) {
    console.error('Error fetching GeoJSON data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Serve the form HTML
app.get('/form', (req, res) => {
  res.sendFile(__dirname + '/Form.html');
});

// Handle form submissions
app.post('/submit', async (req, res) => {
  const formData = new FormData({
    organization_name: req.body.organization_name,
    site_name: req.body.site_name,
    site_address: req.body.site_address,
    year_built: req.body.year_built || null,
    historic_uses: req.body.historic_uses,
    current_uses: req.body.current_uses,
    associated_activists: [
      {
        name: req.body.associated_activist_1 || '',
        paragraph: req.body.activist_1_paragraph || '',
      },
      {
        name: req.body.associated_activist_2 || '',
        paragraph: req.body.activist_2_paragraph || '',
      },
      {
        name: req.body.associated_activist_3 || '',
        paragraph: req.body.activist_3_paragraph || '',
      },
    ],
    archival_materials: req.body.archival_materials || '',
    archival_description: req.body.archival_description || '',
  });

  try {
    await formData.save();
    res.send('Data saved successfully!');
  } catch (error) {
    console.error('Error saving form data:', error);
    res.status(500).send('Error saving data');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
