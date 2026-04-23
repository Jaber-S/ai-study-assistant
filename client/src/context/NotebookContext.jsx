import React, { createContext, useState, useEffect, useCallback } from 'react';

export const NotebookContext = createContext();

/**
 * NotebookProvider - Global state management for notebooks
 * Provides notebooks list, active notebook, and CRUD operations
 */
export function NotebookProvider({ children, userId }) {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebookId, setActiveNotebookId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedForUser, setHasLoadedForUser] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [shouldSkipSave, setShouldSkipSave] = useState(true);

  // Load notebooks from localStorage when userId changes
  useEffect(() => {
    console.log('[NotebookContext] Load effect triggered with userId:', userId, 'hasLoadedForUser:', hasLoadedForUser);
    
    // If no userId, mark as loaded
    if (!userId) {
      console.log('[NotebookContext] No userId, clearing notebooks');
      setIsLoading(false);
      setHasLoadedForUser(null);
      setNotebooks([]);
      setActiveNotebookId(null);
      setShouldSkipSave(true);
      return;
    }

    // Skip if we've already loaded for this user
    if (hasLoadedForUser === userId) {
      console.log('[NotebookContext] Already loaded for this userId, skipping');
      return;
    }

    // Mark that we're loading data
    console.log('[NotebookContext] Starting data load, skipping saves temporarily');
    setShouldSkipSave(true);
    setIsLoadingData(true);
    setIsLoading(true);

    try {
      const key = `notebooks_${userId}`;
      const activeKey = `activeNotebook_${userId}`;
      
      const savedNotebooks = localStorage.getItem(key);
      const savedActiveId = localStorage.getItem(activeKey);
      
      console.log('[NotebookContext] Found in localStorage:', { 
        notebooksCount: savedNotebooks ? JSON.parse(savedNotebooks).length : 0,
        activeId: savedActiveId
      });

      if (savedNotebooks) {
        const parsedNotebooks = JSON.parse(savedNotebooks);
        console.log('[NotebookContext] Loaded notebooks:', parsedNotebooks);
        setNotebooks(parsedNotebooks);
        
        // Set active notebook if previously saved and still exists
        if (savedActiveId && parsedNotebooks.find(nb => nb.id === savedActiveId)) {
          console.log('[NotebookContext] Setting active notebook:', savedActiveId);
          setActiveNotebookId(savedActiveId);
        } else {
          console.log('[NotebookContext] No valid active notebook to restore');
          setActiveNotebookId(null);
        }
      } else {
        // No saved notebooks for this user - this is normal on first login
        console.log('[NotebookContext] No saved notebooks for this user (first login?)');
        setNotebooks([]);
        setActiveNotebookId(null);
      }
    } catch (error) {
      console.error('[NotebookContext] Error loading notebooks from localStorage:', error);
      setNotebooks([]);
      setActiveNotebookId(null);
    } finally {
      setIsLoading(false);
      setIsLoadingData(false);
      setShouldSkipSave(false); // Now allow saves
      console.log('[NotebookContext] Data load complete, saves enabled');
      setHasLoadedForUser(userId);
    }
  }, [userId]);

  // Save notebooks to localStorage whenever they change
  useEffect(() => {
    if (!userId || shouldSkipSave) {
      console.log('[NotebookContext] Skipping save:', { userId, shouldSkipSave });
      return;
    }

    try {
      const key = `notebooks_${userId}`;
      console.log('[NotebookContext] Saving notebooks to localStorage:', {
        key,
        count: notebooks.length,
        notebooks: notebooks.map(nb => ({ id: nb.id, title: nb.title }))
      });
      localStorage.setItem(key, JSON.stringify(notebooks));
    } catch (error) {
      console.error('[NotebookContext] Error saving notebooks to localStorage:', error);
    }
  }, [notebooks, userId, shouldSkipSave]);

  // Save active notebook ID whenever it changes
  useEffect(() => {
    if (!userId || shouldSkipSave) {
      console.log('[NotebookContext] Skipping active notebook save:', { userId, shouldSkipSave });
      return;
    }

    try {
      const activeKey = `activeNotebook_${userId}`;
      console.log('[NotebookContext] Saving active notebook:', { activeKey, activeNotebookId });
      if (activeNotebookId) {
        localStorage.setItem(activeKey, activeNotebookId);
      } else {
        localStorage.removeItem(activeKey);
      }
    } catch (error) {
      console.error('[NotebookContext] Error saving active notebook to localStorage:', error);
    }
  }, [activeNotebookId, userId, shouldSkipSave]);

  /**
   * Create a new notebook
   */
  const createNotebook = useCallback((title, description = '') => {
    console.log('[NotebookContext] Creating notebook:', { title, description });
    const newNotebook = {
      id: `nb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      sources: [],
      notes: '',
      chatHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('[NotebookContext] New notebook created:', newNotebook);
    setNotebooks(prev => {
      console.log('[NotebookContext] Updating notebooks state with new notebook');
      return [newNotebook, ...prev];
    });
    setActiveNotebookId(newNotebook.id);
    return newNotebook;
  }, []);

  /**
   * Delete a notebook
   */
  const deleteNotebook = useCallback((notebookId) => {
    setNotebooks(prev => prev.filter(nb => nb.id !== notebookId));
    
    // If deleted notebook was active, clear active state
    if (activeNotebookId === notebookId) {
      setActiveNotebookId(null);
    }
  }, [activeNotebookId]);

  /**
   * Update notebook metadata (title, description)
   */
  const updateNotebookMetadata = useCallback((notebookId, updates) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? { ...nb, ...updates, updatedAt: new Date().toISOString() }
          : nb
      )
    );
  }, []);

  /**
   * Add a source file to a notebook
   */
  const addSource = useCallback((notebookId, source) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              sources: [...nb.sources, source],
              updatedAt: new Date().toISOString()
            }
          : nb
      )
    );
  }, []);

  /**
   * Remove a source from a notebook
   */
  const removeSource = useCallback((notebookId, sourceId) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              sources: nb.sources.filter(s => s.id !== sourceId),
              updatedAt: new Date().toISOString()
            }
          : nb
      )
    );
  }, []);

  /**
   * Update notebook notes
   */
  const updateNotes = useCallback((notebookId, notes) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? { ...nb, notes, updatedAt: new Date().toISOString() }
          : nb
      )
    );
  }, []);

  /**
   * Add chat message to notebook history
   */
  const addChatMessage = useCallback((notebookId, message) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              chatHistory: [...nb.chatHistory, message],
              updatedAt: new Date().toISOString()
            }
          : nb
      )
    );
  }, []);

  /**
   * Clear chat history for a notebook
   */
  const clearChatHistory = useCallback((notebookId) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? { ...nb, chatHistory: [], updatedAt: new Date().toISOString() }
          : nb
      )
    );
  }, []);

  /**
   * Get current active notebook
   */
  const getActiveNotebook = useCallback(() => {
    return notebooks.find(nb => nb.id === activeNotebookId) || null;
  }, [notebooks, activeNotebookId]);

  const value = {
    // State
    notebooks,
    activeNotebookId,
    isLoading,
    activeNotebook: getActiveNotebook(),

    // Actions
    createNotebook,
    deleteNotebook,
    updateNotebookMetadata,
    addSource,
    removeSource,
    updateNotes,
    addChatMessage,
    clearChatHistory,
    setActiveNotebookId,
    getActiveNotebook
  };

  return (
    <NotebookContext.Provider value={value}>
      {children}
    </NotebookContext.Provider>
  );
}

/**
 * Custom hook to use notebook context
 */
export function useNotebooks() {
  const context = React.useContext(NotebookContext);
  if (!context) {
    throw new Error('useNotebooks must be used within NotebookProvider');
  }
  return context;
}
