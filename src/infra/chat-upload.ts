import { DomainError, MAX_CHAT_FILE_BYTES, type ChatAttachment } from '../domain/room';
import { hasSupabaseEnv } from './env';
import { getSupabase } from './supabase-client';

const BUCKET = 'chat-attachments';
const LOCAL_MAX_BYTES = 700_000;

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-()\sÀ-ÿ]/gi, '_').slice(0, 100) || 'arquivo';
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new DomainError('Não foi possível ler o arquivo.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function uploadChatFile(roomId: string, file: File): Promise<ChatAttachment> {
  if (file.size <= 0) throw new DomainError('Arquivo vazio.');
  if (file.size > MAX_CHAT_FILE_BYTES) {
    throw new DomainError('Cada arquivo pode ter no máximo 5 MB.');
  }

  const id = crypto.randomUUID();
  const name = sanitizeFileName(file.name);

  if (!hasSupabaseEnv()) {
    if (file.size > LOCAL_MAX_BYTES) {
      throw new DomainError(
        'No modo local, use arquivos de até 700 KB ou configure o Supabase para anexos maiores.',
      );
    }
    return {
      id,
      kind: 'file',
      name,
      url: await fileToDataUrl(file),
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    };
  }

  const path = `${roomId}/${id}-${name}`;
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    throw new DomainError(
      error.message.includes('Bucket not found')
        ? 'Bucket de anexos ainda não está configurado no Supabase.'
        : `Falha ao enviar arquivo: ${error.message}`,
    );
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    id,
    kind: 'file',
    name,
    url: data.publicUrl,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  };
}

export function createChatLinkAttachment(rawUrl: string, label?: string): ChatAttachment {
  const url = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new DomainError('Informe um link válido (http ou https).');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new DomainError('Informe um link válido (http ou https).');
  }
  return {
    id: crypto.randomUUID(),
    kind: 'link',
    name: (label?.trim() || parsed.hostname + parsed.pathname).slice(0, 120),
    url: parsed.toString(),
  };
}
