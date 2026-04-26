import { supabase } from './supabase'

// Shared upload utility for any table's file attachments.
// Path in the 'documents' bucket: {table}/{recordId}/{filename}
export async function uploadDocument(
  table: string,
  recordId: string,
  file: File,
): Promise<{ url: string; filename: string }> {
  const path = `${table}/${recordId}/${file.name}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return { url: data.publicUrl, filename: file.name }
}

export async function deleteDocument(
  table: string,
  recordId: string,
  filename: string,
): Promise<void> {
  const path = `${table}/${recordId}/${filename}`
  const { error } = await supabase.storage.from('documents').remove([path])
  if (error) throw new Error(error.message)
}
