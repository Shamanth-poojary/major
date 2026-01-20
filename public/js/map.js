document.addEventListener("DOMContentLoaded", () => {
  const mapDiv = document.getElementById("map");
  const loadBtn = document.getElementById("loadMapBtn");

  // If this page doesn't have a map → exit safely
  if (!mapDiv || !loadBtn) return;

  const mapToken = mapDiv.dataset.token;
  const coordinates = JSON.parse(mapDiv.dataset.coordinates);

  let mapLoaded = false;

  loadBtn.addEventListener("click", () => {
    if (mapLoaded) return;

    mapLoaded = true;
    mapDiv.style.display = "block";
    loadBtn.style.display = "none";

    console.log("🗺️ Loading map...");

    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: coordinates,
      zoom: 7,
    });

    map.addControl(new mapboxgl.NavigationControl());

    new mapboxgl.Marker().setLngLat(coordinates).addTo(map);
  });
});
