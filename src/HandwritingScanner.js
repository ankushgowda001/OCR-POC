import React, { useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { Upload, Scan } from "lucide-react";
import "./styles.css";

const HandwritingScanner = () => {
    const [image, setImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [extractedText, setExtractedText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExtractEnabled, setIsExtractEnabled] = useState(false);
    const [videoStream, setVideoStream] = useState(null);
    const [videoElement, setVideoElement] = useState(null);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
            setImageFile(file);
            setExtractedText("");
            setIsExtractEnabled(true); // Enable Extract Text button
        }
    };

    // Open camera
    const openCamera = async () => {
        try {
            // Try opening the back camera first
            let constraints = {
                video: { facingMode: "environment" } // Back camera
            };

            let stream = await navigator.mediaDevices.getUserMedia(constraints);
            setIsFrontCamera(false); // Set state to back camera
            setVideoStream(stream);
            setVideoElement(createVideoElement(stream));
        } catch (error) {
            console.warn("Back camera not available, switching to front camera");

            try {
                // If back camera is not available, fallback to front camera
                let constraints = {
                    video: { facingMode: "user" } // Front camera
                };

                let stream = await navigator.mediaDevices.getUserMedia(constraints);
                setIsFrontCamera(true); // Set state to front camera
                setVideoStream(stream);
                setVideoElement(createVideoElement(stream));
            } catch (error) {
                console.error("No available camera:", error);
                alert("No camera available");
            }
        }
    };

    // Helper function to create a video element
    const createVideoElement = (stream) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        return video;
    };

    const captureImage = () => {
        if (!videoElement) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
            setImage(URL.createObjectURL(blob));
            setImageFile(file);
            setExtractedText("");
            setIsExtractEnabled(true);
        }, "image/jpeg");

        videoStream.getTracks().forEach((track) => track.stop());
        setVideoStream(null);
        setVideoElement(null);
    };

    // const processImage = async () => {
    //     if (!imageFile) {
    //         alert("Please upload or capture an image first.");
    //         return;
    //     }

    //     setIsProcessing(true);
    //     setExtractedText("Processing...");

    //     const worker = await createWorker("eng");
    //     const {
    //         data: { text },
    //     } = await worker.recognize(imageFile);
    //     setExtractedText(text);
    //     setIsProcessing(false);
    //     await worker.terminate();
    // };

    const processImage = async () => {
        if (!imageFile) {
            alert("Please upload or capture an image first.");
            return;
        }

        setIsProcessing(true);
        setExtractedText("Processing...");

        // Prepare FormData
        const formData = new FormData();
        formData.append("image", imageFile); // Send the file to API

        try {
            // Replace with your API endpoint
            const response = await fetch("https://13.203.76.160/extract-text", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to extract text");

            const data = await response.json();
            setExtractedText(data.text || "No text extracted");

        } catch (error) {
            console.error("Error extracting text:", error);
            setExtractedText("Failed to extract text.");
        }

        setIsProcessing(false);
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="container">
            {/* Sidebar */}
            {/* <div className="sidebar">
                <h2>HandScan</h2>
                <input type="file" accept="image/*" id="fileInput" onChange={handleFileUpload} hidden />
                <button className="upload-button" onClick={() => document.getElementById("fileInput").click()}>
                    Upload Document
                </button>
                <button className="convert-button" onClick={openCamera} disabled={videoStream !== null}>
                    Scan Document
                </button>
            </div> */}

            <div className="sidebar">
                <h2><span className="hand">Hand</span>Scan</h2>

                {/* Upload Document */}
                <div className="sidebar-option" onClick={handleUploadClick}>
                    <Upload size={32} color="#333" />
                    <p>Upload Document</p>
                </div>

                {/* Scan Document */}
                <div className="sidebar-option" onClick={openCamera} disabled={videoStream !== null}>
                    <Scan size={32} color="#0057B7" />
                    <p>Scan Document</p>
                </div>
            </div>


            {/* Camera Preview */}
            {/* {videoElement && (
                <div className="camera-preview">
                    <video ref={(ref) => ref && (ref.srcObject = videoStream)} autoPlay />
                    <button className="capture-button" onClick={captureImage}>Capture Image</button>
                </div>
            )}

            <div>
                {!videoElement && <div className="upload-box">
                    {image ? <img src={image} alt="Captured or Uploaded" /> : <p>No Image Uploaded</p>}
                </div>}
                {!videoElement && <button className="extract-button" onClick={processImage} disabled={!isExtractEnabled || isProcessing}>
                    {isProcessing ? "Scanning..." : "Extract Text"}
                </button>}
            </div> */}

            <div className="scanner-container">
                {/* Camera Preview */}
                {videoStream && (
                    <div className="camera-preview">
                        <video ref={(ref) => ref && (ref.srcObject = videoStream)} autoPlay />
                        <button className="capture-button" onClick={captureImage}>
                            Capture Image
                        </button>
                    </div>
                )}

                {!videoStream && <div className="scanner-container">
                    {/* Image Upload Box */}
                    <label htmlFor="fileInput" className="upload-box">
                        {image ? (
                            <img
                                src={image}
                                alt="Uploaded Preview"
                                className="uploaded-image"
                                onClick={() => setIsModalOpen(true)}
                            />
                        ) : (
                            <p>Upload Image</p>
                        )}
                    </label>
                    <input type="file" ref={fileInputRef} accept="image/*" id="fileInput" onChange={handleFileUpload} hidden />

                    {/* Convert to Text Button */}
                    <button
                        className="convert-button"
                        onClick={processImage}
                        disabled={!isExtractEnabled || isProcessing}
                    >
                        {isProcessing ? "Scanning..." : "Convert to Text"}
                    </button>
                </div>}

                {/* Start Camera Button */}
                {/* {!videoStream && !image && (
                    <button className="camera-button" onClick={startCamera}>
                        Open Camera
                    </button>
                )} */}
            </div>

            {/* Extracted Text */}
            {!videoElement && <div className="text-box">
                <h3>Extracted Text:</h3>
                <pre>{extractedText || "No text extracted"}</pre>
            </div>}

            {/* {isModalOpen && image && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <img src={image} alt="Full Size Preview" className="modal-image" />
                        <button className="close-button" onClick={() => setIsModalOpen(false)}>X</button>
                    </div>
                </div>
            )} */}
        </div>
    );
};

export default HandwritingScanner;