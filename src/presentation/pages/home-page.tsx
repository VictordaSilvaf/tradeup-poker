import { useEffect, useState, type FormEvent } from 'react';
import { CircleHelp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { planning } from '../../app/dependencies';
import type { DeckId, Room } from '../../domain/room';
import { recentRooms } from '../../infra/recent-rooms';
import { parseRoomCode, session } from '../../infra/session';
import { HomeHero, RoomEntryForm } from '../components/lobby';
import { HelpModal } from '../components/modals';
import { Brand, Footer, TextButton } from '../components/ui';
import { useAction } from '../hooks/use-action';

export function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [deck, setDeck] = useState<DeckId>('fibonacci');
  const [recent, setRecent] = useState<Room[]>([]);
  const [help, setHelp] = useState(false);
  const [storageError, setStorageError] = useState('');
  const { run, busy, error, clearError } = useAction();

  useEffect(() => {
    void planning
      .listRooms(recentRooms.read())
      .then(setRecent)
      .catch((listError) => setStorageError(listError.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const result =
        mode === 'create'
          ? await planning.createRoom(roomName, playerName, deck)
          : await planning.joinRoom(parseRoomCode(roomCode), playerName);
      try {
        session.save(result.room.id, result.participant);
        recentRooms.remember(result.room.id);
      } catch (saveError) {
        await planning.leave(result.room.id, result.participant.id);
        throw saveError;
      }
      navigate(`/sala/${result.room.id}`);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px] flex-col">
      <header className="flex min-h-[100px] items-center justify-between px-[5.7%] py-[25px]">
        <Brand />
        <TextButton onClick={() => setHelp(true)}>
          <CircleHelp size={17} /> Como funciona
        </TextButton>
      </header>
      <main className="mx-auto mb-[60px] mt-[35px] grid w-[min(1130px,88.6%)] flex-1 grid-cols-[1.1fr_1fr] items-center gap-[9%] max-[980px]:grid-cols-1">
        <HomeHero />
        <RoomEntryForm
          mode={mode}
          roomName={roomName}
          playerName={playerName}
          roomCode={roomCode}
          deck={deck}
          recent={recent}
          busy={busy}
          error={error}
          storageError={storageError}
          onModeChange={(next) => {
            setMode(next);
            clearError();
          }}
          onRoomNameChange={setRoomName}
          onPlayerNameChange={setPlayerName}
          onRoomCodeChange={setRoomCode}
          onDeckChange={setDeck}
          onSubmit={submit}
          onOpenRecent={(roomId) => navigate(`/sala/${roomId}`)}
        />
      </main>
      <Footer />
      {help && <HelpModal onClose={() => setHelp(false)} />}
    </div>
  );
}
