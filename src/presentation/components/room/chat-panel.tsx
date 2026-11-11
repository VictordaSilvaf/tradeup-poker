import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import { planning } from '../../../app/dependencies';
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_MESSAGE_LENGTH,
  type ChatAttachment,
  type Participant,
  type Room,
} from '../../../domain/room';
import { createChatLinkAttachment, uploadChatFile } from '../../../infra/chat-upload';
import { useAction } from '../../hooks/use-action';
import { useChatTyping } from '../../hooks/use-chat-typing';
import { renderMessageText } from '../../lib/chat-links';
import { cn } from '../../lib/cn';
import { Avatar, ErrorMessage } from '../ui';

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  } catch {
    return '';
  }
}

function formatBytes(size?: number) {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(attachment: ChatAttachment) {
  return Boolean(attachment.mimeType?.startsWith('image/'));
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove?: () => void;
}) {
  return (
    <div className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-surface-raised px-2 py-1 text-[10px]">
      {attachment.kind === 'link' ? (
        <Link2 size={12} className="text-primary" />
      ) : isImage(attachment) ? (
        <ImageIcon size={12} className="text-primary" />
      ) : (
        <FileText size={12} className="text-primary" />
      )}
      <span className="min-w-0 truncate">{attachment.name}</span>
      {attachment.kind === 'file' && attachment.size ? (
        <span className="text-muted">{formatBytes(attachment.size)}</span>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          aria-label="Remover anexo"
          className="grid h-4 w-4 place-items-center rounded-full border-0 bg-transparent p-0 text-muted hover:text-text"
          onClick={onRemove}
        >
          <X size={11} />
        </button>
      ) : null}
    </div>
  );
}

function MessageAttachments({
  attachments,
  mine,
}: {
  attachments: ChatAttachment[];
  mine: boolean;
}) {
  if (!attachments.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {attachments.map((attachment) =>
        attachment.kind === 'file' && isImage(attachment) ? (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-sm"
          >
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-h-40 w-full object-cover"
            />
          </a>
        ) : (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-[11px]',
              mine ? 'bg-primary-ink/15 text-primary-ink' : 'bg-bg text-text',
            )}
          >
            {attachment.kind === 'link' ? <ExternalLink size={13} /> : <FileText size={13} />}
            <span className="min-w-0 truncate underline-offset-2 hover:underline">
              {attachment.name}
            </span>
          </a>
        ),
      )}
    </div>
  );
}

