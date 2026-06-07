import React, { useState, useRef, useEffect } from 'react';
import { Questionnaire, GeneratedScript, AppStep, ScriptLine } from './types';
import QuestionnaireForm from './components/QuestionnaireForm';
import ScriptViewer from './components/ScriptViewer';
import IsraeliFlag from './components/IsraeliFlag';
import PortalView from './components/PortalView';
import { AmbientSynth } from './utils/audioSynth';
import { 
  Video, 
  VideoOff, 
  Camera, 
  RotateCw, 
  Play, 
  Pause, 
  Square, 
  Check, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Download, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Music, 
  CheckCircle,
  HelpCircle,
  Heart,
  Share2,
  Shield,
  Clock,
  MessageSquare,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // App navigation state
  const [step, setStep] = useState<AppStep>('PORTAL');

  // Interactive Gate states
  const [gateAnswer, setGateAnswer] = useState<'yes' | 'no' | null>(null);
  const [selectedGateOption, setSelectedGateOption] = useState<'share' | 'create' | null>(null);

  const [questionnaire, setQuestionnaire] = useState<Questionnaire>({
    speakerName: '',
    speakerGender: 'male',
    relationshipType: 'son',
    lostPersonName: '',
    customRelationshipText: '',
    personalConnection: '',
    storyContext: '',
    emotionalImpact: '',
    callToAction: '',
  });
  
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Video recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [prompterSpeed, setPrompterSpeed] = useState<number>(1.0); // Default to comfortable standard speed (1.0x)
  const [recordedSpeed, setRecordedSpeed] = useState<number>(1.0);
  const [copiedPost, setCopiedPost] = useState<boolean>(false);

  // Web camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalIdRef = useRef<any>(null);

  // Audio Context and Ambient Synth refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthStopFnRef = useRef<(() => void) | null>(null);
  const synthGainNodeRef = useRef<GainNode | null>(null);

  // Simulated (Mock Mode) Canvas capture variables
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mockAnimationIdRef = useRef<number | null>(null);
  const unifiedAnimationIdRef = useRef<number | null>(null);
  
  // High-fidelity recording composition variables
  const isEndingPhaseRef = useRef<boolean>(false);
  const endingSecondsLeftRef = useRef<number>(0);
  const [isRecordingEnding, setIsRecordingEnding] = useState<boolean>(false);

  // Synchronized refs to avoid stale closures in requestAnimationFrame loop
  const currentPromptIndexRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const scriptRef = useRef<any>(null);
  const isMockModeRef = useRef<boolean>(false);

  // Subtitle/Slogan dynamic overlay state in preview player
  const [previewTime, setPreviewTime] = useState<number>(0);
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(false);
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);
  const [shareTip, setShareTip] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Total duration of current script setup, scaled for prompter pace
  const totalScriptDuration = script 
    ? Math.round(script.lines.reduce((sum, line) => sum + line.durationSeconds, 0) / prompterSpeed)
    : 25;

  // Cleanup side effects on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSynth();
      if (mockAnimationIdRef.current) {
        cancelAnimationFrame(mockAnimationIdRef.current);
      }
      if (unifiedAnimationIdRef.current) {
        cancelAnimationFrame(unifiedAnimationIdRef.current);
      }
    };
  }, []);

  // Simple Hash-based Router
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/create' || hash.includes('create')) {
        setStep('QUESTIONNAIRE');
        setSelectedGateOption('create');
      } else if (hash === '#/portal' || hash === '' || hash === '#/') {
        setStep('PORTAL');
      }
    };

    // Run on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Web Audio Context initialization
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Start Ambient Music Synthesizer
  const startSynth = () => {
    try {
      initAudioCtx();
      if (!audioCtxRef.current) return;

      const synth = new AmbientSynth();
      const { gain, start, stop } = synth.createSynthNode(audioCtxRef.current);
      
      synthGainNodeRef.current = gain;
      synthStopFnRef.current = stop;

      // Unmute/mute control Node
      if (isMuted) {
        gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      } else {
        gain.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
      }

      // Connect to normal output speakers
      gain.connect(audioCtxRef.current.destination);
      start();
      console.log('Ambient synthesizer started successfully.');
    } catch (e) {
      console.error('Failed to start ambient synth:', e);
    }
  };

  // Stop synthesizer
  const stopSynth = () => {
    if (synthStopFnRef.current) {
      synthStopFnRef.current();
      synthStopFnRef.current = null;
    }
    synthGainNodeRef.current = null;
  };

  // Toggle ambient live level during recording/playback
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (synthGainNodeRef.current && audioCtxRef.current) {
      const targetVolume = nextMuted ? 0 : 0.12;
      synthGainNodeRef.current.gain.linearRampToValueAtTime(targetVolume, audioCtxRef.current.currentTime + 0.3);
    }
  };

  // Trigger Gemini API Request on server
  const handleQuestionnaireSubmit = async (data: Questionnaire) => {
    setQuestionnaire(data);
    setIsGenerating(true);
    setStep('GENERATING');
    setError(null);

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`שגיאת שרת: ${response.status} - לא ניתן לייצר תסריט איכותי כעת.`);
      }

      const scriptData: GeneratedScript = await response.json();
      setScript(scriptData);
      setStep('SCRIPT_PREVIEW');
    } catch (err: any) {
      console.error('Error generating script:', err);
      setError(err?.message || 'ארעה שגיאה בחיבור לעוזר הראשי של AI. אנא נסה שוב.');
      setStep('QUESTIONNAIRE');
    } finally {
      setIsGenerating(false);
    }
  };

  // Confirm script and open camera view
  const handleScriptConfirm = (finalScript: GeneratedScript) => {
    setScript(finalScript);
    setError(null);
    setStep('RECORDING');
    // Start standard webcam stream config
    setTimeout(() => {
      startCamera(facingMode);
    }, 100);
  };

  // Return to Questionnaire for regeneration
  const handleRegenerate = () => {
    setStep('QUESTIONNAIRE');
  };

  // Setup User Camera Connection
  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    setError(null);
    setIsMockMode(false);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Play interrupted on mount", e));
      }
    } catch (err: any) {
      console.warn("Camera hardware not available or permission denied. Falling back to simulator mode.", err);
      setIsMockMode(true);
    }
  };

  // Stop camera streams
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle dynamic camera side
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (!isMockMode) {
      startCamera(nextMode);
    }
  };

  // Unified high-fidelity Canvas Compositing and Rendering Loop
  const startUnifiedCanvasLoop = () => {
    if (unifiedAnimationIdRef.current) {
      cancelAnimationFrame(unifiedAnimationIdRef.current);
    }

    let angle = 0;
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        unifiedAnimationIdRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        unifiedAnimationIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Enforce high-definition 1280x720 resolution on the canvas for crystal-clear exports
      if (canvas.width !== 1280 || canvas.height !== 720) {
        canvas.width = 1280;
        canvas.height = 720;
      }

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw central background/camera feed
      if (isEndingPhaseRef.current) {
        // ---- CINEMATIC OUTRO SEQUENCE ----
        // Draw deep vibrant blue background matching the Israel flag motif
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, w, h);

        // Radial lighting overlay
        const radSloganGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w / 1.1);
        radSloganGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        radSloganGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = radSloganGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw centered glowing premium slogan text
        ctx.font = '900 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText('משפחה וחברים לפני הקול', w / 2 + 3, h / 2 + 3);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText('משפחה וחברים לפני הקול', w / 2, h / 2);
      } else if (!isMockModeRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        // ----- CAMERA VIEWPORT -----
        // Draw standard webcam footage mirrored horizontally so it is user-safe (selfie mode)
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        ctx.restore();
      } else {
        // ----- MOCK FEED -----
        // Create premium modern backplate for design-rigor
        const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w/1.2);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, w - 80, h - 80);

        ctx.beginPath();
        ctx.arc(w/2, h/2 - 20, 75, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(w/2, h/2 + 130, 130, 90, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fill();
        ctx.stroke();

        angle += 0.05;
        const pulse = Math.abs(Math.sin(angle)) * 30 + 10;
        ctx.beginPath();
        ctx.arc(w - 60, 60, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fill();

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText('🔴 סימולטור מצלמה מופעל', w/2, 60);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('כדי לצלם סרטון אמיתי, אנא אשר את המצלמה שלך בדפדפן', w/2, h - 60);
      }

      // 2. ALWAYS DRAW THE WATERMARK NATIONAL ISRAELI FLAG
      // Standard flag aspect ratio w=54, h=37 with Magen David inside the footage!
      const flagW = 56;
      const flagH = 38.5;
      const flagX = w - 240;
      const flagY = 28;

      // Draw Flag White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(flagX, flagY, flagW, flagH);

      // Draw standard Flag Blue Borders (Top & Bottom bars)
      const barH = flagH * 0.15;
      ctx.fillStyle = '#0038b8';
      ctx.fillRect(flagX, flagY, flagW, barH);
      ctx.fillRect(flagX, flagY + flagH - barH, flagW, barH);

      // Draw overlapping triangles in center for Magen David structure
      const mX = flagX + flagW / 2;
      const mY = flagY + flagH / 2;
      const mR = flagH * 0.18;
      ctx.strokeStyle = '#0038b8';
      ctx.lineWidth = 1.8;

      const drawTriangle = (cx: number, cy: number, radius: number, invert: boolean) => {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const t = (i * 2 * Math.PI / 3) + (invert ? Math.PI : -Math.PI / 2);
          const px = cx + radius * Math.cos(t);
          const py = cy + radius * Math.sin(t);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      };

      drawTriangle(mX, mY, mR, false);
      drawTriangle(mX, mY, mR, true);

      // Waving Flag Watermark accompanying slogan text in the canvas frame
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'right';
      ctx.fillText('משפחה וחברים לפני הקול', flagX - 12, mY + 5);

      // 3. DRAW EXPORTABLE LIVE RUNNING SUBTITLE DIRECTLY INTO CANVAS STREAM
      if (isRecordingRef.current && !isEndingPhaseRef.current) {
        const lines = scriptRef.current && scriptRef.current.lines ? scriptRef.current.lines : [];
        const currentIdx = currentPromptIndexRef.current;
        const activeText = lines[currentIdx] ? lines[currentIdx].text : '';

        if (activeText) {
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';

          // Measure subtitle bounds to fit a perfect dark pill shape backplate behind it
          const textMetric = ctx.measureText(activeText);
          const backW = textMetric.width + 50;
          const backH = 50;
          const backX = w / 2 - backW / 2;
          const backY = h - 90;

          // Draw Rounded Rect pill
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(backX, backY, backW, backH, 14);
          } else {
            ctx.rect(backX, backY, backW, backH);
          }
          ctx.fill();

          // Write dynamic subtitles text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`"${activeText}"`, w / 2, backY + backH / 2 + 8);
        }
      }

      unifiedAnimationIdRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Run the Unified Canvas Loop automatically whenever recording is initiated
  useEffect(() => {
    if (step === 'RECORDING') {
      const initLoopTimeout = setTimeout(() => {
        startUnifiedCanvasLoop();
      }, 150);
      return () => {
        clearTimeout(initLoopTimeout);
        if (unifiedAnimationIdRef.current) {
          cancelAnimationFrame(unifiedAnimationIdRef.current);
          unifiedAnimationIdRef.current = null;
        }
      };
    } else {
      if (unifiedAnimationIdRef.current) {
        cancelAnimationFrame(unifiedAnimationIdRef.current);
        unifiedAnimationIdRef.current = null;
      }
    }
  }, [step]);

  // Helper to find a fully compatible mime type for the user's browser
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return 'video/webm';
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  // Recording Start (Handles mixed audio capture and composited high-fidelity canvas stream)
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedVideoUrl(null);
    setRecordingDuration(0);
    setCurrentPromptIndex(0);
    setIsRecordingEnding(false);
    isEndingPhaseRef.current = false;
    endingSecondsLeftRef.current = 0;
    recordedChunksRef.current = [];

    // Save the speed at the beginning of recording so the playback matches perfectly
    setRecordedSpeed(prompterSpeed);

    // Trigger Ambient Music and Audio setup on user interaction
    startSynth();

    // Setup progressive teleprompter line highlights
    let scriptIdx = 0;
    let linePassedSeconds = 0;

    intervalIdRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const nextTime = prev + 1;

        // If the ending/outro sequence is currently playing, decrement the clock until final closure
        if (isEndingPhaseRef.current) {
          if (endingSecondsLeftRef.current <= 1) {
            handleStopRecording();
          } else {
            endingSecondsLeftRef.current--;
          }
          return nextTime;
        }
        
        // Progress prompt based on individual script line timings scaled by the custom speed modifier chosen by user
        if (script && script.lines && script.lines[scriptIdx]) {
          linePassedSeconds++;
          const currentMaxSeconds = Math.round(script.lines[scriptIdx].durationSeconds / prompterSpeed);
          
          if (linePassedSeconds >= currentMaxSeconds) {
            if (scriptIdx < script.lines.length - 1) {
              scriptIdx++;
              setCurrentPromptIndex(scriptIdx);
              linePassedSeconds = 0;
            } else {
              // Instead of immediately stopping the recording, let's run the cinematic Outro inside the video stream for 4 seconds!
              isEndingPhaseRef.current = true;
              setIsRecordingEnding(true);
              endingSecondsLeftRef.current = 4;
              setCurrentPromptIndex(script.lines.length); // highlights the final slogan visually
            }
          }
        } else {
          // Fallback timer if no lines exist
          if (nextTime >= totalScriptDuration) {
            isEndingPhaseRef.current = true;
            setIsRecordingEnding(true);
            endingSecondsLeftRef.current = 4;
          }
        }
        return nextTime;
      });
    }, 1000);

    const activeMimeType = getSupportedMimeType();

    // Audio context mixing setup for recording
    try {
      const canvas = canvasRef.current;
      if (canvas) {
        // Capture a standard smooth 25fps video stream from the compositing canvas
        const canvasStream = (canvas as any).captureStream(25);
        
        // Initialize background synthesizer mixing context
        initAudioCtx();
        if (audioCtxRef.current) {
          const synthDest = audioCtxRef.current.createMediaStreamDestination();

          // Connect user's microphone to the audio stream in real camera mode
          if (!isMockModeRef.current && streamRef.current && streamRef.current.getAudioTracks().length > 0) {
            const micSource = audioCtxRef.current.createMediaStreamSource(streamRef.current);
            micSource.connect(synthDest);
          }

          // Always connect the background synthesized guitar/sound pad to the recording
          if (synthGainNodeRef.current) {
            synthGainNodeRef.current.connect(synthDest);
          }

          // Merge composited video tracks and blended audio tracks
          const tracks = [
            ...canvasStream.getVideoTracks(),
            ...synthDest.stream.getAudioTracks()
          ];

          const mixedStream = new MediaStream(tracks);
          const recorder = new MediaRecorder(mixedStream, activeMimeType ? { mimeType: activeMimeType } : undefined);
          
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            const videoBlob = new Blob(recordedChunksRef.current, { type: activeMimeType || 'video/webm' });
            const url = URL.createObjectURL(videoBlob);
            setRecordedVideoUrl(url);
          };

          mediaRecorderRef.current = recorder;
          recorder.start(100);
        }
      }
    } catch (recorderError) {
      console.error("Recording initialization failed, fallback to simulated flow", recorderError);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    setIsRecording(false);
    stopSynth();
    
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    stopCamera();
    
    // Stop mock animation loop
    if (mockAnimationIdRef.current) {
      cancelAnimationFrame(mockAnimationIdRef.current);
      mockAnimationIdRef.current = null;
    }

    // Go directly to player view
    setStep('PLAYER_PREVIEW');
  };

  // Restart live recording phase
  const handleRetryRecording = () => {
    setRecordedVideoUrl(null);
    setStep('RECORDING');
    setIsRecording(false);
    setTimeout(() => {
      startCamera(facingMode);
    }, 100);
  };

  // Safe file downloader for created final WebM/MP4 product
  const downloadVideo = () => {
    if (!recordedVideoUrl) return;
    const activeMimeType = getSupportedMimeType();
    const extension = activeMimeType.includes('mp4') ? 'mp4' : 'webm';
    
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    a.download = `סרטון_מתחייבים_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Track video index overlay positions during playing
  const handlePlayerTimeUpdate = () => {
    if (previewVideoRef.current) {
      const video = previewVideoRef.current;
      setPreviewTime(video.currentTime);
      
      const isPastLimit = (video.duration && isFinite(video.duration) && video.currentTime >= video.duration - 0.3) ||
                          (recordingDuration && video.currentTime >= recordingDuration - 0.3) ||
                          video.ended;
      
      if (isPastLimit) {
        setIsVideoEnded(true);
      }
    }
  };

  // Helper: return active text segment matching target play timestamp
  const getSubtitleAtTime = (secs: number) => {
    if (!script || !script.lines) return '';
    let accumulatedTime = 0;
    
    for (const line of script.lines) {
      const start = accumulatedTime;
      const end = accumulatedTime + (line.durationSeconds / recordedSpeed);
      if (secs >= start && secs < end) {
        return line.text;
      }
      accumulatedTime = end;
    }
    return '';
  };

  // Check if player timestamp has reached the final emotional closing section
  const isPostScriptTime = (secs: number) => {
    if (isVideoEnded) return true;
    if (!script || !script.lines) return false;
    const totalLinesTime = script.lines.reduce((acc, l) => acc + (l.durationSeconds / recordedSpeed), 0);
    // Render final slides if video has advanced past the lines duration
    return secs >= totalLinesTime || (previewVideoRef.current && previewVideoRef.current.ended);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none overflow-x-hidden text-right text-gray-800" dir="rtl">
      
      {/* HEADER BAR - Beautiful Israeli White & Blue Theme */}
      <header className="bg-white border-b border-blue-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm z-10 transition-all">
        <div 
          onClick={() => {
            window.location.hash = '#/';
            setStep('PORTAL');
          }}
          className="flex items-center gap-3 cursor-pointer select-none active:scale-98 transition-transform"
        >
          {/* Beautiful dynamic Israeli Flag graphic next to app brand styling */}
          <IsraeliFlag className="w-11 h-8 shadow-xs border border-blue-200" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-1.5 animate-pulse">
              <span>מתחייבים</span>
            </h1>
          </div>
        </div>

        {/* Beautiful Navigation Tracker or Category Links */}
        {step === 'PORTAL' ? (
          <nav className="flex items-center gap-4 sm:gap-6 text-xs">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/';
                setStep('PORTAL');
              }}
              className="px-4 py-2 bg-blue-50 text-isr-blue border border-blue-150 rounded-xl font-black shadow-xs cursor-pointer"
            >
              הפורטל הארצי 🏠
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/create';
                setStep('QUESTIONNAIRE');
                setSelectedGateOption('create');
              }}
              className="px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer font-black border border-transparent hover:border-slate-200"
            >
              יוצר סרטון ופוסט (AI) 🎥
            </button>
          </nav>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/';
                setStep('PORTAL');
              }}
              className="text-xs font-black underline text-slate-500 hover:text-slate-800 cursor-pointer ml-4 hover:scale-101 transition-all"
            >
              חזרה לפורטל הראשי 🏠
            </button>

            {/* Step Wizard indicator */}
            <nav className="flex items-center gap-4 text-xs font-bold sm:gap-6">
              <div 
                onClick={() => {
                  if (step !== 'QUESTIONNAIRE') {
                    setStep('QUESTIONNAIRE');
                    setSelectedGateOption('create');
                  }
                }}
                className={`flex flex-col items-center transition-opacity cursor-pointer ${step === 'QUESTIONNAIRE' ? 'border-b-2 border-isr-blue pb-1 font-black text-isr-blue' : 'opacity-50 hover:opacity-100'}`}
              >
                <span className="text-[8px] font-black uppercase tracking-wider block text-center">שלב 1</span>
                <span>הפרטים</span>
              </div>
              
              <div className={`flex flex-col items-center transition-opacity ${step === 'GENERATING' || step === 'SCRIPT_PREVIEW' ? 'border-b-2 border-isr-blue pb-1 font-black text-isr-blue' : 'opacity-40 font-bold'}`}>
                <span className="text-[8px] font-black uppercase tracking-wider block text-center">שלב 2</span>
                <span>התסריט</span>
              </div>

              <div className={`flex flex-col items-center transition-opacity ${step === 'RECORDING' ? 'border-b-2 border-isr-blue pb-1 font-black text-isr-blue' : 'opacity-40 font-bold'}`}>
                <span className="text-[8px] font-black uppercase tracking-wider block text-center">שלב 3</span>
                <span>צילום</span>
              </div>

              <div className={`flex flex-col items-center transition-opacity ${step === 'PLAYER_PREVIEW' ? 'border-b-2 border-isr-blue pb-1 font-black text-isr-blue' : 'opacity-50 font-bold'}`}>
                <span className="text-[8px] font-black uppercase tracking-wider block text-center">שלב 4</span>
                <span>התוצאה</span>
              </div>
            </nav>
          </div>
        )}

        <div>
          <span className="text-xs font-black px-3 py-1.5 bg-blue-50 text-isr-blue rounded-xl border border-blue-100 block sm:inline">
            משפחה וחברים לפני הקול
          </span>
        </div>
      </header>

      {/* ERROR WORKSPACE NOTIFIER */}
      {error && (
        <div className="p-4 mx-auto max-w-4xl w-full mt-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-800 gap-4 text-sm" id="error-alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setError(null)} 
            className="text-red-500 hover:text-red-800 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* CORE SCREENS VIEWPORTS */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col justify-center">
        
        <AnimatePresence mode="wait">
          
          {/* PORTAL HOME STEP */}
          {step === 'PORTAL' && (
            <motion.div
              key="portal-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <PortalView 
                onStartCreation={() => {
                   setStep('QUESTIONNAIRE');
                }}
                onSelectOption={(option) => {
                   setSelectedGateOption(option);
                }}
              />
            </motion.div>
          )}

          {/* STEP 1: Questionnaire state */}
          {step === 'QUESTIONNAIRE' && (
            <motion.div
              key="questionnaire-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1.5 bg-blue-50 text-isr-blue rounded-full font-black text-xs tracking-wider uppercase mb-3 border border-blue-100">
                  "לא מצביעים למי שהיה שם"
                </span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl">
                  מתחייבים לכבד את מי שסובל.
                </h2>
                <p className="max-w-2xl mx-auto text-gray-500 text-sm sm:text-base mt-2.5 leading-relaxed font-semibold">
                  גם בזמנים של מתיחות פוליטית, יש גבול. כולנו מתחייבים לא להצביע לאף שר או חבר כנסת שהיה חלק ממשלת ה-7 באוקטובר. כאן נעזור לכם ליצור סרטון אישי עבור בני המשפחה שלכם, החברים והדורות הבאים ובו אתם מוזמנים להתחייב: יש לנו גבול. לא נצביע לאף אחד שר או חבר כנסת שהיה חלק ממשלת ה-7 באוקטובר.
                </p>
              </div>

              {/* INTERACTIVE FUNNEL GATE */}
              {selectedGateOption !== 'create' && (
                <div className="max-w-3xl mx-auto mb-10" id="funnel-gate-card">
                  <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 sm:p-8 shadow-md text-right relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -z-10 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -z-10 animate-pulse"></div>
                    
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 flex items-center gap-3 justify-end leading-tight">
                      <span>האם חשוב לכם שמי שהיה בממשלה לא יקבל את קולותינו שוב?</span>
                    </h3>
                    
                    <div className="flex flex-wrap sm:flex-nowrap gap-4 justify-end mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setGateAnswer('yes');
                          setError(null);
                        }}
                        className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                          gateAnswer === 'yes'
                            ? 'bg-isr-blue border-isr-blue text-white ring-4 ring-blue-150'
                            : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                        }`}
                        id="gate-btn-yes"
                      >
                        <span>כן, זה חשוב</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setGateAnswer('no');
                          setSelectedGateOption(null);
                          setError(null);
                        }}
                        className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                          gateAnswer === 'no'
                            ? 'bg-red-50 text-red-700 border-red-200 ring-4 ring-red-50'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                        id="gate-btn-no"
                      >
                        <span>לא</span>
                      </button>
                    </div>

                    {/* IF CHOSE NO */}
                    {gateAnswer === 'no' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-600 text-sm leading-relaxed"
                      >
                        <p className="font-bold mb-3">תודה על תשובתך.</p>
                        <p className="mb-4">מישק זה מיועד לקדם התחייבות ערכית של אלה המעוניינים לתבוע לקיחת אחריות מהמנהיגות על מחדלי ה-7 באוקטובר.</p>
                        <button
                          type="button"
                          onClick={() => setGateAnswer('yes')}
                          className="text-isr-blue hover:text-blue-800 font-extrabold text-sm underline cursor-pointer flex items-center gap-1.5 justify-end"
                        >
                          אני רוצה להשתתף בכל זאת
                        </button>
                      </motion.div>
                    )}

                    {/* IF CHOSE YES */}
                    {gateAnswer === 'yes' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 pt-6 border-t border-gray-100 text-right"
                        id="gate-options-container"
                      >
                        <h4 className="text-lg font-black text-blue-900 mb-2">אז בואו לעזור להפיץ את הבשורה.</h4>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">שתי אפשרויות לפניכם:</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
                          {/* OPTION 1: SHARE WITH FRIEND */}
                          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/20 border border-emerald-100 rounded-2.5xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-right">
                            <div className="text-right">
                              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3 text-emerald-600 mr-auto ml-0 sm:ml-auto sm:mr-0">
                                <MessageSquare className="w-5 h-5" />
                              </div>
                              <h5 className="font-extrabold text-gray-900 text-base mb-1.5">שתף עם מישהו שנפגע / חבר</h5>
                              <p className="text-gray-500 text-xs leading-relaxed mb-4">שתפו את קישור המיזם ישירות ב-WhatsApp עם חברים או קרובים כדי לחבר עוד אזרחים למחויבות.</p>
                            </div>
                            
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                "היי, אני רוצה לשתף איתך יוזמה אזרחית חשובה ביותר. מתחייבים לכבוד מי שסובל ולא נותנים את הקול למי שהיה בממשלה. כאן אפשר ליצור סרטון אישי משפיע או להפיץ בקלות: https://ais-pre-qbakitjszqkjx6qfp5hyns-586444813259.us-east1.run.app"
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                            >
                              <MessageSquare className="w-4 h-4" />
                              שתף קישור ב-WhatsApp 💬
                            </a>
                          </div>

                          {/* OPTION 2: CREATE VIDEO */}
                          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/20 border border-blue-100 rounded-2.5xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-right">
                            <div className="text-right">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 text-isr-blue mr-auto ml-0 sm:ml-auto sm:mr-0">
                                <Video className="w-5 h-5" />
                              </div>
                              <h5 className="font-extrabold text-gray-900 text-base mb-1.5">שתף סרטון או טקסט על איך נפגעת</h5>
                              <p className="text-gray-500 text-xs leading-relaxed mb-4">ספרו את סיפורכם האישי ותעזרו בבינה מלאכותית בכדי לנסח את הסיפור שלכם, לצלם סרטון וידאו מעורר השראה ולבקש מחויבות.</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGateOption('create');
                              }}
                              className="w-full py-3 px-4 bg-isr-blue hover:bg-blue-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Video className="w-4 h-4" />
                              שתף סרטון או טקסט 🎥
                            </button>
                          </div>
                        </div>

                        {/* DISCLOSURES & SPECIFICATIONS FOOTER */}
                        <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row items-center justify-around gap-4 text-xs font-semibold text-gray-500 text-center">
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            אנחנו לא שומרים שום נתונים (טקסט או סרטון) 🔒
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            זה ייקח כ-4 דקות מהזמן שלכם ⏱️
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* QUESTIONNAIRE START */}
              {selectedGateOption === 'create' && (
                <div className="max-w-4xl mx-auto mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateOption(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    חזרה לאפשרויות השיתוף והשאלות
                  </button>
                </div>
              )}

              {selectedGateOption === 'create' && (
                <QuestionnaireForm 
                  onSubmit={handleQuestionnaireSubmit} 
                  initialData={questionnaire} 
                />
              )}
            </motion.div>
          )}

          {/* STEP 2: AI Generating loading screen */}
          {step === 'GENERATING' && (
            <motion.div
              key="generating-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto text-center py-16 px-8 bg-white rounded-3xl border border-gray-200 shadow-xl"
              id="generating-card"
            >
              <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                {/* Clean minimalism pulsing orbits */}
                <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-isr-blue border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="w-8 h-8 text-isr-blue animate-pulse" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">ה-AI מנתח ומחולל קמפיין מותאם...</h3>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                אנחנו שוזרים את הדוברים שלכם ומפיקים תסריט 4-שלבים רב עוצמה שיחתם בסלוגן המאחד: <br />
                <span className="font-bold text-isr-blue">"משפחה וחברים לפני הקול"</span>
              </p>
              
              <div className="mt-8 flex flex-col gap-2 bg-blue-50/40 p-4 rounded-2xl border border-blue-100 text-right">
                <div className="flex justify-between text-xs text-gray-400 font-black">
                  <span>מנתח קשר אישי...</span>
                  <span className="text-green-600">✓ הושלם</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-black">
                  <span>משלב את סיפור הרקע...</span>
                  <span className="text-green-600">✓ הושלם</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 font-black animate-pulse">
                  <span>מנסח קריאה מדויקת למחויבות...</span>
                  <span className="text-isr-blue">בניסוח AI...</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Script preview & fine-tune workspace */}
          {step === 'SCRIPT_PREVIEW' && script && (
            <motion.div
              key="script-preview-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ScriptViewer 
                script={script} 
                onConfirm={handleScriptConfirm} 
                onRegenerate={handleRegenerate}
              />
            </motion.div>
          )}

          {/* STEP 4: Camera & Live Recording Screen */}
          {step === 'RECORDING' && script && (
            <motion.div
              key="recording-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 max-w-4xl mx-auto items-stretch w-full"
            >
              {/* 1. Camera Capture Feed - Top of the page, centered, larger */}
              <div className="w-full flex flex-col items-center" id="camera-workspace">
                <div className="w-full max-w-3xl bg-black rounded-3xl relative overflow-hidden aspect-video shadow-2xl border-4 border-white flex flex-col items-center justify-center">
                  
                  {/* Option standard video display */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                      isMockMode ? 'hidden' : 'block'
                    }`}
                  />

                  {/* Falling back to beautiful customized Canvas capture */}
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={450}
                    className={`absolute inset-0 w-full h-full object-cover ${
                      isMockMode ? 'block' : 'hidden'
                    }`}
                  />

                  {/* Cinematic Blur Portrait Overlay Layer - blurs edges and keeps speaker in the center sharp */}
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-2"
                    style={{
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      maskImage: 'radial-gradient(ellipse 55% 70% at 50% 50%, transparent 40%, black 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 55% 70% at 50% 50%, transparent 40%, black 100%)',
                    }}
                  />

                  {/* Silhouette Camera Alignment Guide overlay to keep person at optimal angle & distance */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-3 select-none" id="alignment-guides">
                    {/* Head Guide Line Oval */}
                    <div className="w-[175px] h-[225px] border-2 border-dashed border-white/60 rounded-[50%] relative flex flex-col items-center justify-center mb-10 transition-all duration-300">
                      <span className="absolute -top-7 bg-isr-blue/90 text-white border border-blue-400 text-[10px] font-black px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                        🎯 מקמו את הפנים כאן
                      </span>
                    </div>
                    {/* Shoulder Guide Lines */}
                    <div className="absolute bottom-24 w-[330px] h-[110px] border-t-2 border-x-2 border-dashed border-white/45 rounded-t-[100px] flex items-center justify-center">
                      <span className="bg-isr-blue/90 text-white border border-blue-400 text-[10px] font-black px-2 py-0.5 rounded shadow-sm whitespace-nowrap transform translate-y-[-10px]">
                        👤 קו הכתפיים והמרחק
                      </span>
                    </div>

                    <div className="absolute top-14 bg-black/50 border border-white/10 px-3 py-1 rounded-lg text-center backdrop-blur-xs">
                      <span className="text-white text-[10px] font-bold">הנחיה: ישורת עיניים • קו הכתפיים • מרחק זרוע</span>
                    </div>
                  </div>

                  {/* Overlay Gradient shadows so text is highly legible */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-4"></div>

                  {/* Top bar indicators */}
                  <div className="absolute top-4 inset-x-4 flex justify-between items-center z-10">
                    <div className="bg-red-650 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow border border-red-500">
                      <div className={`w-2.5 h-2.5 bg-white rounded-full ${isRecording ? 'animate-ping' : ''}`}></div>
                      <span>{isRecording ? 'הקלטה פעילה' : 'מצלמה מוכנה'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMockMode ? (
                        <button
                          type="button"
                          id="btn-switch-hardware"
                          onClick={() => startCamera(facingMode)}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-full border border-white/10 backdrop-blur-md cursor-pointer transition-colors"
                          title="נסה לחבר מחדש מצלמה אמיתית"
                        >
                          הפעל מצלמה אמיתית 📷
                        </button>
                      ) : (
                        <div className="px-3 py-1 bg-green-500/80 text-white text-xs font-bold rounded-full backdrop-blur-sm border border-green-400">
                          חומרה פעילה ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LIVE OVERLAY CAPTION TELEPROMPTER - Placed beautifully over the feed */}
                  <div className="absolute bottom-8 inset-x-6 z-10 flex justify-center text-center">
                    <div className="bg-black/60 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-white/10 max-w-lg shadow-xl">
                      <p className="text-white text-base sm:text-lg font-bold leading-relaxed tracking-wide animate-fade-in text-center">
                        {script.lines[currentPromptIndex] 
                          ? `"${script.lines[currentPromptIndex].text}"`
                          : `"משפחה וחברים לפני הקול"`
                        }
                      </p>
                      
                      {/* Interactive timing guide in caption strip */}
                      {script.lines[currentPromptIndex] && (
                        <div className="mt-2 w-full bg-white/25 h-1 rounded-full overflow-hidden">
                          <motion.div
                            key={currentPromptIndex}
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: script.lines[currentPromptIndex].durationSeconds / prompterSpeed, ease: 'linear' }}
                            className="bg-red-500 h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hot Controls on Viewfinder */}
                  {!isRecording && (
                    <div className="absolute top-4 left-4 z-10">
                      <button
                        type="button"
                        id="toggle-camera-face"
                        onClick={handleToggleCamera}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors cursor-pointer"
                        title="החלף זוויות מצלמה"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Speed Slider - Placed strictly under the camera view */}
              <div className="w-full max-w-3xl mx-auto bg-slate-50 p-5 rounded-3xl border border-slate-100 text-right">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-black text-slate-700">⏱️ קצב גלילת המילים בטלפרומפטר:</span>
                  <span className="text-sm font-black text-isr-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5" dir="ltr">
                    <span>{prompterSpeed.toFixed(2)}x</span>
                    {prompterSpeed === 1.0 && <span className="text-[10px] font-bold text-slate-500 bg-white px-1 py-0.5 rounded border border-gray-100">(קצב רגיל)</span>}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={prompterSpeed}
                  disabled={isRecording}
                  onChange={(e) => setPrompterSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-isr-blue disabled:opacity-50"
                  style={{ direction: 'ltr' }}
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-1.5" dir="rtl">
                  <span>🐢 איטי ורגוע (0.6x)</span>
                  <span>קצב רגיל (1.0x)</span>
                  <span>⚡ מהיר (1.4x)</span>
                </div>
              </div>

              {/* 3. Main Action Controls Block */}
              <div className="w-full max-w-3xl mx-auto flex items-center justify-between bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gray-400 font-bold uppercase">זמן מתוכנן</span>
                  <span className="text-2xl font-mono font-black text-gray-800">
                    {recordingDuration} / {totalScriptDuration} ש׳
                  </span>
                </div>

                {/* Giant Central Red Action Trigger */}
                <div className="flex flex-col items-center">
                  {!isRecording ? (
                    <button
                      type="button"
                      id="start-rec-btn"
                      onClick={handleStartRecording}
                      className="w-18 h-18 bg-white rounded-full p-1 border-4 border-gray-200 flex items-center justify-center cursor-pointer group active:scale-95 transition-all shadow-md animate-pulse"
                      style={{ animationDuration: '3s' }}
                    >
                      <div className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg transition-colors">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="stop-rec-btn"
                      onClick={handleStopRecording}
                      className="w-18 h-18 bg-white rounded-full p-1 border-4 border-red-100 flex items-center justify-center cursor-pointer group active:scale-95 transition-all shadow-md"
                    >
                      <div className="w-14 h-14 bg-gray-900 hover:bg-black rounded-xl flex items-center justify-center shadow-lg transition-colors animate-pulse">
                        <Square className="w-5 h-5 text-white" fill="white" />
                      </div>
                    </button>
                  )}
                  <span className="mt-1.5 text-[10px] font-bold text-gray-400 tracking-wider">
                    {isRecording ? 'הפסק הקלטה' : 'התחל צילום'}
                  </span>
                </div>

                {/* Sound Controls Column */}
                <div className="text-left flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">אופן שילוב קול:</p>
                    <span className="inline-block mt-1 px-2.5 py-1 bg-red-50 text-red-650 rounded-full font-bold text-[10px] uppercase tracking-wide">
                      מוטמע סינתזה
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    id="tele-mute-toggle"
                    onClick={toggleMute}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
                      isMuted 
                        ? 'bg-red-50 text-red-500 border-red-200' 
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                    title={isMuted ? "הפעל מוזיקת ליווי" : "השתק מוזיקת ליווי"}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 4. Second Part: Detailed Teleprompter (ONLY shown when recording is in progress!) */}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 shadow-lg flex flex-col justify-between"
                  id="teleprompter-sidebar"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                    <div className="text-right w-full">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">טלפרומפטר מלא לקריאה צעד-אחר-צעד</h3>
                      <p className="text-xs text-gray-500">הקצב מבוסס על בחירת המהירות שלך</p>
                    </div>
                  </div>

                  {/* Progressive teleprompter visual scroll */}
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {script.lines.map((line, idx) => {
                      const isActive = idx === currentPromptIndex;
                      const isPast = idx < currentPromptIndex;
                      const currentMaxSeconds = Math.round(line.durationSeconds / prompterSpeed);
                      
                      return (
                        <div
                          key={idx}
                          id={`tele-prompt-line-${idx}`}
                          className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                            isActive
                              ? 'bg-blue-50/85 border-isr-blue shadow-xs scale-101 ring-1 ring-blue-200'
                              : isPast
                              ? 'bg-gray-50/70 border-gray-150 opacity-40'
                              : 'bg-white border-gray-100 text-gray-400'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 text-[10px]">
                            <span className={`font-black ${isActive ? 'text-isr-blue' : 'text-gray-400'}`}>
                              משפט {idx + 1} ({currentMaxSeconds} ש׳)
                            </span>
                            {isPast && <span className="text-green-650 font-black text-[9px]">הוקרא ✓</span>}
                            {isActive && <span className="text-isr-blue font-black text-[9px] animate-pulse">דברו כעת 🎤</span>}
                          </div>
                          <p className={`text-base font-bold text-right leading-relaxed ${
                            isActive ? 'text-gray-900 font-extrabold' : 'text-gray-500 font-medium'
                          }`}>
                            "{line.text}"
                          </p>
                        </div>
                      );
                    })}

                    {/* Slogan Final Segment Indicator */}
                    <div className={`p-4 rounded-2xl border text-center transition-all ${
                      currentPromptIndex === script.lines.length
                        ? 'bg-isr-blue text-white border-blue-900 scale-102 shadow-md font-black'
                        : 'bg-gray-50 border-gray-100 text-gray-300'
                    }`}>
                      <span className="text-[9px] font-black tracking-widest uppercase block mb-1">סלוגן הסיום המרגש</span>
                      <p className="text-base font-serif italic font-bold">"משפחה וחברים לפני הקול"</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 4b. Alternative Option: Copy & Share as a written Facebook Post instead of filming */}
              {!isRecording && script && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-3xl mx-auto bg-blue-50/40 border border-blue-100 rounded-3xl p-6 shadow-md text-right"
                  id="facebook-post-companion"
                >
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-blue-200">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-850">מעדיפים לשתף כפוסט כתוב בפייסבוק?</h3>
                      <p className="text-xs text-slate-500">אם אינכם מעוניינים להצטלם, תוכלו להפיץ את המסר כפוסט מרגש ומוקפד ישירות לרשתות החברתיות</p>
                    </div>
                  </div>

                  {/* Simulated Facebook Post Preview */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs mb-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      {/* Avatar / Initials */}
                      <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-black text-sm border border-slate-200">
                        {questionnaire.speakerName ? questionnaire.speakerName.charAt(0) : 'פ'}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-gray-800">{questionnaire.speakerName || 'משתף/ת המשפחה'}</div>
                        <div className="text-[9px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                          <span>עכשיו</span>
                          <span>•</span>
                          <span>🌐</span>
                        </div>
                      </div>
                    </div>

                    {/* Post scrollable text body */}
                    <div className="max-h-[180px] overflow-y-auto bg-slate-50/60 p-4 rounded-xl border border-dashed border-slate-200 text-right text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-line" dir="rtl">
                      {script.lines.map(line => line.text).join('\n\n')}

                      {"\n\n"}
                      <strong className="text-isr-blue font-extrabold text-base block my-1">"משפחה וחברים לפני הקול"</strong>
                      {"\n"}
                      <span className="text-blue-600 text-xs font-semibold block mt-1">#משפחה_וחברים_לפני_הקול #די_להפקרה #לא_מפקירים</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const fullPostText = `${script.lines.map(line => line.text).join('\n\n')}\n\n"משפחה וחברים לפני הקול"\n\n#משפחה_וחברים_לפני_הקול #די_להפקרה #לא_מפקירים`;
                        navigator.clipboard.writeText(fullPostText).then(() => {
                          setCopiedPost(true);
                          setTimeout(() => setCopiedPost(false), 2000);
                        });
                        window.open('https://www.facebook.com', '_blank');
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-blue-700"
                    >
                      <Share2 className="w-4 h-4 ml-1" />
                      העתק פוסט ופתח את פייסבוק לשיתוף
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const fullPostText = `${script.lines.map(line => line.text).join('\n\n')}\n\n"משפחה וחברים לפני הקול"\n\n#משפחה_וחברים_לפני_הקול #די_להפקרה #לא_מפקירים`;
                        navigator.clipboard.writeText(fullPostText).then(() => {
                          setCopiedPost(true);
                          setTimeout(() => setCopiedPost(false), 2000);
                        });
                      }}
                      className={`w-full sm:w-auto px-6 py-3 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                        copiedPost 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200 shadow-xs'
                      }`}
                    >
                      {copiedPost ? <Check className="w-4 h-4 ml-1 text-green-600" /> : <Copy className="w-4 h-4 ml-1" />}
                      {copiedPost ? 'הפוסט הועתק לקליפבורד!' : 'רק העתקת טקסט הפוסט'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 5. Helpful filming tip (enlarged) */}
              <div className="w-full max-w-3xl mx-auto bg-amber-50/60 border border-amber-100 p-6 rounded-3xl text-right text-sm text-gray-750 font-semibold shadow-xs leading-relaxed">
                💡 <strong className="text-amber-800">טיפים לצילום מושלם:</strong> דברו לאט, ברוגע ובביטחון עצמי. הטקסט יתקדם מעצמו באופן אוטומטי בהתאם למשך הזמן שבחרתם בסליידר. בסיום הצילום, הסרטון שלכם יווצר עם כתוביות מובנות בהתאם לקצב שבחרתם ובליווי מוזיקת רקע ייחודית ונוגעת ללב.
              </div>

              {/* 6. Enlarge Go Back to Edit button */}
              <div className="w-full max-w-3xl mx-auto flex justify-center mt-2 pb-6">
                <button
                  type="button"
                  id="back-to-script-btn"
                  onClick={() => { stopCamera(); stopSynth(); setStep('SCRIPT_PREVIEW'); }}
                  className="px-8 py-4 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 font-black text-base rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 ml-1.5" />
                  חזרה לעריכת התסריט
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Beautiful Final Video Player Preview */}
          {step === 'PLAYER_PREVIEW' && (
            <motion.div
              key="player-preview-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto flex flex-col gap-8"
              id="player-preview-workspace"
            >
              <div className="text-center mb-2">
                <span className="inline-block p-2 bg-green-50 text-green-700 rounded-2xl text-xs font-bold border border-green-200 mb-2">
                  קובץ הסרטון הולחם ומוכן! ✨
                </span>
                <h2 className="text-3xl font-black text-gray-900">צפו בסרטון הסופי שלכם</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-lg mx-auto leading-relaxed">
                  הכתוביות מתעוררות לחיים, מוזיקת הרקע הוטמעה, והסרטון נגמר במכתם המשותף שהוגדר מראש.
                </p>
              </div>

              {/* Advanced Cinematic Dynamic Player Viewport */}
              <div className="relative bg-black rounded-3xl aspect-video overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center group/player">
                
                {/* Embedded HTML5 Video element */}
                {recordedVideoUrl ? (
                  <video
                    ref={previewVideoRef}
                    src={recordedVideoUrl}
                    onTimeUpdate={handlePlayerTimeUpdate}
                    onPlay={() => { setPreviewPlaying(true); setIsVideoEnded(false); }}
                    onPause={() => { setPreviewPlaying(false); }}
                    onEnded={() => { setIsVideoEnded(true); }}
                    className={`w-full h-full object-cover ${
                      isPostScriptTime(previewTime) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    } transition-all duration-1000`}
                    controls={false}
                  />
                ) : (
                  <div className="text-center text-slate-500 p-8">
                    <VideoOff className="w-12 h-12 mx-auto mb-3" />
                    לא נמצא קובץ וידאו זמין.
                  </div>
                )}

                {/* Overlaid Captions matching prompt timelines exactly */}
                {!isPostScriptTime(previewTime) && getSubtitleAtTime(previewTime) && (
                  <div className="absolute bottom-16 inset-x-6 z-10 flex justify-center pointer-events-none">
                    <span className="bg-black/70 text-white font-bold text-center px-6 py-3 rounded-2xl border border-white/10 text-lg leading-relaxed shadow-lg max-w-xl animate-fade-in">
                      "{getSubtitleAtTime(previewTime)}"
                    </span>
                  </div>
                )}

                {/* DYNAMIC CINEMATIC CLOSING SEQUENCE */}
                {/* Fades active video to deep dramatic Israeli blue sheet and floats/scales the Hebrew Slogan */}
                {isPostScriptTime(previewTime) && (
                  <motion.div
                    key="closing-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-20 text-white select-none"
                    style={{ backgroundColor: '#0038b8' }}
                    id="cinematic-slogan-overlay"
                  >
                    <motion.h1 
                      initial={{ scale: 0.85, opacity: 0, letterSpacing: "-0.05em" }}
                      animate={{ 
                        scale: [0.96, 1.04, 0.96], 
                        letterSpacing: ["-0.01em", "0.02em", "-0.01em"],
                        opacity: 1
                      }}
                      transition={{ 
                        scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                        letterSpacing: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 1.2 }
                      }}
                      className="text-3xl sm:text-6xl font-black tracking-wide leading-tight text-center text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
                    >
                      משפחה וחברים לפני הקול
                    </motion.h1>
                  </motion.div>
                )}

                {/* Permanent National Israeli Flag Watermark throughout the entire final video (including outro) */}
                <div className="absolute top-4 right-4 z-25 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs py-1 px-2.5 rounded-xl border border-white/10 shadow-lg pointer-events-none select-none">
                  <IsraeliFlag className="w-8 h-5.5 rounded-xs border border-white/20 shadow-xs animate-waving-flag" />
                  <span className="text-[10px] font-black tracking-tight text-white/90">משפחה וחברים לפני הקול</span>
                </div>

                {/* Custom Floating Player Play Controller Overlay */}
                {(isVideoEnded || !previewPlaying) && (
                  <div className={`absolute inset-0 flex items-center justify-center ${isVideoEnded ? 'bg-transparent' : 'bg-black/45'} z-30 transition-opacity`}>
                    <button
                      type="button"
                      id="big-play-btn"
                      onClick={() => {
                        setIsVideoEnded(false);
                        if (previewVideoRef.current) {
                          previewVideoRef.current.currentTime = 0;
                          previewVideoRef.current.play().catch(e => console.log(e));
                        }
                      }}
                      className="w-24 h-24 bg-white/95 hover:bg-white text-gray-950 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all hover:scale-105 cursor-pointer z-40"
                    >
                      <Play className="w-8 h-8 fill-gray-950 translation-x-[2px]" />
                      <span className="text-[10px] font-black tracking-wide mt-1 text-slate-800">
                        {isVideoEnded ? 'צפו שוב 🔁' : 'נגן סרטון'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Elegant Glassmorphic Bottom Control Bar with Waving Flag */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/65 backdrop-blur-md rounded-2xl py-2 px-3.5 flex items-center justify-between z-30 border border-white/10 shadow-lg">
                  <div className="flex items-center gap-2">
                    {/* Compact controls */}
                    <button
                      type="button"
                      onClick={() => {
                        if (previewVideoRef.current) {
                          if (previewPlaying) {
                            previewVideoRef.current.pause();
                          } else {
                            setIsVideoEnded(false);
                            previewVideoRef.current.play().catch(e => console.log(e));
                          }
                        }
                      }}
                      className="p-1 px-3 bg-white hover:bg-gray-100 text-gray-950 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      {previewPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current text-gray-950 animate-pulse" />
                          <span>עצור</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-gray-950" />
                          <span>נגן</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (previewVideoRef.current) {
                          setIsVideoEnded(false);
                          previewVideoRef.current.currentTime = 0;
                          previewVideoRef.current.play().catch(e => console.log(e));
                        }
                      }}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all cursor-pointer"
                      title="נגן מחדש"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* High Quality Time Overlay */}
                  <div className="text-[11px] font-mono font-bold text-gray-300">
                    {Math.round(previewTime)} ש׳ / {totalScriptDuration} ש׳
                  </div>

                  {/* Waving Israeli Flag badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/90 font-black tracking-tight select-none">מתחייבים לכבד את מי שסובל</span>
                    <IsraeliFlag className="w-8 h-5.5 rounded-sm border border-white/20 shadow-xs animate-waving-flag" />
                  </div>
                </div>

                {/* Micro indicators */}
                <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-mono">
                  {Math.floor(previewTime)} ש׳
                </div>
              </div>

              {/* POST PRODUCTION COMMANDS AND EXPORT TOOLBAR */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col text-right">
                  <h4 className="text-lg font-bold text-gray-900">שמרו את היצירה שלכם</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">הורידו את קובץ הוידאו המוכן שלכם לשמירה מקומית או לשיתוף.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    id="btn-retry"
                    onClick={handleRetryRecording}
                    className="px-6 py-3.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    לצלם מחדש 🎥
                  </button>

                  <button
                    type="button"
                    id="btn-restart"
                    onClick={() => { setScript(null); setStep('QUESTIONNAIRE'); }}
                    className="px-6 py-3.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    התחל תסריט חדש 📝
                  </button>

                  {recordedVideoUrl ? (
                    <a
                      href={recordedVideoUrl}
                      download={`סרטון_מתחייבים_${Date.now()}.${getSupportedMimeType().includes('mp4') ? 'mp4' : 'webm'}`}
                      className="relative px-8 py-4 bg-slate-950 hover:bg-black text-white rounded-2xl text-sm font-black shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto text-center"
                      id="btn-download"
                    >
                      <Download className="w-4 h-4" />
                      <span>הורד סרטון מוגמר 💾</span>
                      {/* Flag badge on the top right corner of the download button */}
                      <span className="absolute -top-3.5 -left-3.5 rotate-[-12deg] shadow-lg shrink-0 scale-90 z-10 hover:scale-100 transition-transform">
                        <IsraeliFlag className="w-9 h-6 border-2 border-white rounded shadow" />
                      </span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="relative px-8 py-4 bg-gray-200 text-gray-400 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto opacity-50"
                      id="btn-download-disabled"
                    >
                      <Download className="w-4 h-4" />
                      <span>הורד סרטון מוגמר 💾</span>
                    </button>
                  )}
                </div>
              </div>

              {/* DEMOCRATIC VALUE SHARING BOARD */}
              <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm text-right">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-100 text-isr-blue rounded-2xl">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">הפיצו את המסר המרגש שלכם ברשתות החברתיות</h3>
                    <p className="text-gray-500 text-xs mt-0.5">בחרו רשת חברתית כדי לגלות איך להעלות את הסרטון שלכם בקלות.</p>
                  </div>
                </div>

                {/* Direct platforms selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent('הכנתי סרטון אישי ומרגש לקמפיין ה-7.10 הלאומי: משפחה וחברים לפני הקול! צפו והכינו גם אתם: ' + window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareTip('קישור שיתוף נוצר! וואטסאפ תיפתח כעת. תוכלו גם לצרף את קובץ הוידאו שהורדתם.')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl text-xs font-black shadow-xs transition-transform hover:-translate-y-0.5 text-center cursor-pointer"
                  >
                    <span className="text-xl">💬</span>
                    <span>WhatsApp</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareTip('פייסבוק תיפתח כעת. מומלץ להעלות את קובץ הוידאו שהורדתם כפוסט חדש עם הסלוגן #משפחה_וחברים_לפני_הקול')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-2xl text-xs font-black shadow-xs transition-transform hover:-translate-y-0.5 text-center cursor-pointer"
                  >
                    <span className="text-xl">👥</span>
                    <span>Facebook</span>
                  </a>

                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={() => setShareTip('כדי לשתף באינסטגרם: 1. הורידו את הסרטון למחשב או לנייד 💾 • 2. פתחו אינסטגרם והעלו כ-Story או Reel • 3. רשמו את המכתם ״משפחה וחברים לפני הקול״ ✍️')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-95 text-white rounded-2xl text-xs font-black shadow-xs transition-transform hover:-translate-y-0.5 text-center cursor-pointer"
                  >
                    <span className="text-xl">📸</span>
                    <span>Instagram</span>
                  </button>

                  {/* X (Twitter) */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('הכנתי סרטון מרגש לקמפיין האחדות הלאומית: משפחה וחברים לפני הקול. הצטרפו אלי למען הנצחת הנופלים ' + window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShareTip('טוויטר (X) תיפתח כעת. תוכלו לצרף את קובץ הוידאו ששמרתם לציוץ שלכם.')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-black hover:bg-zinc-900 text-white rounded-2xl text-xs font-black shadow-xs transition-transform hover:-translate-y-0.5 text-center cursor-pointer"
                  >
                    <span className="text-xl">𝕏</span>
                    <span>X (Twitter)</span>
                  </a>

                  {/* YouTube */}
                  <button
                    type="button"
                    onClick={() => setShareTip('כיוטיוב הוא פלטפורמת וידאו, מומלץ: 1. להוריד את קובץ הוידאו שלכם • 2. להעלות אותו כ-YouTube Short ישירות מהנייד • 3. לתת את הכותרת הממלכתית: משפחה וחברים לפני הקול ❤️')}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[#FF0000] hover:bg-[#e60000] text-white rounded-2xl text-xs font-black shadow-xs transition-transform hover:-translate-y-0.5 text-center cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <span className="text-xl">🎥</span>
                    <span>YouTube</span>
                  </button>
                </div>

                {/* Clean tip overlay popup if chosen */}
                {shareTip && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900 transition-all font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <p>{shareTip}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShareTip(null)}
                      className="px-2 py-1 text-[10px] bg-white border border-blue-300 rounded-lg hover:bg-blue-100 font-bold cursor-pointer shrink-0 ml-2"
                    >
                      סגור
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FINAL SLOGAN FOOTER - Styled under the "Clean Minimalism" instructions */}
      <footer className="mt-auto bg-white border-t border-gray-200 py-6 px-12 flex flex-col sm:flex-row items-center justify-between text-center gap-4 shadow-sm z-10">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="text-lg font-serif italic text-gray-900 font-bold">
            "משפחה וחברים לפני הקול"
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          נוצר באהבה • כל הזכויות שמורות לשותפות ולאחדות המשפחתית 2026
        </p>
      </footer>
    </div>
  );
}
