
// API calls for announcements

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async (id: string): Promise<void> => {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete announcement');
  }
};

/**
 * Publish an announcement
 */
export const publishAnnouncement = async (id: string): Promise<void> => {
  const response = await fetch(`/api/announcements/${id}/publish`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to publish announcement');
  }
};
