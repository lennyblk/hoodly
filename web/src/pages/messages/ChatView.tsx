import { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import api from '../../api/axios';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text' | 'image' | 'audio';
  content?: string;
  createdAt: string;
}

interface Props {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
  onBack: () => void;
}

function formatHour(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatView({ conversationId, currentUserId, otherUserName, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Message[]>(`/messages/${conversationId}`).then(({ data }) => setMessages(data));
  }, [conversationId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');
    socketRef.current = socket;
    socket.emit('joinConversation', conversationId);
    socket.on('newMessage', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      socketRef.current?.emit('sendMessage', {
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
        <div className="w-9 h-9 rounded-full bg-vert-foret flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {otherUserName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <span className="font-heading font-semibold text-charbon">{otherUserName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
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
                <p>{msg.content}</p>
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

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-sable/20 flex gap-3 items-end flex-shrink-0">
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
      </div>
    </div>
  );
}
