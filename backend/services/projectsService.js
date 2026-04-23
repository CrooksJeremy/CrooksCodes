const supabase = require('../config/supabase');

/**
 * PROJECTS SERVICE
 * Handles all database operations for projects
 */

class ProjectsService {
  
  // GET ALL PROJECTS
  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SUPABASE GET ALL ERROR:', error);
      throw error;
    }

    return data;
  }

  // GET PROJECT BY ID
  async getProjectById(id) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('SUPABASE GET BY ID ERROR:', error);
      throw error;
    }

    return data;
  }

  // CREATE PROJECT
  async createProject(projectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE CREATE ERROR:', error);
      throw error;
    }

    return data;
  }

  // UPDATE PROJECT
  async updateProject(id, projectData) {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('SUPABASE UPDATE ERROR:', error);
      throw error;
    }

    return data;
  }

  // DELETE PROJECT
  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('SUPABASE DELETE ERROR:', error);
      throw error;
    }

    return true;
  }
}

module.exports = new ProjectsService();