export function ChatPanel({
  room,
  participant,
  active,
}: {
  room: Room;
  participant: Participant;
  active: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const { run, busy, error, setError } = useAction();
  const { typingUsers, notifyTyping } = useChatTyping(
    room.id,
    { id: participant.id, name: participant.name },
    active,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const canSend = Boolean(draft.trim() || pending.length) && !busy && !uploading;

  useEffect(() => {
    if (!active) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [active, room.messages.length, typingUsers.length]);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    const text = draft;
    const attachments = pending;
    void run(async () => {
      await planning.sendMessage(room.id, participant.id, text, attachments);
      setDraft('');
      setPending([]);
      setLinkOpen(false);
      setLinkValue('');
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) submit();
    }
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_CHAT_ATTACHMENTS - pending.length;
    if (remaining <= 0) {
      setError(`Envie no máximo ${MAX_CHAT_ATTACHMENTS} anexos por mensagem.`);
      return;
    }
    setUploading(true);
    try {
      const selected = [...files].slice(0, remaining);
      const uploaded: ChatAttachment[] = [];
      for (const file of selected) {
        uploaded.push(await uploadChatFile(room.id, file));
      }
      setPending((current) => [...current, ...uploaded]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao anexar arquivo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function addLink() {
    try {
      const attachment = createChatLinkAttachment(linkValue);
      if (pending.length >= MAX_CHAT_ATTACHMENTS) {
        setError(`Envie no máximo ${MAX_CHAT_ATTACHMENTS} anexos por mensagem.`);
        return;
      }
      setPending((current) => [...current, attachment]);
      setLinkValue('');
      setLinkOpen(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link inválido.');
    }
  }

  const typingLabel =
    typingUsers.length === 0
      ? ''
      : typingUsers.length === 1
        ? `${typingUsers[0].name} está digitando`
        : typingUsers.length === 2
          ? `${typingUsers[0].name} e ${typingUsers[1].name} estão digitando`
          : 'Várias pessoas estão digitando';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-[11px] text-muted">Conversa em tempo real com a mesa.</p>

      <div ref={listRef} className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        {!room.messages.length && (
          <div className="m-auto flex max-w-[220px] flex-col items-center px-2 py-10 text-center">
            <MessageSquare size={28} strokeWidth={1.3} className="text-muted" />
            <p className="mt-3 text-[12px] font-medium">Comece a conversa</p>
            <p className="mt-1 text-[11px] text-muted">
              Envie texto, links e arquivos para alinhar a estimativa sem sair da mesa.
            </p>
          </div>
        )}

        {room.messages.map((message) => {
          const mine = message.authorId === participant.id;
          return (
            <div
              key={message.id}
              className={cn(
                'flex max-w-[92%] gap-2',
                mine ? 'ml-auto flex-row-reverse animate-chat-out' : 'animate-chat-in',
              )}
            >
              {!mine && <Avatar name={message.authorName} small />}
              <div
                className={cn(
                  'rounded-md px-2.5 py-2',
                  mine
                    ? 'rounded-br-sm bg-primary text-primary-ink'
                    : 'rounded-bl-sm bg-surface-raised text-text',
                )}
              >
                {!mine && (
                  <strong className="mb-0.5 block text-[10px] font-semibold opacity-80">
                    {message.authorName}
                  </strong>
                )}
                {message.text ? (
                  <p className="m-0 whitespace-pre-wrap break-words text-[12px] leading-relaxed">
                    {renderMessageText(message.text)}
                  </p>
                ) : null}
                <MessageAttachments attachments={message.attachments ?? []} mine={mine} />
                <time
                  className={cn(
                    'mt-1 block text-[9px]',
                    mine ? 'text-primary-ink/70' : 'text-muted',
                  )}
                  dateTime={message.createdAt}
                >
                  {formatTime(message.createdAt)}
                </time>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 animate-chat-in">
            <Avatar name={typingUsers[0].name} small />
            <div className="rounded-md rounded-bl-sm bg-surface-raised px-2.5 py-2">
              <div className="flex items-center gap-1" aria-label={typingLabel}>
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot [animation-delay:140ms]" />
                <span className="chat-typing-dot [animation-delay:280ms]" />
              </div>
              <p className="m-0 mt-1 text-[10px] text-muted">{typingLabel}</p>
            </div>
          </div>
        )}
      </div>

      <form
        className="mt-3 shrink-0 border-t border-border-subtle pt-3"
        onSubmit={submit}
        aria-busy={busy || uploading}
      >
        {pending.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pending.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={() =>
                  setPending((current) => current.filter((item) => item.id !== attachment.id))
                }
              />
            ))}
          </div>
        )}

        <div className="rounded-md border border-border bg-bg focus-within:border-primary">
          <label htmlFor={formId} className="sr-only">
            Mensagem
          </label>
          <textarea
            id={formId}
            ref={inputRef}
            rows={2}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            placeholder="Escreva, cole um link ou anexe um arquivo…"
            value={draft}
            disabled={busy}
            onChange={(event) => {
              setDraft(event.target.value);
              notifyTyping();
            }}
            onKeyDown={onKeyDown}
            className="min-h-[52px] max-h-[110px] w-full resize-none border-0 bg-transparent px-3 py-2.5 text-[12px] text-text outline-none focus:border-transparent focus:outline-none focus:ring-0"
          />

          {linkOpen && (
            <div className="flex items-center gap-2 border-t border-border-subtle px-2.5 py-2">
              <Link2 size={14} className="text-muted" />
              <input
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                placeholder="https://…"
                className="h-8 flex-1 rounded-sm border border-border bg-surface px-2 text-[12px]"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addLink();
                  }
                }}
              />
              <button
                type="button"
                className="h-8 rounded-sm border-0 bg-primary px-2.5 text-[11px] font-semibold text-primary-ink"
                onClick={addLink}
              >
                Adicionar
              </button>
            </div>
          )}

          <div className="flex h-11 items-center gap-1 border-t border-border-subtle px-1.5">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
              onChange={(event) => void onPickFiles(event.target.files)}
            />
            <button
              type="button"
              aria-label="Anexar arquivo"
              title="Anexar arquivo"
              disabled={uploading || pending.length >= MAX_CHAT_ATTACHMENTS}
              className="grid h-8 w-8 place-items-center rounded-sm border-0 bg-transparent text-muted hover:bg-surface-raised hover:text-text disabled:opacity-40"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              aria-label="Adicionar link"
              title="Adicionar link"
              disabled={pending.length >= MAX_CHAT_ATTACHMENTS}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-sm border-0 bg-transparent text-muted hover:bg-surface-raised hover:text-text disabled:opacity-40',
                linkOpen && 'bg-surface-raised text-text',
              )}
              onClick={() => setLinkOpen((open) => !open)}
            >
              <Link2 size={16} />
            </button>
            <span className="ml-auto mr-1 text-[10px] text-subtle">
              {draft.length}/{MAX_CHAT_MESSAGE_LENGTH}
            </span>
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Enviar mensagem"
              className="grid h-8 w-8 place-items-center rounded-sm border-0 bg-primary text-primary-ink disabled:opacity-45"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
        <ErrorMessage message={error} />
      </form>
    </div>
  );
}
