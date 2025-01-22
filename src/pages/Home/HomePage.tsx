import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css"; // File CSS riêng để chỉnh giao diện

const HomePage = () => {
  const channel = useRef("HOPT");
  const appid = useRef("dd011e00be554762a1a22e3ac962a2ad");
  const token = useRef(
    "007eJxTYPizWaJjwoMvPzXCfmWeaA9yCa5NZOdJyXwZ36q5SpupV02BwTTNxNw8xTA12dTAzCTZ0sIiydg8NdXYPNnCwMQ8MS0lU6g/vSGQkcH0TywjIwMEgvgsDB7+ASEMDAAwPh4B"
  );
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate("/room", {
      state: {
        channel: channel.current,
        appid: appid.current,
        token: token.current,
      },
    });
  };

  return (
    <div className="home-page">
      <div className="content-container">
        <img src="logo_up.png" alt="Hoang Phuc Thanh Logo" className="logo-image" />
        <div className="text-container">
          <h1>Welcome to Hoang Phuc Thanh Co., LTD</h1>
          <button onClick={handleJoin} className="join-button">
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
