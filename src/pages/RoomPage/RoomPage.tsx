import { useEffect, useRef, useState } from "react";
import "./RoomPage.css";
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng/esm";
import {
  createScreenVideoTrack,
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

const client: IAgoraRTCClient = createClient({ mode: "rtc", codec: "vp8" });
let audioTrack: IMicrophoneAudioTrack;
let videoTrack: ICameraVideoTrack;

function Room() {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [isAudioPubed, setIsAudioPubed] = useState(false);
  const [isVideoPubed, setIsVideoPubed] = useState(false);
  const [isVideoSubed, setIsVideoSubed] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const channel = useRef("HOPT");
  const appid = useRef("f1bbdb459d5c4f808a4e5c879595975b");
  const token = useRef(
    "007eJxTYIhrmsBS8eX59DkVU7yub/8qaJ5wZZbsKhvbSULOwYqeN0wVGNIMk5JSkkxMLVNMk03SLAwsEk1STZMtzC1NgdDcNKllX2t6QyAjw1oDQ1ZGBggE8VkYPPwDQhgYAC37HiA="
  );

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
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
        videoTrack.play("local-video");
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
      return;
    }
    client.on("user-published", onUserPublish);
    try {
      await client.join(appid.current, channel.current, token.current || null);
      setIsJoined(true);
      if (audioTrack) {
        await client.publish(audioTrack);
        setIsAudioPubed(true);
      }
      if (videoTrack) {
        await client.publish(videoTrack);
        videoTrack.play("local-video");
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

  const onUserPublish = async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
    const remoteTrack = await client.subscribe(user, mediaType);
    if (mediaType === "video") {
      remoteTrack.play("remote-video");
      setIsVideoSubed(true);
    } else {
      remoteTrack.play();
    }
  };

  const publishVideo = async () => {
    if (isVideoPubed) {
      await client.unpublish(videoTrack);
      videoTrack.stop();
      setIsVideoPubed(false);
    } else {
      if (!videoTrack) {
        videoTrack = await createCameraVideoTrack({ cameraId: selectedVideoDevice });
      }
      await client.publish(videoTrack);
      videoTrack.play("local-video");
      setIsVideoPubed(true);
    }
  };

  const publishAudio = async () => {
    if (isAudioPubed) {
      await client.unpublish(audioTrack);
      audioTrack.stop();
      setIsAudioPubed(false);
    } else {
      if (!audioTrack) {
        audioTrack = await createMicrophoneAudioTrack({ microphoneId: selectedAudioDevice });
      }
      await client.publish(audioTrack);
      setIsAudioPubed(true);
    }
  };

  return (
    <div className="meet-container">
      {/* Left control panel */}
      <div className="control-panel">
        {/* <h3>Device Selection</h3> */}
        <div className="device-inputs">
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

        {/* <h3>App Info</h3>
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
        <input
          defaultValue={channel.current}
          placeholder="channel"
          onChange={(e) => (channel.current = e.target.value)}
        /> */}

        <div className="buttons">
          <button onClick={joinChannel} className={isJoined ? "active-btn" : ""}>
            {isJoined ? "Leave Channel" : "Join Channel"}
          </button> 
          {isJoined && (
            <>
              <button onClick={publishVideo} className={isVideoPubed ? "active-btn" : ""}>
                {isVideoPubed ? "Unpublish Video" : "Publish Video"}
              </button>
              <button onClick={publishAudio} className={isAudioPubed ? "active-btn" : ""}>
                {isAudioPubed ? "Unpublish Audio" : "Publish Audio"}
              </button>
      <button
        onClick={async () => { 
          try {
            if (videoTrack) {
              await client.unpublish(videoTrack);
              videoTrack.stop();
            }
            const screenTrack = await createScreenVideoTrack();
            await client.publish(screenTrack);
            screenTrack.play('local-video');
            
            screenTrack.on('track-ended', async () => {
              await client.unpublish(screenTrack);
              screenTrack.close();
              if (videoTrack) {
                await client.publish(videoTrack);
                videoTrack.play('local-video');
                setIsVideoPubed(true);
              }
            });
          } catch (error) {
            console.error("Screen sharing failed:", error);
          }
        }}
      >
        Share Screen
      </button>

            </>
          )}
        </div>
      </div>


      {/* Video section */} 
      <div className="video-section"> 
        <div className="local-video-wrapper">
          <video id="local-video" hidden={!isVideoPubed} className="video-tile"></video>
          {!isVideoPubed && <div className="placeholder">Local Video Off</div>}
        </div>
        <div className="remote-video-wrapper">
          <video id="remote-video" hidden={!isVideoSubed} className="video-tile"></video>
          {isJoined && !isVideoSubed && (
            <div className="placeholder waiting">
              You can share channel {channel.current} to others...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Room;