import { useEffect, useRef, useState } from "react";
import "./App.css";
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng/esm";

import {
  VERSION,
  createClient,
  createCameraVideoTrack,
  createMicrophoneAudioTrack,
  onCameraChanged,
  onMicrophoneChanged,
} from "agora-rtc-sdk-ng/esm";

console.log("Current SDK VERSION: ", VERSION);

onCameraChanged((device) => {
  console.log("onCameraChanged: ", device);
});
onMicrophoneChanged((device) => {
  console.log("onMicrophoneChanged: ", device);
});

const client: IAgoraRTCClient = createClient({
  mode: "rtc",
  codec: "vp8",
});
let audioTrack: IMicrophoneAudioTrack;
let videoTrack: ICameraVideoTrack;

function App() {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [isAudioPubed, setIsAudioPubed] = useState(false);
  const [isVideoPubed, setIsVideoPubed] = useState(false);
  const [isVideoSubed, setIsVideoSubed] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  
  const channel = useRef("user");
  const appid = useRef("d6db94477dcb46668b6f7a39e9398d8d");
  const token = useRef("007eJxTYHiWkBOobDwjbXVR96QfXzZEKN8Rn+4vHbrt4pS/xbc+VHUrMKQkGxqkmBumGFkmW5iYJiVbpBkbG5umWJpbWCSZG1mkVGa1pDcEMjJwL2VgZGSAQBCfhaG0OLWIgQEArDkgGQ==");

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((device) => device.kind === "audioinput");
        const videoInputs = devices.filter((device) => device.kind === "videoinput");
        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);
        if (audioInputs.length > 0) setSelectedAudioDevice(audioInputs[0].deviceId);
        if (videoInputs.length > 0) setSelectedVideoDevice(videoInputs[0].deviceId);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    }
    getDevices();
  }, []);

  const handleAudioChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedAudioDevice(deviceId);
    if (audioTrack) {
      await audioTrack.setDevice(deviceId);
    } else {
      audioTrack = await createMicrophoneAudioTrack({ microphoneId: deviceId });
      if (isJoined) {
        await client.publish(audioTrack);
        setIsAudioPubed(true);
      }
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedVideoDevice(deviceId);
    if (videoTrack) {
      await videoTrack.setDevice(deviceId);
    } else {
      videoTrack = await createCameraVideoTrack({ cameraId: deviceId });
      if (isJoined) {
        await client.publish(videoTrack);
        videoTrack.play("camera-video");
        setIsVideoPubed(true);
      }
    }
  };

  const joinChannel = async () => {
    if (!channel.current) {
      channel.current = "react-room";
    }

    if (isJoined) {
      await leaveChannel();
    }

    client.on("user-published", onUserPublish);

    try {
      await client.join(appid.current, channel.current, token.current || null, null);
      setIsJoined(true);
      if (audioTrack) {
        await client.publish(audioTrack);
        setIsAudioPubed(true);
      }
      if (videoTrack) {
        await client.publish(videoTrack);
        videoTrack.play("camera-video");
        setIsVideoPubed(true);
      }
    } catch (error) {
      console.error("Join channel error:", error);
    }
  };

  const leaveChannel = async () => {
    setIsJoined(false);
    setIsAudioPubed(false);
    setIsVideoPubed(false);

    await client.leave();
    if (audioTrack) {
      audioTrack.close();
      audioTrack = undefined as any;
    }
    if (videoTrack) {
      videoTrack.close();
      videoTrack = undefined as any;
    }
  };

  const onUserPublish = async (
    user: IAgoraRTCRemoteUser,
    mediaType: "video" | "audio"
  ) => {
    if (mediaType === "video") {
      const remoteTrack = await client.subscribe(user, mediaType);
      remoteTrack.play("remote-video");
      setIsVideoSubed(true);
    }
    if (mediaType === "audio") {
      const remoteTrack = await client.subscribe(user, mediaType);
      remoteTrack.play();
    }
  };

  const publishVideo = async () => {
    if (!videoTrack) {
      videoTrack = await createCameraVideoTrack({ cameraId: selectedVideoDevice });
    }
    await client.publish(videoTrack);
    videoTrack.play("camera-video");
    setIsVideoPubed(true);
  };

  const publishAudio = async () => {
    if (!audioTrack) {
      audioTrack = await createMicrophoneAudioTrack({ microphoneId: selectedAudioDevice });
    }
    await client.publish(audioTrack);
    setIsAudioPubed(true);
  };

  return (
    <>
      <div className="left-side">
        <h3>Select your camera and microphone:</h3>
        <div className="device-selection">
          <label>
            Microphone:
            <select value={selectedAudioDevice} onChange={handleAudioChange}>
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            Camera:
            <select value={selectedVideoDevice} onChange={handleVideoChange}>
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId}`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <h3>
          {`Please input the appid and token (`}
          <a href="https://www.agora.io/en/blog/how-to-get-started-with-agora">
            Create an account.
          </a>
          {`) `}
        </h3>
        <input
          defaultValue={appid.current}
          placeholder="appid"
          onChange={(e) => (appid.current = e.target.value)}
        />
        <input
          defaultValue={token.current}
          placeholder="token"
          onChange={(e) => (token.current = e.target.value)}
        />
        <h3>Please input the channel name</h3>
        <input
          defaultValue={channel.current}
          onChange={(e) => (channel.current = e.target.value)}
        />
        <div className="buttons">
          <button onClick={joinChannel} className={isJoined ? "button-on" : ""}>
            {isJoined ? "Leave Channel" : "Join Channel"}
          </button>
          {isJoined && (
            <>
              <button
                onClick={publishVideo}
                className={isVideoPubed ? "button-on" : ""}
              >
                {isVideoPubed ? "Unpublish Video" : "Publish Video"}
              </button>
              <button
                onClick={publishAudio}
                className={isAudioPubed ? "button-on" : ""}
              >
                {isAudioPubed ? "Unpublish Audio" : "Publish Audio"}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="right-side">
        <video id="camera-video" hidden={!isVideoPubed}></video>
        <video id="remote-video" hidden={!isVideoSubed}></video>
        {isJoined && !isVideoSubed && (
          <div className="waiting">
            You can share channel {channel.current} to others.....
          </div>
        )}
      </div>
    </>
  );
}

export default App;