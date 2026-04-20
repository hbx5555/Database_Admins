import { supabase } from './supabase'
import type { Project, ProjectInsert, ProjectUpdate } from '../types/project'

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Project[]
}

export async function createProject(row: ProjectInsert): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function updateProject(id: string, changes: ProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(changes)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
