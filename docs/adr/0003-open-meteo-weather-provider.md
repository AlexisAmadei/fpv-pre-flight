# Open-Meteo as the weather data provider

We're using Open-Meteo over OpenWeatherMap, WeatherAPI.com, and Tomorrow.io. It's the only researched option providing all required metrics (wind, gusts, UV index, cloud cover, precipitation probability) with no API key to embed or protect in a shipped open-source client, a generous free tier, and global coverage. Its free tier is restricted to non-commercial use, so once published to app stores this will need Open-Meteo's paid commercial plan (still inexpensive, no daily cap) — worth remembering if the API layer is ever touched.
