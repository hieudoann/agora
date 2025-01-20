import { useEffect, useRef, useState } from "react";
import "./RoomPage.css";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaCaretDown, FaCaretUp, FaDesktop, FaComment, FaHandPaper, FaHandRock } from "react-icons/fa";
import { createClient, createCameraVideoTrack, createMicrophoneAudioTrack, IAgoraRTCClient, IAgoraRTCRemoteUser, VERSION } from "agora-rtc-sdk-ng/esm";
import { FaPhone } from 'react-icons/fa';

const client: IAgoraRTCClient = createClient({ mode: "rtc", codec: "vp8" });
let audioTrack: any;
let videoTrack: any;
let screenTrack: any;

function Room() {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [activeDeviceMenu, setActiveDeviceMenu] = useState<"audio" | "video" | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("00:00");
  const [meetingLink, setMeetingLink] = useState<string>("");
  const [isHandRaised, setIsHandRaised] = useState(false); // Trạng thái giơ tay
  const meetingLinkRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);


  // Phòng họp link duy nhất
  const generateMeetingLink = () => {
    const link = `${window.location.href}`;
    setMeetingLink(link);
  };

  // Cập nhật thời gian
  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const toggleAudio = async () => {
    if (isAudioEnabled) {
      if (audioTrack) {
        await client.unpublish(audioTrack);
        audioTrack.close();
        audioTrack = undefined;
      }
      setIsAudioEnabled(false);
    } else {
      audioTrack = await createMicrophoneAudioTrack({ microphoneId: selectedAudioDevice });
      await client.publish(audioTrack);
      setIsAudioEnabled(true);
    }
  };

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      if (videoTrack) {
        await client.unpublish(videoTrack);
        videoTrack.stop();
        videoTrack.close();
        videoTrack = undefined;
      }
      setIsVideoEnabled(false);
    } else {
      videoTrack = await createCameraVideoTrack({ cameraId: selectedVideoDevice });
      videoTrack.play("local-video");
      await client.publish(videoTrack);
      setIsVideoEnabled(true);
    }
  };
  const startRecording = async () => {
    try {
      // Kết hợp cả video và audio streams
      const videoStream = videoTrack?.getMediaStream();
      const audioStream = audioTrack?.getMediaStream();
      const combinedStream = new MediaStream([
        ...(videoStream ? videoStream.getVideoTracks() : []),
        ...(audioStream ? audioStream.getAudioTracks() : []),
      ]);
  
      if (combinedStream) {
        mediaRecorderRef.current = new MediaRecorder(combinedStream, {
          mimeType: "video/webm",
        });
  
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };
  
        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
  
      // Sau khi ghi xong, tải xuống video
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      setRecordedChunks([]); // Reset lại
    }
  };
  
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      if (screenTrack) {
        await client.unpublish(screenTrack);
        screenTrack.stop();
        screenTrack.close();
        screenTrack = undefined;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenTrack = await client.createScreenVideoTrack(screenStream);
        await client.publish(screenTrack);
        setIsScreenSharing(true);
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    }
  };

  const joinChannel = async () => {
    if (isJoined) {
      await leaveChannel();
      return;
    }
    client.on("user-published", onUserPublish);
    try {
      await client.join(appid.current, channel.current, token.current || null);
      setIsJoined(true);
    } catch (error) {
      console.error("Join channel error:", error);
    }
  };

  const leaveChannel = async () => {
    setIsJoined(false);
    setIsAudioEnabled(false);
    setIsVideoEnabled(false);
    setIsScreenSharing(false);
    await client.leave();
    if (audioTrack) {
      audioTrack.close();
      audioTrack = undefined;
    }
    if (videoTrack) {
      videoTrack.close();
      videoTrack = undefined;
    }
    if (screenTrack) {
      screenTrack.close();
      screenTrack = undefined;
    }
    window.location.href = "/";
  };

  const onUserPublish = async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
    const remoteTrack = await client.subscribe(user, mediaType);
    if (mediaType === "video") {
      remoteTrack.play("remote-video");
    } else {
      remoteTrack.play();
    }
  };

  const toggleDeviceMenu = (type: "audio" | "video") => {
    setActiveDeviceMenu((prev) => (prev === type ? null : type));
  };

  const selectDevice = (deviceId: string, type: "audio" | "video") => {
    if (type === "audio") {
      setSelectedAudioDevice(deviceId);
    } else {
      setSelectedVideoDevice(deviceId);
    }
    setActiveDeviceMenu(null);
  };

  const sendMessage = () => {
    if (messageInput) {
      setMessages((prevMessages) => [...prevMessages, messageInput]);
      setMessageInput(""); 
    }
  };

  const toggleChatBox = () => {
    setIsChatVisible((prev) => !prev);
  };

  // Hàm giơ tay phát biểu
  const toggleHandRaise = async () => {
    setIsHandRaised((prev) => !prev);
    // Gửi trạng thái giơ tay tới những người tham gia khác (cần thiết lập trong Agora hoặc bằng cách khác)
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (!e.target.closest('.chat-section') && isChatVisible) {
      setIsChatVisible(false);
    }
    if (!e.target.closest('.device-menu') && activeDeviceMenu !== null) {
      setActiveDeviceMenu(null);
    }

    if (meetingLinkRef.current && !meetingLinkRef.current.contains(e.target as Node)) {
      setMeetingLink(""); 
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isChatVisible, activeDeviceMenu, meetingLink]);

  return (
    <div className="meet-container">
      <div className="video-section">
        <div className="local-video-wrapper">
          <div id="local-video" className="video-tile"></div>
        </div>
        <div className="remote-video-wrapper" id="remote-video"></div>
      </div>

      <div className="control-panel">
        <div className="buttons">
          <div className="device-control">
            <button onClick={toggleAudio} className={isAudioEnabled ? "active" : ""}>
              {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            <button onClick={() => toggleDeviceMenu("audio")}>
              {activeDeviceMenu === "audio" ? <FaCaretUp /> : <FaCaretDown />}
            </button>
            {activeDeviceMenu === "audio" && (
              <div className="device-menu">
                {audioDevices.map((device) => (
                  <button key={device.deviceId} onClick={() => selectDevice(device.deviceId, "audio")}>
                    {device.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="device-control">
            <button onClick={toggleVideo} className={isVideoEnabled ? "active" : ""}>
              {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
            </button>
            <button onClick={() => toggleDeviceMenu("video")}>
              {activeDeviceMenu === "video" ? <FaCaretUp /> : <FaCaretDown />}
            </button>
            {activeDeviceMenu === "video" && (
              <div className="device-menu">
                {videoDevices.map((device) => (
                  <button key={device.deviceId} onClick={() => selectDevice(device.deviceId, "video")}>
                    {device.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="device-control">
            <button onClick={toggleScreenSharing} className={isScreenSharing ? "active" : ""}>
              <FaDesktop />
            </button>
          </div>
          <div className="device-control">
            <button
              onClick={toggleHandRaise}
              className={isHandRaised ? "hand-raised" : ""}
            >
              {isHandRaised ? <FaHandRock /> : <FaHandPaper />}
            </button>
          </div>
          <button onClick={leaveChannel} className="end-button">
            <FaPhone style={{ color: 'white' }} />
            End 
          </button>

        </div>
      </div>

      <div className="chat-section">
        <button className="chat-toggle" onClick={toggleChatBox}>
          <FaComment />
        </button>
        {isChatVisible && (
          <div className="chat-box">
            <div className="message-list">
              {messages.map((msg, idx) => (
                <div key={idx} className="message">{msg}</div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>

      {/* Hiển thị Thời gian ở góc trái dưới */}
      <div className="time-display">
        <p>{currentTime}</p>
      </div>

      {/* Hiển thị Link cuộc họp */}
      <div className="meeting-link" ref={meetingLinkRef}>
        <button onClick={generateMeetingLink}>Share Link</button>
        {meetingLink && (
          <div className="meeting-link-display">
            <input
              type="text"
              value={meetingLink}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button onClick={() => navigator.clipboard.writeText(meetingLink)}>
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Room;
