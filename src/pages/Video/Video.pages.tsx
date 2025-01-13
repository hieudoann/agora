import React, { useEffect, useRef, useState } from "react";
import {
  createCameraVideoTrack,
  createClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IAgoraRTCRemoteUser,
  IAgoraRTCClient,
  IRemoteTrack
} from "agora-rtc-sdk-ng/esm";

export default function VideoPage() {
  const [isVideoPubed, setIsVideoPubed] = useState(false);
  const [isVideoSubed, setIsVideoSubed] = useState(false);
  
  const channel = useRef("user");
  const appid = useRef("d6db94477dcb46668b6f7a39e9398d8d");
  const token = useRef("007eJxTYHiWkBOobDwjbXVR96QfXzZEKN8Rn+4vHbrt4pS/xbc+VHUrMKQkGxqkmBumGFkmW5iYJiVbpBkbG5umWJpbWCSZG1mkVGa1pDcEMjJwL2VgZGSAQBCfhaG0OLWIgQEArDkgGQ==");
  const [selectedVideoDevice] = useState<string>(""); // or retrieved from context

  const client: IAgoraRTCClient = createClient({ mode: "rtc", codec: "vp8" });
  let videoTrack: ICameraVideoTrack;
  let audioTrack: IMicrophoneAudioTrack;

  useEffect(() => {
    client.on("user-published", onUserPublish);
    // Join channel automatically for demo
    (async () => {
      try {
        await client.join(appid.current, channel.current, token.current, null);
        // Optional: auto-publish video on load
        await publishVideo();
      } catch (error) {
        console.error("Join error:", error);
      }
    })();
  }, []);

  const onUserPublish = async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
    const remoteTrack = await client.subscribe(user, mediaType);
    if (mediaType === "video") {
      (remoteTrack as IRemoteTrack).play("remote-video");
      setIsVideoSubed(true);
    } else {
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

  const unpublishVideo = async () => {
    if (videoTrack) {
      await client.unpublish(videoTrack);
      setIsVideoPubed(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <div>
        <button onClick={isVideoPubed ? unpublishVideo : publishVideo}>
          {isVideoPubed ? "Unpublish Video" : "Publish Video"}
        </button>
      </div>
      <div>
        <video id="camera-video" hidden={!isVideoPubed} />
        <video id="remote-video" hidden={!isVideoSubed} />
      </div>
    </div>
  );
}