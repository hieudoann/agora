import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css"; // File CSS riêng để chỉnh giao diện

const HomePage = () => {
  const channel = useRef("user2");
  const appid = useRef("fa3360f045eb4ba78f874de84ebcfda1");
  const token = useRef(
    "007eJxTYPjh9kHji827ot0tjAtcfnA6nIvLs39wNn5GZa161YmdvesUGNISjY3NDNIMTExTk0ySEs0t0izMTVJSLUxSk5LTUhINo9I60hsCGRkc9wkwMjJAIIjPylBanFpkxMAAAPjCITw="
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
