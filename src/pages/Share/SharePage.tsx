import React, { useState } from 'react';

const SharePage: React.FC = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startScreenShare = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);
        } catch (error) {
            console.error('Error sharing screen:', error);
        }
    };

    const stopScreenShare = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    return (
        <div>
            <h1>Screen Sharing</h1>
            <div>
                {!stream ? (
                    <button onClick={startScreenShare}>Start Sharing</button>
                ) : (
                    <div>
                        <video
                            autoPlay
                            ref={(video) => {
                                if (video && stream) video.srcObject = stream;
                            }}
                            style={{ maxWidth: '100%' }}
                        />
                        <button onClick={stopScreenShare}>Stop Sharing</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharePage;
