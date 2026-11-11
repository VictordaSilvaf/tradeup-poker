import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, CircleHelp, History, Settings2, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { planning } from '../../app/dependencies';
import {
  castVote,
  postChatMessage,
  presentParticipants,
  type ChatAttachment,
  type Room,
} from '../../domain/room';
import { session } from '../../infra/session';
import {
  HelpModal,
  HistoryModal,
  InviteModal,
  ProfileModal,
  SettingsModal,
} from '../components/modals';
import {
  Results,
  RoomHeader,
  RoundProgress,
  SidePanel,
  type SidePanelTab,
  VotingDeck,
  VotingTable,
} from '../components/room';
import { Brand, Button, ErrorMessage, LargeIcon, TextButton, ToastViewport } from '../components/ui';
import { useAction } from '../hooks/use-action';
import { useRoom } from '../hooks/use-room';
import { useRoomPoke } from '../hooks/use-room-poke';
import { useRoomPresence } from '../hooks/use-room-presence';
import { JoinPage } from './join-page';

type ModalType = 'invite' | 'settings' | 'profile' | 'history' | 'help' | null;

export function RoomPage() {
  const { roomId = '' } = useParams();
  return <RoomSession key={roomId} roomId={roomId} />;
}

function RoomSession({ roomId }: { roomId: string }) {
  const { room, loading, error: loadError, mutate, refresh } = useRoom(roomId);
  const [actor, setActor] = useState(() => session.participantId(roomId));
  const [presenceEnabled, setPresenceEnabled] = useState(true);
  const [rejoining, setRejoining] = useState(false);
  const rejoiningRef = useRef(false);
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth > 1000);
  const [panelTab, setPanelTab] = useState<SidePanelTab>('chat');
  const [modal, setModal] = useState<ModalType>(null);
  const { run, busy, error, setError } = useAction();
  const navigate = useNavigate();
  const participant = room?.participants.find((entry) => entry.id === actor);

  useEffect(() => {
    document.title = room ? `${room.name} — TradeUpPoker` : 'TradeUpPoker — Planning Poker';
    return () => {
      document.title = 'TradeUpPoker — Planning Poker';
    };
  }, [room]);

  useEffect(() => {
    if (!room || loading || participant || rejoiningRef.current) return;
    const stored = session.read(roomId);
    if (!stored?.name) return;

    let cancelled = false;
    rejoiningRef.current = true;
    setRejoining(true);
    void planning
      .joinRoom(roomId, stored.name, stored.spectator)
      .then(async (result) => {
        if (cancelled) {
          await planning.leave(roomId, result.participant.id).catch(() => {});
          return;
        }
        session.save(roomId, result.participant);
        setActor(result.participant.id);
        setPresenceEnabled(true);
        await refresh({ force: true }).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) session.clear(roomId);
      })
      .finally(() => {
        rejoiningRef.current = false;
        if (!cancelled) setRejoining(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, participant, refresh, room, roomId]);

  async function leave() {
    if (!actor) return;
    setPresenceEnabled(false);
    session.clear(roomId);
    try {
      await planning.leave(roomId, actor);
    } catch {
      /* já pode ter saído pelo pagehide/heartbeat */
    }
    navigate('/');
  }

  function openPanelTab(tab: SidePanelTab) {
    if (panelOpen && panelTab === tab) {
      setPanelOpen(false);
      return;
    }
    setPanelTab(tab);
    setPanelOpen(true);
  }

  if (loading || rejoining)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center p-8 text-center" aria-busy="true">
        <Brand />
        <div className="my-[50px] h-[130px] w-[250px] animate-loading rounded-[70px] bg-surface-raised" />
        <p>{rejoining ? 'Reentrando na mesa…' : 'Preparando a mesa…'}</p>
      </main>
    );

  if (!room || loadError)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center p-8 text-center">
        <Brand />
        <div className="mt-[55px] mb-6">
          <LargeIcon>
            <Users size={30} />
          </LargeIcon>
        </div>
        <h1 className="text-[28px]">Não encontramos essa mesa.</h1>
        <p className="max-w-[490px] text-muted">
          {loadError ||
            'A sala não existe neste navegador. Confira o convite ou crie um novo espaço para sua equipe.'}
        </p>
        <p className="text-xs text-muted">
          Nesta versão local, salas criadas em outros dispositivos não estão disponíveis.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-[43px] items-center justify-center gap-2.5 rounded-sm bg-primary px-[17px] py-2.5 text-[13px] font-semibold text-primary-ink hover:bg-primary-hover"
        >
          <ArrowLeft size={17} /> Voltar ao início
        </Link>
      </main>
    );

  if (!participant) return <JoinPage room={room} onJoin={setActor} />;

  return (
    <RoomPlaying
      room={room}
      participant={participant}
      presenceEnabled={presenceEnabled}
      panelOpen={panelOpen}
      panelTab={panelTab}
      modal={modal}
      busy={busy}
      error={error}
      run={run}
      setError={setError}
      mutate={mutate}
      leave={leave}
      setModal={setModal}
      openPanelTab={openPanelTab}
      setPanelOpen={setPanelOpen}
      setPanelTab={setPanelTab}
    />
  );
}

