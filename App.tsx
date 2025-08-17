
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { recognizeSignLanguage, RateLimitError } from './services/geminiService';

// CSS for UI components (can be moved to a separate file)
const styles = `
.appbar { position: sticky; top: 0; z-index: 10; backdrop-filter: saturate(1.2) blur(12px);
  background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0)) , var(--glass);
  border-bottom: 1px solid var(--outline);
}
.appbar-inner { max-width: 1240px; margin: 0 auto; padding: 12px 16px; display:flex; align-items:center; gap:14px; }
.logo { width: 44px; height: 44px; border-radius: 14px; flex:none;
  background: conic-gradient(from 200deg at 50% 50%, var(--blue), var(--green), var(--yellow), var(--red), var(--blue));
  box-shadow: 0 10px 30px rgba(26,115,232,.28), inset 0 0 12px rgba(255,255,255,.25);
}
.title { display:flex; flex-direction:column; }
.title h1 { margin:0; font-size:21px; letter-spacing:.2px; }
.subtitle { color: var(--muted); font-size: 12px; }
.app-actions { margin-left:auto; display:flex; gap:8px; align-items:center; }

.chip { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius: 999px; border:1px solid var(--outline); background: var(--glass); font-size: 12px; box-shadow: var(--glow); }
.dot { width:8px; height:8px; border-radius:50%; background: var(--muted); box-shadow:none; transition: .25s; }
.dot.live { background: var(--green); box-shadow: var(--ring); }
.dot.err { background: var(--red); box-shadow: 0 0 0 8px rgba(234,67,53,.12); }

.container { max-width: 1240px; margin: 0 auto; padding: 18px 16px 40px; }
.grid { display:grid; grid-template-columns: 1.15fr .85fr; gap: 20px; }
@media (max-width: 1060px){ .grid { grid-template-columns: 1fr; } }

.card { background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0)) , var(--bg-elev);
  border: 1px solid var(--outline); border-radius: var(--radius); box-shadow: var(--shadow);
  padding: 16px; position: relative; overflow: clip; }
.card::after { content:""; position:absolute; inset:-1px; border-radius: inherit; pointer-events:none;
  background: radial-gradient(1200px 400px at 50% -20%, rgba(167,139,250,.12), transparent 60%);
  mix-blend-mode: screen; }

.video-wrap { position:relative; border-radius: 16px; overflow:hidden; background:#000; box-shadow: 0 0 0 1px var(--outline), 0 0 80px rgba(26,115,232,.18); transition: box-shadow .35s ease; }
.video-wrap.live { box-shadow: 0 0 0 1px var(--outline), 0 0 120px rgba(26,115,232,.35), 0 0 160px rgba(167,139,250,.25); }
video { width:100%; display:block; background:#000; transform: scaleX(-1); }
.hud { position:absolute; inset:0; display:flex; justify-content:space-between; pointer-events:none; }
.hud .left { padding:10px; }
.hud .right { margin-left:auto; padding:10px; display:flex; gap:8px; }
.badge { pointer-events:auto; display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:10px; background: rgba(17,22,42,.72); color:#fff; border:1px solid rgba(255,255,255,.16); font-size:12px; box-shadow: 0 10px 30px rgba(0,0,0,.28); }

.controls { display:flex; flex-wrap:wrap; gap:10px; margin-top: 12px; }
button, select, input[type="range"] {
  border-radius: 12px; border: 1px solid var(--outline); background: var(--glass);
  color: var(--text); padding: 10px 14px; font: inherit; outline: none; position:relative; overflow:hidden; transition: transform .12s ease, box-shadow .2s ease, border-color .2s ease;
}
button { cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:8px; }
button:not(:disabled):hover { transform: translateY(-1px); box-shadow: var(--glow); border-color: var(--outline-strong); }
button:not(:disabled):active { transform: translateY(0); }
button.primary { background: linear-gradient(180deg, rgba(26,115,232,.28), rgba(26,115,232,.08)); border-color: rgba(26,115,232,.35); }
button.ghost { background: var(--glass); }
button.warn { background: linear-gradient(180deg, rgba(251,188,5,.3), rgba(251,188,5,.08)); border-color: rgba(251,188,5,.35); }
button:disabled { opacity:.55; cursor:not-allowed; filter: grayscale(.2); box-shadow: none; }

.capture { position: relative; border-radius: 999px; }
.capture::before, .capture::after { content:""; position:absolute; inset:-6px; border-radius: inherit; z-index:-1; filter: blur(12px); opacity:.9; transition: opacity .25s ease; }
.capture::before { background: conic-gradient(from 0deg, var(--blue), var(--violet), var(--green), var(--yellow), var(--red), var(--blue)); animation: rotate 8s linear infinite; }
.capture::after { background: radial-gradient(circle, rgba(255,255,255,.35), transparent 60%); }
.capture:disabled::before { opacity:.2; }
@keyframes rotate { to { transform: rotate(1turn); } }

input[type="range"]{ height: 36px; accent-color: var(--blue); }

.transcript { height: 520px; overflow: auto; padding: 12px; background: rgba(5,7,14,.6); border-radius: 14px; border: 1px dashed var(--outline); box-shadow: inset 0 0 40px rgba(26,115,232,.08); }
:root[data-theme="light"] .transcript { background: rgba(26,115,232,.06); }
.line { padding: 10px 12px; margin: 8px 0; background: rgba(255,255,255,.06); border: 1px solid var(--outline); border-radius: 12px; font-size: 14px; display:flex; gap:10px; align-items:flex-start; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
.time { color: var(--muted); font-size: 12px; min-width: 70px; }

.fab { position: fixed; right: 22px; bottom: 22px; z-index: 20; border-radius: 999px; padding: 14px 18px; border: 1px solid var(--outline); background: linear-gradient(180deg, rgba(26,115,232,.3), rgba(26,115,232,.1)); box-shadow: 0 12px 36px rgba(26,115,232,.35), 0 0 80px rgba(167,139,250,.2); cursor:pointer; display:flex; align-items:center; gap:10px; }

footer { margin-top: 24px; color: var(--muted); font-size: 12px; text-align:center; text-shadow: 0 1px 0 rgba(0,0,0,.2); }
a { color: var(--blue); text-decoration:none; }
a:hover { text-decoration:underline; }

.dialog { position: fixed; inset: 0; display:none; place-items:center; background: rgba(4,8,16,.55); backdrop-filter: blur(8px); z-index: 30; }
.dialog.open { display:grid; }
.dialog .sheet { width:min(720px, 92vw); background: var(--bg-elev); border:1px solid var(--outline); border-radius: 20px; padding: 16px; box-shadow: var(--shadow); }

.toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 18px; background: var(--bg-elev); color: var(--text); padding: 10px 14px; border:1px solid var(--outline); border-radius: 12px; box-shadow: var(--shadow); display:none; z-index: 40; transition: opacity 0.3s, transform 0.3s; }
.toast.show { display:block; opacity: 1; transform: translate(-50%, 0); }
`;

