import React, { useRef, useState, useEffect } from 'react';
import { Camera, Square, RefreshCw, UploadCloud, CheckCircle, AlertTriangle, Play, Loader2 } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

interface VideoRecorderProps {
  questionText: string;
  onUploadComplete: (key: string) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ questionText, onUploadComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const [status, setStatus] = useState<'idle' | 'initializing' | 'ready' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timer, setTimer] = useState<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Setup webcam stream
  const initializeCamera = async () => {
    setStatus('initializing');
    setErrorMessage('');
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // prevent feedback loop locally
        videoRef.current.play();
      }
      setStatus('ready');
    } catch (err: any) {
      console.error('Error accessing camera/mic:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Could not access webcam or microphone. Please check permissions.');
    }
  };

  useEffect(() => {
    initializeCamera();
    return () => {
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    setRecordedChunks([]);
    setTimer(0);
    setStatus('recording');

    // Create recorder with constrained bitrate for optimal compression (500 kbps) while keeping facial features distinct.
    const options = {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 500000 // 500kbps as requested
    };

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(streamRef.current, options);
    } catch (e) {
      console.warn('VP9 unsupported, falling back to default codecs');
      recorder = new MediaRecorder(streamRef.current, { videoBitsPerSecond: 500000 });
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      setStatus('stopped');
    };

    mediaRecorderRef.current = recorder;
    recorder.start(1000); // chunk every 1 sec

    timerIntervalRef.current = window.setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadVideo = async () => {
    if (recordedChunks.length === 0) return;
    setStatus('uploading');
    setUploadProgress(10);

    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      
      // 1. Request presigned URL from FastAPI backend
      const res = await fetch(`${API_BASE_URL}/submissions/upload-url`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          filename: `answer_${Date.now()}.webm`,
          content_type: 'video/webm'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve upload target from server.');
      }

      const uploadData = await res.json();
      setUploadProgress(30);

      // Check if backend returned mock or placeholder URL
      if (uploadData.upload_url && !uploadData.upload_url.includes('#reqd key')) {
        // 2. Perform direct upload to S3 compatible Supabase bucket
        const uploadRes = await fetch(uploadData.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': 'video/webm' },
          body: blob
        });

        if (!uploadRes.ok) {
          throw new Error('Storage transmission failed.');
        }
      } else {
        // Simulated local network progress when backend runs in mock mode
        console.warn('Backend is in local mock mode. Simulating upload progress...');
        await new Promise((resolve) => setTimeout(resolve, 800));
        setUploadProgress(60);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setUploadProgress(100);
      setStatus('completed');
      
      // Pass the object key/URL to the completion callback
      onUploadComplete(uploadData.object_key || `uploads/mock_${Date.now()}.webm`);
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Video transmission failed. Try recording again.');
    }
  };

  const retakeVideo = () => {
    setRecordedChunks([]);
    setTimer(0);
    setUploadProgress(0);
    initializeCamera();
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
      {/* Glow Effect Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple via-accentCyan to-accentPink"></div>
      
      <div className="w-full mb-4">
        <span className="text-xs font-semibold text-accentPurple tracking-wider uppercase">Active Prompt</span>
        <h3 className="text-lg font-bold text-gray-100 mt-1">{questionText}</h3>
      </div>

      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-gray-800 flex items-center justify-center">
        {/* HTML5 Live Video View */}
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          autoPlay 
          playsInline 
        />

        {/* Video Overlay Indicators */}
        {status === 'recording' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-950/80 border border-red-500/30 px-3 py-1.5 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse-glow">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            REC • {formatTime(timer)}
          </div>
        )}

        {status === 'ready' && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5" /> Ready
          </div>
        )}

        {status === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-center p-4">
            <Loader2 className="w-10 h-10 text-accentPurple animate-spin mb-3" />
            <p className="text-sm text-gray-300 font-medium">Configuring stream & media pipelines...</p>
            <p className="text-xs text-gray-500 mt-1">Requesting audio/video interface permissions</p>
          </div>
        )}

        {status === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 text-center p-6">
            <UploadCloud className="w-12 h-12 text-accentCyan animate-bounce mb-3" />
            <h4 className="text-md font-bold text-gray-200">Streaming response to Cloudflare R2...</h4>
            <div className="w-64 bg-zinc-800 h-2 rounded-full overflow-hidden mt-4 border border-zinc-700">
              <div 
                className="bg-gradient-to-r from-accentPurple to-accentCyan h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-400 mt-2 font-medium">{uploadProgress}% uploaded</span>
          </div>
        )}

        {status === 'completed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-center p-4">
            <CheckCircle className="w-14 h-14 text-emerald-500 mb-3 animate-bounce" />
            <h4 className="text-lg font-bold text-gray-100">Upload Finalized</h4>
            <p className="text-sm text-gray-400 mt-1">Answer stored securely. Gemini evaluator enqueued.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 text-center p-6">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
            <h4 className="text-md font-bold text-rose-400">Media Pipeline Error</h4>
            <p className="text-xs text-gray-300 max-w-sm mt-2 leading-relaxed">{errorMessage}</p>
            <button 
              onClick={retakeVideo}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-gray-200 transition-colors"
            >
              Reset Connection
            </button>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="w-full mt-6 flex justify-between items-center">
        <div className="text-sm font-semibold text-gray-400">
          {status === 'recording' && `Recording Response...`}
          {status === 'stopped' && `Recording Finalized`}
          {status === 'ready' && `Awaiting Input`}
        </div>

        <div className="flex gap-3">
          {status === 'ready' && (
            <button 
              onClick={startRecording}
              className="glow-btn px-5 py-2.5 bg-gradient-to-r from-accentPurple to-accentPink text-white font-semibold text-sm rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-white" /> Start Capture
            </button>
          )}

          {status === 'recording' && (
            <button 
              onClick={stopRecording}
              className="glow-btn px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition-colors"
            >
              <Square className="w-4 h-4" /> Stop & Finalize
            </button>
          )}

          {status === 'stopped' && (
            <>
              <button 
                onClick={retakeVideo}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-gray-200 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button 
                onClick={uploadVideo}
                className="glow-btn px-5 py-2.5 bg-gradient-to-r from-accentCyan to-accentPurple text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition-all"
              >
                <UploadCloud className="w-4 h-4" /> Upload Interview
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