function RoomPlaying({
  room,
  participant,
  presenceEnabled,
  panelOpen,
  panelTab,
  modal,
  busy,
  error,
  run,
  setError,
  mutate,
  leave,
  setModal,
  openPanelTab,
  setPanelOpen,
  setPanelTab,
}: {
  room: Room;
  participant: Room['participants'][number];
  presenceEnabled: boolean;
  panelOpen: boolean;
  panelTab: SidePanelTab;
  modal: ModalType;
  busy: boolean;
  error: string;
  run: ReturnType<typeof useAction>['run'];
  setError: ReturnType<typeof useAction>['setError'];
  mutate: ReturnType<typeof useRoom>['mutate'];
  leave: () => Promise<void>;
  setModal: (modal: ModalType) => void;
  openPanelTab: (tab: SidePanelTab) => void;
  setPanelOpen: (open: boolean) => void;
  setPanelTab: (tab: SidePanelTab) => void;
}) {
  useRoomPresence(room.id, participant.id, presenceEnabled);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  const liveRoom = useMemo<Room>(
    () => ({
      ...room,
      participants: presentParticipants(room.participants, participant.id, now),
    }),
    [now, participant.id, room],
  );

  const { poke, shakingId } = useRoomPoke(
    room.id,
    { id: participant.id, name: participant.name },
    true,
  );
  const activeIssue = liveRoom.issues.find((issue) => issue.id === liveRoom.activeIssueId);
  const voted = liveRoom.participants.filter((entry) => !entry.spectator && entry.voted).length;
  const voters = liveRoom.participants.filter((entry) => !entry.spectator).length;

  function voteOptimistic(value: string) {
    void mutate(
      (current) => castVote(current, participant.id, value),
      () => planning.vote(room.id, participant.id, value),
    ).catch((voteError) => {
      setError(voteError instanceof Error ? voteError.message : 'Não foi possível registrar o voto.');
    });
  }

  async function sendMessageOptimistic(text: string, attachments: ChatAttachment[]) {
    const messageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await mutate(
      (current) => postChatMessage(current, participant.id, messageId, text, createdAt, attachments),
      () => planning.sendMessage(room.id, participant.id, text, attachments, messageId),
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <RoomHeader
        room={room}
        participant={participant}
        panelOpen={panelOpen}
        panelTab={panelTab}
        busy={busy}
        onLeave={() => void run(leave)}
        onToggleTimer={() => void run(() => planning.toggleTimer(room.id, participant.id))}
        onOpenModal={setModal}
        onOpenPanelTab={openPanelTab}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-10 max-[1200px]:px-7 max-[640px]:px-[18px]">
          <ToastViewport />
          <div className="flex shrink-0 items-center justify-between gap-4 pt-3">
            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Rodada {room.round}
              <span className="mx-0.5 text-border">/</span>
              <span className="text-muted">
                {room.revealed
                  ? 'Votos revelados'
                  : room.revealEndsAt
                    ? 'Revelando cartas…'
                    : 'Votação em andamento'}
              </span>
            </div>
            <TextButton className="text-[11px]" onClick={() => setModal('help')}>
              <CircleHelp size={15} />
              <span className="max-[640px]:hidden">Como jogar</span>
            </TextButton>
          </div>
          {error && <div className="mx-auto my-4 w-[min(600px,100%)]"><ErrorMessage message={error} /></div>}
          <VotingTable
            room={liveRoom}
            currentId={participant.id}
            busy={busy}
            shakingId={shakingId}
            onReveal={() => void run(() => planning.reveal(room.id, participant.id))}
            onCompleteReveal={() => {
              void planning.completeReveal(room.id, participant.id).catch(() => {});
            }}
            onRestart={() => void run(() => planning.restart(room.id, participant.id))}
            onInvite={() => setModal('invite')}
            onPoke={poke}
          />
          <div className="flex min-h-0 shrink-0 flex-col">
            {liveRoom.revealed ? (
              <>
                <Results room={liveRoom} />
                {activeIssue && (
                  <div className="mb-2.5 flex flex-col items-center gap-1.5">
                    <Button
                      variant="secondary"
                      onClick={() => void run(() => planning.finishIssue(room.id, participant.id))}
                      disabled={busy}
                    >
                      <Check size={16} /> Concluir história
                    </Button>
                    <small className="text-[10px] text-muted">
                      A média numérica será salva na história.
                    </small>
                  </div>
                )}
              </>
            ) : (
              <RoundProgress
                participants={liveRoom.participants.length}
                voted={voted}
                voters={voters}
              />
            )}
            <VotingDeck
              room={liveRoom}
              participant={participant}
              busy={Boolean(liveRoom.revealEndsAt)}
              onVote={voteOptimistic}
            />
            <footer className="mt-1.5 flex items-center gap-5 border-t border-border-subtle py-2.5 text-[9px] text-subtle">
              <span className="mr-auto flex items-center gap-1.5">
                <span className="inline-block h-1 w-1 rounded-full bg-success" /> Sincronizado em
                tempo real
              </span>
              <button
                className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-[9px] text-muted"
                onClick={() => setModal('history')}
              >
                Histórico de rodadas <History size={13} />
              </button>
              {room.ownerId === participant.id && (
                <button
                  className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-[9px] text-muted max-[640px]:hidden"
                  onClick={() => setModal('settings')}
                >
                  <Settings2 size={13} /> Configurações
                </button>
              )}
            </footer>
          </div>
        </main>
        {panelOpen && (
          <SidePanel
            room={room}
            participant={participant}
            tab={panelTab}
            onTabChange={setPanelTab}
            onClose={() => setPanelOpen(false)}
            onSendMessage={sendMessageOptimistic}
          />
        )}
      </div>
      {modal === 'invite' && <InviteModal room={room} onClose={() => setModal(null)} />}
      {modal === 'settings' && (
        <SettingsModal room={room} actor={participant.id} onClose={() => setModal(null)} />
      )}
      {modal === 'profile' && (
        <ProfileModal
          room={room}
          participant={participant}
          onClose={() => setModal(null)}
          onLeave={() => void run(leave)}
        />
      )}
      {modal === 'history' && <HistoryModal room={room} onClose={() => setModal(null)} />}
      {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
    </div>
  );
}
