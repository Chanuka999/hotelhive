import React from "react";
import diningImage from "../assets/jetwing-hero.png";

const Dining = () => {
  return (
    <div>
      {/* Full-width hero image section */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <img
          src={diningImage}
          alt="Dining Buffet"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 700,
              marginBottom: "1rem",
              letterSpacing: "2px",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            Dining
          </h1>
          <p
            style={{
              maxWidth: 650,
              fontSize: "1.2rem",
              lineHeight: 1.7,
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
            }}
          >
            Experience world-class dining with a variety of cuisines and a
            luxurious buffet. Enjoy fresh ingredients, live cooking stations,
            and a memorable culinary journey.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dining;

