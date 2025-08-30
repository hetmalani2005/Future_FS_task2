/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface WeatherLocation {
  name: string;
  country: string;
  state: string | null;
  lat: number;
  lon: number;
}

export interface WeatherCurrent {
  temp: number | null;
  humidity: number | null;
  description: string | null;
  icon: string | null;
  feels_like: number | null;
  wind_speed: number | null;
}

export interface WeatherDay {
  date: number | null; // ms epoch
  min: number | null;
  max: number | null;
  description: string | null;
  icon: string | null;
}

export interface WeatherResponse {
  location: WeatherLocation;
  current: WeatherCurrent;
  forecast: WeatherDay[];
}
