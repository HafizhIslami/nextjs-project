declare module "node-geocoder" {
  interface GeocoderOptions {
    provider?: string;
    apiKey?: string;
    formatter?: string | null;
  }

  interface GeocoderResult {
    longitude?: number;
    latitude?: number;
    formattedAddress?: string;
    city?: string;
    stateCode?: string;
    zipcode?: string;
    countryCode?: string;
  }

  interface Geocoder {
    geocode(address: string): Promise<GeocoderResult[]>;
  }

  const NodeGeocoder: (options: GeocoderOptions) => Geocoder;

  export default NodeGeocoder;
}
