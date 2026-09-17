"use client";

import mapboxgl from "mapbox-gl/dist/mapbox-gl.js";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useId, useRef } from "react";

interface Props {
  coordinates: number[];
  address: string;
}

const RoomMap = ({ coordinates, address }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const descriptionId = useId();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token || !mapContainer.current || coordinates.length < 2) return;

    mapboxgl.accessToken = token;
    const center: [number, number] = [coordinates[0], coordinates[1]];
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 12,
    });

    new mapboxgl.Marker({ color: "#9d174d" }).setLngLat(center).addTo(map);

    return () => map.remove();
  }, [coordinates]);

  return (
    <div>
      <p className="visually-hidden" id={descriptionId}>
        Interactive map showing {address}
      </p>
      <div
        ref={mapContainer}
        className="room-map"
        aria-describedby={descriptionId}
      />
    </div>
  );
};

export default RoomMap;
