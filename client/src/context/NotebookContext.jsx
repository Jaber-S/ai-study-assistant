import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export const NotebookContext = createContext();

/**
 * NotebookProvider - Global state management for notebooks
 * Provides notebooks list, active notebook, and CRUD operations
 * Syncs with Supabase for permanent storage
 */
export function NotebookProvider({ children, userId }) {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebookId, setActiveNotebookId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedForUser, setHasLoadedForUser] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [shouldSkipSave, setShouldSkipSave] = useState(true);
  const [lastCreatedNotebookId, setLastCreatedNotebookId] = useState(null);

  // Load notebooks from Supabase when userId changes
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

    const loadFromSupabase = async () => {
      const loadFromLocalStorage = () => {
        console.log('[NotebookContext] Loading from localStorage');
        const key = `notebooks_${userId}`;
        const activeKey = `activeNotebook_${userId}`;

        try {
          const savedNotebooks = localStorage.getItem(key);
          const savedActiveId = localStorage.getItem(activeKey);

          if (savedNotebooks) {
            const parsedNotebooks = JSON.parse(savedNotebooks);
            console.log('[NotebookContext] Loaded notebooks from localStorage:', parsedNotebooks);
            setNotebooks(parsedNotebooks);

            if (savedActiveId && parsedNotebooks.find(nb => nb.id === savedActiveId)) {
              setActiveNotebookId(savedActiveId);
            } else {
              setActiveNotebookId(null);
            }
          } else {
            setNotebooks([]);
            setActiveNotebookId(null);
          }
        } catch (error) {
          console.error('[NotebookContext] Error parsing notebooks from localStorage:', error);
          setNotebooks([]);
          setActiveNotebookId(null);
        }
      };

      try {
        let loaded = false;

        if (supabase?.from) {
          const { data, error } = await supabase
            .from('notebooks')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

          if (error) {
            console.warn('[NotebookContext] Error loading from Supabase, falling back to localStorage:', error);
          } else if (Array.isArray(data) && data.length > 0) {
            loaded = true;
            console.log('[NotebookContext] Loaded notebooks from Supabase:', data);

            const parsedNotebooks = data.map(nb => ({
              ...nb,
              sources: typeof nb.sources === 'string' ? JSON.parse(nb.sources || '[]') : (nb.sources || []),
              chatHistory: typeof nb.chat_history === 'string' ? JSON.parse(nb.chat_history || '[]') : (nb.chat_history || []),
              summaryData: nb.summary_data || '',
              quizData: typeof nb.quiz_data === 'string' ? JSON.parse(nb.quiz_data || '[]') : (nb.quiz_data || []),
              flashcardsData: typeof nb.flashcards_data === 'string' ? JSON.parse(nb.flashcards_data || '[]') : (nb.flashcards_data || []),
              createdAt: nb.createdAt || nb.created_at,
              updatedAt: nb.updatedAt || nb.updated_at,
            }));

            setNotebooks(parsedNotebooks);

            const activeKey = `activeNotebook_${userId}`;
            const savedActiveId = localStorage.getItem(activeKey);
            if (savedActiveId && parsedNotebooks.find(nb => nb.id === savedActiveId)) {
              setActiveNotebookId(savedActiveId);
            } else {
              setActiveNotebookId(null);
            }
          }
        }

        if (!loaded) {
          console.log('[NotebookContext] Supabase unavailable/empty/error, using localStorage');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('[NotebookContext] Error loading notebooks (unexpected), falling back to localStorage:', error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
        setIsLoadingData(false);
        setShouldSkipSave(false);
        console.log('[NotebookContext] Data load complete, saves enabled');
        setHasLoadedForUser(userId);
      }
    };

    loadFromSupabase();
  }, [userId]);

  // Save notebooks to Supabase and localStorage whenever they change
  useEffect(() => {
    if (!userId || shouldSkipSave) {
      console.log('[NotebookContext] Skipping save:', { userId, shouldSkipSave });
      return;
    }

    const saveToSupabase = async () => {
      try {
        // Save each notebook to Supabase
        for (const notebook of notebooks) {
          const { data, error } = await supabase
            .from('notebooks')
            .upsert({
              id: notebook.id,
              user_id: userId,
              title: notebook.title,
              description: notebook.description,
              sources: JSON.stringify(notebook.sources || []),
              notes: notebook.notes,
              chat_history: JSON.stringify(notebook.chatHistory || []),
              summary_data: notebook.summaryData || '',
              quiz_data: JSON.stringify(notebook.quizData || []),
              flashcards_data: JSON.stringify(notebook.flashcardsData || []),
              created_at: notebook.createdAt,
              updated_at: notebook.updatedAt,
            });
          
          if (error) {
            console.warn('[NotebookContext] Error saving notebook to Supabase:', error);
          } else {
            console.log('[NotebookContext] Notebook saved to Supabase:', notebook.id);
          }
        }
      } catch (error) {
        console.error('[NotebookContext] Error saving to Supabase:', error);
      }
    };

    // Save to Supabase if available
    if (supabase.from) {
      saveToSupabase();
    }

    // Also save to localStorage as fallback
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
      summaryData: '',
      quizData: [],
      flashcardsData: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('[NotebookContext] New notebook created:', newNotebook);
    setNotebooks(prev => {
      console.log('[NotebookContext] Updating notebooks state with new notebook');
      return [newNotebook, ...prev];
    });
    setActiveNotebookId(newNotebook.id);
    setLastCreatedNotebookId(newNotebook.id);
    return newNotebook;
  }, []);

  const clearLastCreatedNotebookId = useCallback(() => {
    setLastCreatedNotebookId(null);
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
   * Update summary data for a notebook
   */
  const updateSummaryData = useCallback((notebookId, summaryData) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? { ...nb, summaryData, updatedAt: new Date().toISOString() }
          : nb
      )
    );
  }, []);

  /**
   * Update quiz data for a notebook
   */
  const updateQuizData = useCallback((notebookId, quizData) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? { ...nb, quizData, updatedAt: new Date().toISOString() }
          : nb
      )
    );
  }, []);

  /**
   * Update flashcards data for a notebook
   */
  const updateFlashcardsData = useCallback((notebookId, flashcardsData) => {
    setNotebooks(prev =>
      prev.map(nb =>
        nb.id === notebookId
          ? { ...nb, flashcardsData, updatedAt: new Date().toISOString() }
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
    lastCreatedNotebookId,

    // Actions
    createNotebook,
    deleteNotebook,
    updateNotebookMetadata,
    addSource,
    removeSource,
    updateNotes,
    addChatMessage,
    clearChatHistory,
    updateSummaryData,
    updateQuizData,
    updateFlashcardsData,
    setActiveNotebookId,
    getActiveNotebook,
    clearLastCreatedNotebookId
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
