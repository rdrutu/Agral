export const countyCoords: Record<string, { lat: number, lon: number }> = {
  "Bucuresti": { lat: 44.4268, lon: 26.1025 },
  "Olt": { lat: 44.4300, lon: 24.3600 },
  "Dolj": { lat: 44.3167, lon: 23.8000 },
  "Teleorman": { lat: 43.9667, lon: 25.3333 },
  "Giurgiu": { lat: 43.8833, lon: 25.9667 },
  "Calarasi": { lat: 44.1833, lon: 27.3333 },
  "Constanta": { lat: 44.1807, lon: 28.6343 },
  "Tulcea": { lat: 45.1833, lon: 28.8000 },
  "Braila": { lat: 45.2667, lon: 27.9667 },
  "Galati": { lat: 45.4333, lon: 28.0333 },
  "Vaslui": { lat: 46.6333, lon: 27.7333 },
  "Iasi": { lat: 47.1585, lon: 27.6014 },
  "Botosani": { lat: 47.7500, lon: 26.6667 },
  "Suceava": { lat: 47.6500, lon: 26.2500 },
  "Neamt": { lat: 46.9333, lon: 26.3667 },
  "Bacau": { lat: 46.5667, lon: 26.9000 },
  "Vrancea": { lat: 45.7000, lon: 27.1833 },
  "Buzau": { lat: 45.1500, lon: 26.8167 },
  "Prahova": { lat: 44.9333, lon: 26.0167 },
  "Dambovita": { lat: 44.9333, lon: 25.4500 },
  "Arges": { lat: 44.8500, lon: 24.8667 },
  "Valcea": { lat: 45.1000, lon: 24.3667 },
  "Gorj": { lat: 45.0333, lon: 23.2667 },
  "Mehedinti": { lat: 44.6333, lon: 22.6500 },
  "Caras-Severin": { lat: 45.3000, lon: 21.8833 },
  "Timis": { lat: 45.7500, lon: 21.2333 },
  "Arad": { lat: 46.1833, lon: 21.3167 },
  "Bihor": { lat: 47.0667, lon: 21.9333 },
  "Satu Mare": { lat: 47.8000, lon: 22.8833 },
  "Maramures": { lat: 47.6500, lon: 23.5833 },
  "Salaj": { lat: 47.1833, lon: 23.0500 },
  "Cluj": { lat: 46.7667, lon: 23.5833 },
  "Alba": { lat: 46.0667, lon: 23.5667 },
  "Hunedoara": { lat: 45.8833, lon: 22.9000 },
  "Sibiu": { lat: 45.8000, lon: 24.1500 },
  "Mures": { lat: 46.5500, lon: 24.5667 },
  "Harghita": { lat: 46.3500, lon: 25.8000 },
  "Covasna": { lat: 45.8667, lon: 25.7833 },
  "Brasov": { lat: 45.6500, lon: 25.6000 },
  "Bistrita-Nasaud": { lat: 47.1333, lon: 24.5000 },
};

export async function getWeatherData(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Eroare la preluarea datelor meteo");
  
  return res.json();
}

export function getWeatherDesc(code: number) {
  const codes: Record<number, { desc: string, icon: string }> = {
    0: { desc: "Cer senin", icon: "Sun" },
    1: { desc: "În mare parte senin", icon: "CloudSun" },
    2: { desc: "Parțial noros", icon: "CloudSun" },
    3: { desc: "Noros", icon: "Cloud" },
    45: { desc: "Ceață", icon: "CloudFog" },
    48: { desc: "Ceață depusă", icon: "CloudFog" },
    51: { desc: "Burniță ușoară", icon: "CloudDrizzle" },
    53: { desc: "Burniță moderată", icon: "CloudDrizzle" },
    55: { desc: "Burniță densă", icon: "CloudDrizzle" },
    61: { desc: "Ploaie ușoară", icon: "CloudRain" },
    63: { desc: "Ploaie moderată", icon: "CloudRain" },
    65: { desc: "Ploaie puternică", icon: "CloudRain" },
    71: { desc: "Zăpadă ușoară", icon: "Snowflake" },
    73: { desc: "Zăpadă moderată", icon: "Snowflake" },
    75: { desc: "Zăpadă puternică", icon: "Snowflake" },
    80: { desc: "Averse de ploaie", icon: "CloudRain" },
    95: { desc: "Furtună", icon: "CloudLightning" },
  };
  return codes[code] || { desc: "Variabil", icon: "Cloud" };
}
