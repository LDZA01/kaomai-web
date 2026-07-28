import { isSupabaseConfigured, supabase } from './supabase';
import { sanitizeDocumentFileName } from './resident-intake';
import type { DocumentCategory, ResidentDocument } from '@/types';

const BUCKET = 'resident-documents';

type ResidentDocumentRow = {
  id: string;
  resident_id: string;
  category: DocumentCategory;
  original_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
};

function toResidentDocument(row: ResidentDocumentRow): ResidentDocument {
  return {
    id: row.id,
    residentId: row.resident_id,
    category: row.category,
    originalName: row.original_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
  };
}

export async function getResidentDocuments(residentId: string): Promise<ResidentDocument[]> {
  if (!residentId || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('resident_documents')
    .select('*')
    .eq('resident_id', residentId)
    .order('created_at');

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toResidentDocument(row as ResidentDocumentRow));
}

export async function uploadResidentDocument(
  shelterId: string,
  residentId: string,
  file: File,
  category: DocumentCategory,
): Promise<ResidentDocument> {
  const documentId = crypto.randomUUID();
  const storagePath = `${shelterId}/${residentId}/${documentId}-${sanitizeDocumentFileName(file.name)}`;

  if (!isSupabaseConfigured) {
    return {
      id: documentId,
      residentId,
      category,
      originalName: file.name,
      storagePath: URL.createObjectURL(file),
      mimeType: file.type,
      sizeBytes: file.size,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error: metadataError } = await supabase
    .from('resident_documents')
    .insert({
      id: documentId,
      resident_id: residentId,
      category,
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (metadataError || !data) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(metadataError?.message ?? 'ไม่สามารถบันทึกข้อมูลเอกสารได้');
  }

  return toResidentDocument(data as ResidentDocumentRow);
}

export async function deleteResidentDocument(document: ResidentDocument): Promise<void> {
  if (!isSupabaseConfigured) {
    if (document.storagePath.startsWith('blob:')) URL.revokeObjectURL(document.storagePath);
    return;
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([document.storagePath]);

  if (storageError) throw new Error(storageError.message);

  const { error: metadataError } = await supabase
    .from('resident_documents')
    .delete()
    .eq('id', document.id);

  if (metadataError) throw new Error(metadataError.message);
}

export async function createResidentDocumentDownloadUrl(storagePath: string): Promise<string> {
  if (!isSupabaseConfigured) return storagePath;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'ไม่สามารถเปิดเอกสารได้');
  }
  return data.signedUrl;
}
