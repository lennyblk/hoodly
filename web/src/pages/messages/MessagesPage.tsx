import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';
import ChatView from './ChatView';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  createdAt: string;
}

interface NeighbourUser {
  _id: string;
  firstName: string;
  lastName: string;
  neighbourhoodId?: string;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

const AVATAR_COLORS = ['#1E4D35', '#E07B39', '#52B788', '#2D6A4F', '#F4A261'];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];
}

export default function MessagesPage() {
  const { user } = useUser();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [neighbours, setNeighbours] = useState<NeighbourUser[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    (location.state as { conversationId?: string })?.conversationId ?? null,
  );
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get<Conversation[]>(`/conversations/user/${user._id}`);
      setConversations(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchNeighbours = useCallback(async () => {
    if (!user?.neighbourhoodId) return;
    const { data } = await api.get<NeighbourUser[]>('/users/neighbourhood', {
      params: { neighbourhoodId: user.neighbourhoodId },
    });
    setNeighbours(data.filter((u) => u._id !== user._id));
  }, [user]);

  useEffect(() => {
    fetchConversations();
    fetchNeighbours();
  }, [fetchConversations, fetchNeighbours]);

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');
    socket.emit('register', user._id);
    socket.on('onlineUsers', (ids: string[]) => setOnlineIds(new Set(ids)));
    socket.on('userOnline', ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => new Set(prev).add(userId)),
    );
    socket.on('userOffline', ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      }),
    );
    return () => {
      socket.disconnect();
    };
  }, [user]);

  async function openNewConvModal() {
    await fetchNeighbours();
    setShowModal(true);
  }

  async function startConversation(otherUserId: string) {
    if (!user || creating) return;
    setCreating(true);
    try {
      const { data } = await api.post<Conversation>('/conversations', {
        participants: [user._id, otherUserId],
      });
      await fetchConversations();
      setSelectedConvId(data.id);
      setShowModal(false);
    } finally {
      setCreating(false);
    }
  }

  const nameMap: Record<string, NeighbourUser> = {};
  for (const n of neighbours) nameMap[n._id] = n;

  function getOtherParticipantId(conv: Conversation) {
    return conv.participants.find((p) => p !== user?._id) ?? '';
  }

  function getConvLabel(conv: Conversation) {
    const otherId = getOtherParticipantId(conv);
    const other = nameMap[otherId];
    return other ? `${other.firstName} ${other.lastName}` : '—';
  }

  function getConvInitials(conv: Conversation) {
    const otherId = getOtherParticipantId(conv);
    const other = nameMap[otherId];
    return other ? getInitials(other.firstName, other.lastName) : '?';
  }

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;
  const otherUserName = selectedConv ? getConvLabel(selectedConv) : '';

  return (
    <div className="flex h-full bg-creme overflow-hidden">
      {/* ── Left: conversation list ── */}
      <div
        className={`flex flex-col bg-white border-r border-sable/20 flex-shrink-0 w-full md:w-80 lg:w-96 ${
          selectedConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h1 className="font-heading text-2xl font-bold text-charbon">Messages</h1>
          <button
            onClick={openNewConvModal}
            className="bg-vert-foret text-white w-9 h-9 rounded-full flex items-center justify-center text-xl hover:bg-vert-moyen transition-colors leading-none outline-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-charbon/40 text-sm">
              Chargement...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="text-4xl mb-3">💬</span>
              <p className="font-medium text-charbon/60">Aucune conversation</p>
              <p className="text-sm text-charbon/40 mt-1">Appuie sur + pour démarrer</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherId = getOtherParticipantId(conv);
              const label = getConvLabel(conv);
              const initials = getConvInitials(conv);
              const isSelected = conv.id === selectedConvId;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 transition-colors text-left border-b border-sable/10 ${
                    isSelected ? 'bg-creme border-r-2 border-r-vert-foret' : 'hover:bg-creme/60'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: avatarColor(otherId) }}
                    >
                      {initials}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        onlineIds.has(otherId) ? 'bg-vert-clair' : 'bg-sable'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charbon text-sm truncate">{label}</p>
                    {conv.lastMessage ? (
                      <p className="text-xs text-charbon/40 truncate mt-0.5">{conv.lastMessage}</p>
                    ) : (
                      <p className="text-xs text-charbon/30 italic mt-0.5">Nouvelle conversation</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: chat view ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
        {selectedConvId && user ? (
          <ChatView
            key={selectedConvId}
            conversationId={selectedConvId}
            currentUserId={user._id}
            otherUserName={otherUserName}
            otherUserOnline={onlineIds.has(selectedConv ? getOtherParticipantId(selectedConv) : '')}
            onBack={() => setSelectedConvId(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-charbon/40 gap-3">
            <span className="text-5xl">💬</span>
            <p className="font-medium">Sélectionne une conversation</p>
            <p className="text-sm">ou appuie sur + pour en démarrer une</p>
          </div>
        )}
      </div>

      {/* ── New conversation modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-charbon/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-charbon">Nouvelle conversation</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-charbon/40 hover:text-charbon text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {neighbours.length === 0 ? (
              <p className="text-sm text-charbon/50 py-4 text-center">
                Aucun voisin dans votre quartier.
              </p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {neighbours.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => startConversation(n._id)}
                    disabled={creating}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-creme transition-colors text-left disabled:opacity-50"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: avatarColor(n._id) }}
                      >
                        {getInitials(n.firstName, n.lastName)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          onlineIds.has(n._id) ? 'bg-vert-clair' : 'bg-sable'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-charbon">
                      {n.firstName} {n.lastName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