type TranscriptLine = { time: string; text: string };
type Status = 'idle' | 'live' | 'err' | 'starting';

const App: React.FC = () => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [status, setStatus] = useState<Status>('idle');
    const [statusText, setStatusText] = useState('Idle');
    const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [fps, setFps] = useState(0);
    const [resolutionLabel, setResolutionLabel] = useState('960×540');
    const [backoffDelay, setBackoffDelay] = useState(2000); // Initial 2s backoff

    // Control refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isRecognizingRef = useRef(false);
    const recognitionTimeoutRef = useRef<number | null>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    const frameRateRef = useRef<HTMLSelectElement>(null);
    const resolutionRef = useRef<HTMLSelectElement>(null);
    const voiceSelectRef = useRef<HTMLSelectElement>(null);
    const rateRef = useRef<HTMLInputElement>(null);
    const pitchRef = useRef<HTMLInputElement>(null);

    // FPS counter refs
    const frameCountRef = useRef(0);
    const lastFpsTickRef = useRef(performance.now());


    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    }, []);
    
    useEffect(() => {
        // Particle effect
        const container = document.getElementById('particles-container');
        if (!container) return;
        for(let i=0; i < 22; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            p.style.animationDuration = (12 + Math.random() * 10) + 's';
            p.style.opacity = (0.12 + Math.random() * 0.18).toString();
            p.style.transform = `scale(${0.6 + Math.random() * 0.9})`;
            container.appendChild(p);
        }

        // Load voices
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        
        // Set year in footer
        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionTimeoutRef.current) {
                clearTimeout(recognitionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    const updateStatus = (state: Status, text: string) => {
        setStatus(state);
        setStatusText(text);
    };
    
    const handleStopRecognition = useCallback(() => {
        isRecognizingRef.current = false;
        if (recognitionTimeoutRef.current) {
            clearTimeout(recognitionTimeoutRef.current);
            recognitionTimeoutRef.current = null;
        }
        setIsRecognizing(false);
        if (status !== 'err') {
            updateStatus('idle', 'Stopped');
        }
        setFps(0);
    }, [status]);

    const handleStartCamera = useCallback(async () => {
        if (!resolutionRef.current) return;
        try {
            updateStatus('starting', 'Initializing Camera...');
            const [w, h] = resolutionRef.current.value.split('x').map(Number);
            setResolutionLabel(`${w}×${h}`);
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: w }, height: { ideal: h }, facingMode: 'user' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCameraOn(true);
            updateStatus('idle', 'Camera ready');
            showToast('Camera started');
        } catch (err) {
            console.error('Camera access failed:', err);
            updateStatus('err', 'Camera Error');
            alert('Camera access failed: ' + (err as Error).message);
        }
    }, [showToast]);

    const handleStopCamera = useCallback(() => {
        if (isRecognizingRef.current) handleStopRecognition();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOn(false);
        updateStatus('idle', 'Idle');
    }, [handleStopRecognition]);

    const speak = useCallback((text: string) => {
        if (isMuted || !text || !voices.length || !voiceSelectRef.current || !rateRef.current || !pitchRef.current) return;

        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoiceIndex = parseInt(voiceSelectRef.current.value, 10);
        const voice = voices[selectedVoiceIndex];
        
        if (voice) utterance.voice = voice;
        utterance.rate = parseFloat(rateRef.current.value);
        utterance.pitch = parseFloat(pitchRef.current.value);

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }, [isMuted, voices]);
    
    const processFrameLoop = useCallback(async () => {
        if (!isRecognizingRef.current || !videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
            return;
        }
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (!context) { return; }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        const selectedVoice = voices[parseInt(voiceSelectRef.current?.value ?? '0', 10)];
        const langCode = selectedVoice?.lang.split('-')[0] || 'en';
            
        try {
            updateStatus('live', 'Recognizing...');
            const result = await recognizeSignLanguage(base64Data, langCode);

            if (result && result !== transcript[transcript.length - 1]?.text) {
                const time = new Date().toLocaleTimeString();
                setTranscript(prev => [...prev, { time, text: result }]);
                speak(result);
            }
            
            // On success, reset backoff and schedule next frame normally
            if (status === 'err') { setBackoffDelay(2000); }
            updateStatus('live', 'Streaming...');
            const interval = 1000 / parseFloat(frameRateRef.current?.value || '0.5');
            recognitionTimeoutRef.current = window.setTimeout(processFrameLoop, interval);

        } catch (err) {
            if (err instanceof RateLimitError) {
                updateStatus('err', 'Rate Limited');
                showToast(`Rate limit hit. Retrying in ${backoffDelay / 1000}s...`);
                recognitionTimeoutRef.current = window.setTimeout(processFrameLoop, backoffDelay);
                setBackoffDelay(prev => Math.min(prev * 2, 30000)); // Double delay up to 30s
            } else {
                updateStatus('err', 'API Error');
                showToast((err as Error).message);
                handleStopRecognition();
            }
            return;
        }

        // Update FPS counter
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastFpsTickRef.current > 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFpsTickRef.current = now;
        }

    }, [speak, voices, transcript, showToast, handleStopRecognition, status, backoffDelay]);

    const handleStartRecognition = useCallback(() => {
        if (!isCameraOn || isRecognizingRef.current) return;

        isRecognizingRef.current = true;
        setIsRecognizing(true);
        updateStatus('live', 'Starting...');
        processFrameLoop(); // Start the loop
    }, [isCameraOn, processFrameLoop]);


    const handleDownload = () => {
        const content = transcript.map(l => `[${l.time}] ${l.text}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sign-ai-transcript-${new Date().toISOString().slice(0, 19)}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    
    const handleFabClick = () => {
        if (!isCameraOn) {
            handleStartCamera().then(() => {
                setTimeout(handleStartRecognition, 500);
            });
            return;
        }
        if (isRecognizing) {
            handleStopRecognition();
        } else {
            handleStartRecognition();
        }
    };
    
    const handleThemeToggle = () => {
        const root = document.documentElement;
        const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', nextTheme);
        showToast(`Theme: ${nextTheme}`);
    }

    return (
        <>
            <style>{styles}</style>
            <div className="appbar">
                <div className="appbar-inner">
                    <div className="logo" aria-hidden="true"></div>
                    <div className="title">
                        <h1>Sign Language AI</h1>
                        <span className="subtitle">Real-time Sign-to-Speech Translation</span>
                    </div>
                    <div className="app-actions">
                        <span className="chip"><span className={`dot ${status}`}></span><span>{statusText}</span></span>
                        <button onClick={handleThemeToggle} className="ghost"><span className="icon">dark_mode</span> Theme</button>
                        <button onClick={() => setIsHelpOpen(true)} className="ghost"><span className="icon">help</span> Help</button>
                    </div>
                </div>
            </div>

            <main className="container">
                <div className="grid">
                    <section className="card">
                        <div className={`video-wrap ${isRecognizing ? 'live' : ''}`}>
                            <video ref={videoRef} playsInline muted></video>
                            <div className="hud">
                                <div className="left">
                                    <span className="badge"><span className="icon">movie_camera</span><span>{resolutionLabel}</span></span>
                                </div>
                                <div className="right">
                                    <span className="badge"><span className="icon">speed</span><span>{fps} fps</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="controls">
                            <button onClick={handleStartCamera} className="primary capture" disabled={isCameraOn}><span className="icon">videocam</span> Start Camera</button>
                            <button onClick={handleStartRecognition} className="primary capture" disabled={!isCameraOn || isRecognizing}><span className="icon">fiber_manual_record</span> Start Recognition</button>
                            <button onClick={handleStopRecognition} className="ghost" disabled={!isRecognizing}><span className="icon">stop</span> Stop</button>
                            <button onClick={handleStopCamera} className="ghost" disabled={!isCameraOn}><span className="icon">videocam_off</span> Stop Camera</button>
                            <button onClick={handleDownload} className="ghost" disabled={transcript.length === 0}><span className="icon">download</span> Transcript</button>
                        </div>
                        
                        <div className="controls" style={{ marginTop: '10px' }}>
                            <label className="chip">Frame rate
                                <select ref={frameRateRef} defaultValue="0.5" style={{ marginLeft: '8px' }}>
                                    <option value="0.5">0.5 fps (Slow)</option>
                                    <option value="1">1 fps (Normal)</option>
                                    <option value="2">2 fps (Fast)</option>
                                </select>
                            </label>
                            <label className="chip">Resolution
                                <select ref={resolutionRef} defaultValue="960x540" style={{ marginLeft: '8px' }}>
                                    <option value="640x360">640×360</option>
                                    <option value="960x540">960×540</option>
                                    <option value="1280x720">1280×720</option>
                                </select>
                            </label>
                            <label className="chip">Voice 
                                <select ref={voiceSelectRef} style={{ marginLeft: '8px', maxWidth: '150px' }}>
                                    {voices.map((v, i) => (
                                        <option key={i} value={i}>{v.name} — {v.lang}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="chip">Rate <input type="range" min="0.7" max="1.4" step="0.05" defaultValue="1" ref={rateRef} style={{ width: '120px' }} /></label>
                            <label className="chip">Pitch <input type="range" min="0.5" max="1.8" step="0.1" defaultValue="1" ref={pitchRef} style={{ width: '120px' }} /></label>
                            <button onClick={() => setIsMuted(m => !m)} className="warn">
                                <span className="icon">{isMuted ? 'volume_off' : 'volume_up'}</span>
                                {isMuted ? 'Unmute' : 'Mute'}
                            </button>
                        </div>
                    </section>
                    
                    <aside className="card">
                      <h2 style={{margin: '4px 0 10px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}><span className="icon">subtitles</span> Live Transcript</h2>
                      <div ref={transcriptRef} className="transcript" aria-live="polite">
                          {transcript.map((line, index) => (
                              <div key={index} className="line">
                                  <span className="time">{line.time}</span>
                                  <span>{line.text}</span>
                              </div>
                          ))}
                          {transcript.length === 0 && <div style={{textAlign: 'center', color: 'var(--muted)', paddingTop: '40px'}}>Transcript will appear here...</div>}
                      </div>
                    </aside>
                </div>
                <footer>© <span id="year"></span> Assha AI • For inclusive communication.</footer>
            </main>

            <button className="fab capture" onClick={handleFabClick}>
                <span className="icon">{isRecognizing ? 'stop' : 'play_arrow'}</span>
                <span>{isRecognizing ? 'Stop' : 'Start'}</span>
            </button>

            <div className={`dialog ${isHelpOpen ? 'open' : ''}`} role="dialog" onClick={() => setIsHelpOpen(false)}>
                <div className="sheet" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0 }}>Using The App</h3>
                        <button onClick={() => setIsHelpOpen(false)} className="ghost"><span className="icon">close</span></button>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
                        <li>Click <strong>Start Camera</strong> and grant permission.</li>
                        <li>Choose a Frame rate and Resolution for your network. (Slower is safer for API limits).</li>
                        <li>Select a preferred voice for speech output.</li>
                        <li>Press <strong>Start Recognition</strong>. Signs will be translated in the transcript and spoken aloud.</li>
                    </ol>
                </div>
            </div>

            <div className={`toast ${toastMessage ? 'show' : ''}`}>{toastMessage}</div>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </>
    );
};

export default App;
