const supabase = require('../config/supabase');

/**
 * CONTACT SERVICE
 * Handles contact form submissions
 */

class ContactService {

  /**
   * Insert contact form submission into database
   */
  async createContact(contactData) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single();

    if (error) {
      console.error('CONTACT INSERT ERROR:', error);
      throw error;
    }

    return data;
  }
}

module.exports = new ContactService();