import { useEffect, useState } from "react";
import "./RoomPage.css";
import { createClient, IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack, createMicrophoneAudioTrack, createCameraVideoTrack } from "agora-rtc-sdk-ng";
import RoomControls from "../RoomControll/RoomControls";

const client: IAgoraRTCClient = createClient({ mode: "rtc", codec: "vp8" });

let audioTrack: ILocalAudioTrack | null = null;
let videoTrack: ILocalVideoTrack | null = null;

function RoomPage() {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");

  // Cập nhật danh sách thiết bị
  useEffect(() => {
    async function initializeDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);

        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
      } catch (error) {
        console.error("Error initializing devices:", error);
      }
    }
    initializeDevices();
  }, []);

  // Tạo và quản lý microphone
  const toggleMic = async () => {
    try {
      if (audioTrack) {
        await client.unpublish(audioTrack);  // Unpublish the audio track
        audioTrack.stop();
        audioTrack.close();
        audioTrack = null;
        setIsAudioEnabled(false);  // Set state to false when mic is off
      } else {
        audioTrack = await createMicrophoneAudioTrack({ microphoneId: selectedAudioDevice });
        await client.publish(audioTrack);  // Publish the audio track
        setIsAudioEnabled(true);  // Set state to true when mic is on
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };
  
  const toggleVideo = async () => {
    try {
      if (videoTrack) {
        await client.unpublish(videoTrack);  // Unpublish the video track
        videoTrack.stop();
        videoTrack.close();
        videoTrack = null;
        setIsVideoEnabled(false);  // Set state to false when video is off
      } else {
        videoTrack = await createCameraVideoTrack({ cameraId: selectedVideoDevice });
        videoTrack.play("local-video");
        await client.publish(videoTrack);  // Publish the video track
        setIsVideoEnabled(true);  // Set state to true when video is on
      }
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  };
  

  const sendMessage = () => {
    if (messageInput) {
      setMessages((prev) => [...prev, messageInput]);
      setMessageInput("");
    }
  };

  return (
    <div className="meet-container">
      <div className="video-section">
        <div id="local-video" className="video-tile"></div>
        <div className="remote-video-wrapper" id="remote-video"></div>
      </div>

      <RoomControls
        client={client}
        audioDevices={audioDevices}
        videoDevices={videoDevices}
        selectedAudioDevice={selectedAudioDevice}
        selectedVideoDevice={selectedVideoDevice}
        setSelectedAudioDevice={setSelectedAudioDevice}
        setSelectedVideoDevice={setSelectedVideoDevice}
        toggleMic={toggleMic}
        toggleVideo={toggleVideo}
      />

      <div className="chat-section">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
        <div className="message-list">
          {messages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
