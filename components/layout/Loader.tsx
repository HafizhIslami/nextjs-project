import Image from "next/image";
import React from "react";
import roomiLogo from "../../public/images/roomi_logo.png";

const Loader = () => {
  return (
    <section
      className="roomi-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Roomi is loading available stays"
    >
      <div className="roomi-loader" aria-hidden="true">
        <span className="roomi-loader-ring" />
        <span className="roomi-loader-halo" />
        <Image
          src={roomiLogo}
          alt=""
          className="roomi-loader-logo"
          height={76}
          width={76}
          priority
        />
      </div>
      <div className="roomi-loader-copy">
        <strong>Preparing your stay</strong>
        <span>Finding rooms that feel just right</span>
      </div>
      <span className="visually-hidden">Loading available rooms...</span>
    </section>
  );
};
export default Loader;
