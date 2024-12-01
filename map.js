mapboxgl.accessToken = 'pk.eyJ1IjoienZsMTIxNSIsImEiOiJjbTE4OG1lNnQwOG5lMmpxMnRwNGZnb3drIn0.U_npUNUZEOSOXVi5-SWgHw';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map', // The ID of the map container
  style: {
    version: 8,
    sources: {
      'stadia-tiles': {
        type: 'raster',
        tiles: [
          `https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png?api_key=99e82fc4-ae1b-4d11-8f3e-1aebf67508f9`
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'stadia-tiles-layer',
        type: 'raster',
        source: 'stadia-tiles',
      },
    ],
  },
  center: [-73.935242, 40.730610], // Starting position [lng, lat]
  zoom: 12, // Initial zoom level
});

// Add navigation controls
const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-right');

// Load GeoJSON data and add to the map
map.on('load', () => {
  const geojsonEndpoint = 'https://p2p-csc-a2d00f9ce2be.herokuapp.com/api/geojson';

  fetch(geojsonEndpoint)
    .then(response => response.json())
    .then(data => {
      if (data && data.features && data.features.length > 0) {
        console.log('GeoJSON data loaded successfully:', data);

        // Add GeoJSON source
        map.addSource('mongoLayer', {
          type: 'geojson',
          data: data,
        });

        // Add a layer to display MongoDB data with circle outline
        map.addLayer({
          id: 'mongoLayer',
          type: 'circle',
          source: 'mongoLayer',
          paint: {
            'circle-radius': 10,
            'circle-color': '#ffd500', // Fill color
            'circle-stroke-color': '#000000', // Outline color
            'circle-stroke-width': 0.5, // Outline width
          },
        });

        // Add popup interaction
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'custom-popup', // Custom class for styling
        });

        map.on('mouseenter', 'mongoLayer', (e) => {
          map.getCanvas().style.cursor = 'pointer';

          const coordinates = e.features[0].geometry.coordinates.slice();
          const properties = e.features[0].properties;

          // Set the popup content to display only the site name
          popup.setLngLat(coordinates)
            .setHTML(`
              <h3>${properties.Site || 'Unknown Site'}</h3>
            `)
            .addTo(map);
        });

        map.on('mouseleave', 'mongoLayer', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });
      } else {
        console.error('No features found in the GeoJSON data.');
      }
    })
    .catch(err => {
      console.error('Error fetching GeoJSON data:', err);
    });
});
