import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'audio' | 'file';
  content?: string;
  fileId?: string;
  fileName?: string;
  createdAt: string;
}

interface Props {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
  otherUserOnline: boolean;
  onBack: () => void;
  readOnly?: boolean;
}

function formatHour(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function ChatView({ conversationId, currentUserId, otherUserName, otherUserOnline, onBack, readOnly = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState('');
  const capturedPhotoBlobRef = useRef<Blob | null>(null);
  const { socket } = useSocket();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLiveUpdateRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get<Message[]>(`/messages/${conversationId}`).then(({ data }) => setMessages(data));
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('joinConversation', conversationId);
    const handler = (msg: Message) => {
      isLiveUpdateRef.current = true;
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('newMessage', handler);
    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.off('newMessage', handler);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    const behavior = isLiveUpdateRef.current ? 'smooth' : 'auto';
    isLiveUpdateRef.current = false;

    function scrollToBottom() {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      } else {
        bottomRef.current?.scrollIntoView({ behavior });
      }
    }

    scrollToBottom();
    const raf = requestAnimationFrame(scrollToBottom);
    const t1 = setTimeout(scrollToBottom, 50);
    const t2 = setTimeout(scrollToBottom, 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, mediaUrls]);

  useEffect(() => {
    const missing = messages.filter((m) => m.fileId && !mediaUrls[m.fileId]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const msg of missing) {
        try {
          const { data } = await api.get(`/messages/media/${msg.fileId}`, { responseType: 'blob' });
          if (cancelled) return;
          const url = URL.createObjectURL(data);
          setMediaUrls((prev) => ({ ...prev, [msg.fileId as string]: url }));
        } catch {
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, mediaUrls]);

  const mediaUrlsRef = useRef(mediaUrls);
  mediaUrlsRef.current = mediaUrls;

  useEffect(() => {
    return () => {
      Object.values(mediaUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      socket?.emit('sendMessage', {
        conversationId,
        senderId: currentUserId,
        type: 'text',
        content,
      });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function uploadAndSend(file: File | Blob, mediaType: 'image' | 'audio' | 'file', filename: string) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file, filename);
      const { data } = await api.post<{ fileId: string }>('/messages/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      socket?.emit('sendMessage', {
        conversationId,
        senderId: currentUserId,
        type: mediaType,
        fileId: data.fileId,
        ...(mediaType === 'file' ? { fileName: filename } : {}),
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploading) return;

    const mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';

    await uploadAndSend(file, mediaType, file.name);
  }

  function pickRecorderMimeType() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t));
  }

  function getMediaDevices() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError(
        window.isSecureContext
          ? "Accès caméra/micro refusé ou indisponible sur cet appareil."
          : "Caméra/micro nécessitent une connexion sécurisée (HTTPS). Ce site tourne en HTTP, donc indisponible ici.",
      );
      return null;
    }
    return navigator.mediaDevices;
  }

  async function startRecording() {
    if (isRecording || uploading) return;
    const mediaDevices = getMediaDevices();
    if (!mediaDevices) return;
    setMediaError('');
    let stream: MediaStream;
    try {
      stream = await mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMediaError("Impossible d'accéder au micro. Vérifie les autorisations du navigateur.");
      return;
    }
    const mimeType = pickRecorderMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      setIsRecording(false);
      const discarded = discardRecordingRef.current;
      discardRecordingRef.current = false;
      if (discarded) return;
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType });
      if (blob.size > 0) {
        await uploadAndSend(blob, 'audio', 'vocal.webm');
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }

  const discardRecordingRef = useRef(false);

  function stopRecording() {
    discardRecordingRef.current = false;
    mediaRecorderRef.current?.stop();
  }

  function cancelRecording() {
    discardRecordingRef.current = true;
    mediaRecorderRef.current?.stop();
  }

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function openCamera() {
    if (uploading) return;
    const mediaDevices = getMediaDevices();
    if (!mediaDevices) return;
    setMediaError('');
    try {
      const stream = await mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      setShowCamera(true);
    } catch {
      setMediaError("Impossible d'accéder à la caméra. Vérifie les autorisations du navigateur.");
    }
  }

  useEffect(() => {
    if (showCamera && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [showCamera]);

  function discardCapturedPhoto() {
    if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
    setCapturedPhotoUrl(null);
    capturedPhotoBlobRef.current = null;
  }

  function closeCamera() {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    discardCapturedPhoto();
    setShowCamera(false);
  }

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.translate(canvas.width, 0);
    ctx?.scale(-1, 1);
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      capturedPhotoBlobRef.current = blob;
      setCapturedPhotoUrl(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.9);
  }

  function retakePhoto() {
    discardCapturedPhoto();
  }

  async function sendCapturedPhoto() {
    const blob = capturedPhotoBlobRef.current;
    if (!blob) return;
    closeCamera();
    await uploadAndSend(blob, 'image', 'photo.jpg');
  }


  return (
    <div className="flex flex-col h-full bg-creme">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-sable/20 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-charbon/50 hover:text-charbon transition-colors text-lg md:hidden leading-none outline-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-vert-foret flex items-center justify-center text-white text-sm font-bold">
            {otherUserName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
              otherUserOnline ? 'bg-vert-clair' : 'bg-sable'
            }`}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-semibold text-charbon">{otherUserName}</span>
          <span className="text-xs text-charbon/40">{otherUserOnline ? 'En ligne' : 'Hors ligne'}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-16 text-charbon/30 text-sm">
            Aucun message — dites bonjour !
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-vert-foret text-white rounded-br-sm'
                    : 'bg-white text-charbon rounded-bl-sm border border-sable/20 shadow-sm'
                }`}
              >
                {msg.type === 'image' ? (
                  msg.fileId && mediaUrls[msg.fileId] ? (
                    <img
                      src={mediaUrls[msg.fileId]}
                      alt="Image envoyée"
                      className="max-w-full max-h-64 rounded-xl object-cover"
                    />
                  ) : (
                    <p className={isMine ? 'text-white/70 italic' : 'text-charbon/40 italic'}>Chargement de l'image…</p>
                  )
                ) : msg.type === 'audio' ? (
                  msg.fileId && mediaUrls[msg.fileId] ? (
                    <audio controls src={mediaUrls[msg.fileId]} className="max-w-full" />
                  ) : (
                    <p className={isMine ? 'text-white/70 italic' : 'text-charbon/40 italic'}>Chargement de l'audio…</p>
                  )
                ) : msg.type === 'file' ? (
                  msg.fileId && mediaUrls[msg.fileId] ? (
                    <a
                      href={mediaUrls[msg.fileId]}
                      download={msg.fileName ?? 'fichier'}
                      className={`flex items-center gap-2.5 ${isMine ? 'text-white' : 'text-charbon'}`}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6"/>
                      </svg>
                      <span className="text-sm underline underline-offset-2 truncate">{msg.fileName ?? 'Fichier'}</span>
                    </a>
                  ) : (
                    <p className={isMine ? 'text-white/70 italic' : 'text-charbon/40 italic'}>Chargement du fichier…</p>
                  )
                ) : (
                  <p>{msg.content}</p>
                )}
                <p
                  className={`text-[10px] mt-1 ${
                    isMine ? 'text-white/60 text-right' : 'text-charbon/30'
                  }`}
                >
                  {formatHour(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — remplacé par un bandeau si la conversation est en lecture seule */}
      {readOnly ? (
        <div className="px-4 py-4 bg-creme border-t border-sable/20 flex items-center justify-center gap-2 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-charbon/40 flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-xs text-charbon/50 text-center">
            Conversation en lecture seule — {otherUserName} ne fait plus partie de votre quartier
          </p>
        </div>
      ) : (
      <>
      {mediaError && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex-shrink-0">
          {mediaError}
        </div>
      )}
      <div className="px-4 py-3 bg-white border-t border-sable/20 flex gap-3 items-end flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-creme border border-sable">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-sm text-charbon font-medium flex-1">{formatDuration(recordSeconds)}</span>
            <button onClick={cancelRecording} className="text-charbon/50 hover:text-charbon transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <button onClick={stopRecording} className="bg-vert-foret text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-vert-moyen transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 flex-shrink-0 pb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-charbon/50 hover:text-charbon transition-colors disabled:opacity-40"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <button
                onClick={openCamera}
                disabled={uploading}
                className="text-charbon/50 hover:text-charbon transition-colors disabled:opacity-40"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <button
                onClick={startRecording}
                disabled={uploading}
                className="text-charbon/50 hover:text-charbon transition-colors disabled:opacity-40"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                </svg>
              </button>
            </div>
            <textarea
              className="flex-1 border border-sable rounded-2xl px-4 py-2.5 text-sm text-charbon resize-none focus:outline-none focus:ring-2 focus:ring-vert-foret/40 focus:border-vert-foret max-h-32 min-h-[42px]"
              placeholder="Votre message..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="bg-vert-foret text-white rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-vert-moyen transition-colors disabled:opacity-40 flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </>
        )}
      </div>
      </>
      )}

      {/* Camera modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-charbon/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-md shadow-xl flex flex-col gap-3">
            <div className="w-full rounded-xl bg-charbon aspect-video overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover scale-x-[-1] ${capturedPhotoUrl ? 'hidden' : ''}`}
              />
              {capturedPhotoUrl && (
                <img src={capturedPhotoUrl} alt="Photo capturée" className="w-full h-full object-cover" />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-end gap-3">
              {capturedPhotoUrl ? (
                <>
                  <button
                    onClick={retakePhoto}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-charbon/60 hover:bg-creme transition-colors"
                  >
                    Reprendre
                  </button>
                  <button
                    onClick={sendCapturedPhoto}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-vert-foret text-white hover:bg-vert-moyen transition-colors"
                  >
                    Envoyer
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeCamera}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-charbon/60 hover:bg-creme transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-vert-foret text-white hover:bg-vert-moyen transition-colors"
                  >
                    Prendre la photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
