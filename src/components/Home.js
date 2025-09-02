import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Coffee, MapPin } from "lucide-react";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const HomePage = () => {
  const [cafes, setCafes] = useState([]);
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const mapRef = useRef(null);

  // Geolocalização
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLon(pos.coords.longitude);
    });
  }, []);

  // Inicializa mapa
  useEffect(() => {
    if (lat && lon) {
      mapRef.current = L.map("map").setView([lat, lon], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      // Posição do usuário
      L.marker([lat, lon])
        .addTo(mapRef.current)
        .bindPopup("☕ Você está aqui!")
        .openPopup();

      // Busca cafés
      const fetchCafes = async () => {
        try {
          const query = `
[out:json][timeout:25];
(
  nwr(around:1000,${lat},${lon})[amenity=cafe];
  nwr(around:1000,${lat},${lon})[shop=coffee];
);
out center;`;
          const res = await axios.get(
            "https://overpass-api.de/api/interpreter",
            { params: { data: query } }
          );
          setCafes(res.data.elements);
        } catch (err) {
          console.error("Erro ao buscar cafés:", err);
        }
      };

      fetchCafes();

      // Corrige renderização (especialmente em mobile e rotação)
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300);
    }
  }, [lat, lon]);

  // Adiciona marcadores de cafés
  useEffect(() => {
    if (mapRef.current && cafes.length > 0) {
      cafes.forEach((cafe) => {
        if (cafe.lat && cafe.lon) {
          L.marker([cafe.lat, cafe.lon])
            .addTo(mapRef.current)
            .bindPopup(cafe.tags.name || "Café sem nome");
        }
      });
    }
  }, [cafes]);

  // Reajusta mapa ao girar a tela
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 bg-orange-900 text-white shadow-md">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3">
            <Coffee className="h-6 w-6 text-orange-900" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">finderCafé</h1>
        </div>
      </header>

      {/* Hero + Mapa */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <section className="w-full max-w-4xl bg-orange-100 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center mb-6">
            <div className="w-14 h-14 bg-orange-900 rounded-full flex items-center justify-center mb-3 sm:mb-0 sm:mr-3">
              <MapPin className="text-white" size={32} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-orange-900 text-center sm:text-left">
              Encontre cafés perto de você
            </h2>
          </div>

          <p className="text-base sm:text-lg text-gray-700 mb-6 text-center sm:text-left">
            Descubra cafeterias e coffee shops próximos da sua localização em
            tempo real.
          </p>

          {/* Mapa responsivo */}
          <div
            id="map"
            className="w-full h-[65vh] sm:h-[70vh] md:h-[75vh] lg:h-[80vh] rounded-lg border-2 border-orange-300 shadow-md"
          ></div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center p-4 bg-orange-900 text-white text-sm sm:text-base">
        <p>☕ finderCafé © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default HomePage;
