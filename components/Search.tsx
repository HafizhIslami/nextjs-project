"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface Props {
  variant?: "page" | "hero";
}

const Search = ({ variant = "page" }: Props) => {
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState("1");
  const [category, setCategory] = useState("King");
  const router = useRouter();

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const queryString = [
      location && `location=${encodeURIComponent(location)}`,
      guests && `guests=${encodeURIComponent(guests)}`,
      category && `category=${encodeURIComponent(category)}`,
    ]
      .filter(Boolean)
      .join("&");
    router.push(`/?${queryString}`);
  };
  return (
    <div className={variant === "hero" ? "hero-search" : "search-page-shell"}>
      <form className="search-form" onSubmit={submitHandler}>
        {variant === "page" && (
          <div className="search-form-heading">
            <span className="eyebrow">Find your next stay</span>
            <h1>Search rooms</h1>
            <p>Choose a location, group size, and room style.</p>
          </div>
        )}
        <div className="search-fields">
          <div className="search-field search-field-location">
            <label htmlFor={`location_field_${variant}`}>
              Location
            </label>
            <input
              type="text"
              className="form-control"
              id={`location_field_${variant}`}
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              autoComplete="address-level2"
            />
          </div>

          <div className="search-field">
            <label htmlFor={`guest_field_${variant}`}>
              Guests
            </label>
            <select
              className="form-select"
              id={`guest_field_${variant}`}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div className="search-field">
            <label htmlFor={`room_type_field_${variant}`}>
              Room Type
            </label>
            <select
              className="form-select"
              id={`room_type_field_${variant}`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["King", "Single", "Twins"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary-roomi search-submit">
            Search rooms
          </button>
        </div>
      </form>
    </div>
  );
};

export default Search;
