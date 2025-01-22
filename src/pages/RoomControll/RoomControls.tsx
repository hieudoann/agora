import React, { useState } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaHandPaper,
  FaHandRock,
  FaPhone,
} from "react-icons/fa";

interface RoomControlsProps {
  client: any;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  setSelectedAudioDevice: (deviceId: string) => void;
  setSelectedVideoDevice: (deviceId: string) => void;
  toggleMic: () => void;
  toggleVideo: () => void;
}

const RoomControls: React.FC<RoomControlsProps> = ({
  client,
  audioDevices,
  videoDevices,
  selectedAudioDevice,
  selectedVideoDevice,
  setSelectedAudioDevice,
  setSelectedVideoDevice,
  toggleMic,
  toggleVideo
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const handleAudioToggle = () => {
    setIsAudioEnabled((prev) => !prev);
    toggleMic();
  };

  const handleVideoToggle = () => {
    setIsVideoEnabled((prev) => !prev);
    toggleVideo();
  };

  const toggleScreenSharing = () => {
    setIsScreenSharing((prev) => !prev);
  };

  const toggleHandRaise = () => {
    setIsHandRaised((prev) => !prev);
  };

  const leaveChannel = async () => {
    await client.leave();
    window.location.href = "/";
  };

  return (
    <div className="control-panel">
      <button onClick={handleAudioToggle} className={isAudioEnabled ? "active" : ""}>
        {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
      </button>
      <button onClick={handleVideoToggle} className={isVideoEnabled ? "active" : ""}>
        {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
      </button>
      <button onClick={toggleScreenSharing} className={isScreenSharing ? "active" : ""}>
        <FaDesktop />
      </button>
      <button onClick={toggleHandRaise} className={isHandRaised ? "hand-raised" : ""}>
        {isHandRaised ? <FaHandRock /> : <FaHandPaper />}
      </button>
      <button onClick={leaveChannel} className="end-button">
        <FaPhone />
        End
      </button>
    </div>
  );
};

export default RoomControls;
