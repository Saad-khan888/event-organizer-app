import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// -----------------------------------------------------------------------------
// DATA CONTEXT (The App's "Store")
// -----------------------------------------------------------------------------
// This file manages ALL the data for the application: Events, Reports, and User Profiles.
// Instead of fetching data in every single component, we fetch it ONCE here
// and share it with everyone using React Context.

// 1. Create Context
const DataContext = createContext();

// 2. Custom Hook
// Any component can use `useData()` to access events, reports, etc.
export const useData = () => useContext(DataContext);

// 3. Provider Component
export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  // -------------------
  // A. STATE VARIABLES
  // -------------------
  // These hold the "live" lists of items from the database.
  // When these change (e.g. someone adds an event), all components using them re-render automatically.
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------
  // B. DATA LOADING LOGIC
  // -------------------

  // Function to fetch data from Supabase
  // We use useCallback so this function can be safely used in useEffect without causing loops
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching global data (Events, Reports, Users)...');

      // Fetch ALL records from the 'events' table
      const { data: eventsList, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch ALL from 'reports'
      const { data: reportsList, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch ALL from 'users'
      const { data: usersList, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Update our state variables with the fetched data
      setEvents(eventsList || []);
      setReports(reportsList || []);
      setUsers(usersList || []);

      console.log('✅ Global data loaded successfully');
    } catch (err) {
      console.error('❌ Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // This effect runs on startup AND whenever the user logs in/out.
  // Re-fetching on user change is CRITICAL for RLS (Row Level Security) 
  // because Supabase returns different data depending on who is asking.
  useEffect(() => {
    fetchData();
  }, [fetchData, user?.id]);

  // -------------------
  // D. HELPER FUNCTIONS (API Calls)
  // -------------------
  // These functions allow components to modify data easily.

  // 1. Add Event (Create)
  const addEvent = async (eventData) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      setEvents((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Failed to add event:', err);
      throw err;
    }
  };

  // 2. Update Event
  const updateEvent = async (id, data) => {
    try {
      const { data: updated, error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    } catch (err) {
      console.error('Failed to update event:', err);
      throw err;
    }
  };

  // 3. Add Report (Create)
  const addReport = async (reportData) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          ...reportData,
          date: reportData.date || new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setReports((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Failed to add report:', err);
      throw err;
    }
  };

  // 4. Update User (Edit Profile)
  const updateUser = async (id, data) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Update failed:', err);
      throw err;
    }
  };

  // 5. Join Event (Unique Logic)
  // This now uses a secure RPC function to bypass RLS restrictions for Athletes.
  const joinEvent = async (eventId, userId) => {
    try {
      console.log('🎯 Attempting to join event:', eventId, 'for user:', userId);
      
      // Call the RPC function created via SQL
      const { data, error } = await supabase.rpc('join_event_direct', {
        p_event_id: eventId,
        p_user_id: userId
      });

      if (error) {
        console.error('❌ RPC error:', error);
        throw error;
      }

      console.log('📦 RPC response:', data);

      if (data.success) {
        // Update local state with the returned event data
        const updatedEvent = data.data;
        console.log('✅ Event joined successfully:', updatedEvent);
        console.log('📋 Current events before update:', events.length);
        
        // Update the events array with the new event data
        setEvents((prev) => {
          const newEvents = prev.map((e) => {
            // Use string comparison to ensure match
            if (String(e.id) === String(eventId)) {
              console.log('🔄 Replacing event:', e.id, 'with updated data');
              return updatedEvent;
            }
            return e;
          });
          console.log('📋 Events after update:', newEvents.length);
          return newEvents;
        });
        
        return { success: true, data: updatedEvent };
      } else {
        console.error('❌ Join failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('❌ Failed to join event:', err);
      return { success: false, error: err.message };
    }
  };

  // 6. Delete Operations
  const deleteEvent = async (id) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data?.id) {
        setEvents((prev) => prev.filter((e) => e.id !== data.id));
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error('Delete event failed:', err);
    }
  };

  const deleteReport = async (id) => {
    try {
      console.log('Attempting to delete report:', id);

      const { data, error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Delete successful, data:', data);

      // Update local state to remove the deleted report
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete report failed:', err);
      alert('Failed to delete report: ' + err.message);
    }
  };

  const removeUser = async (id) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error('Remove user failed:', err);
    }
  };

  // 7. Reset Data (Debug/Dev Only)
  // Clears local arrays. Does not wipe the backend database.
  const clearAllData = () => {
    setEvents([]);
    setReports([]);
    setUsers([]);
    window.localStorage.clear();
    window.location.reload();
  };

  // EXPORT
  // We bundle all state and functions into one object for the Provider.
  return (
    <DataContext.Provider value={{
      events, reports, users, loading,     // Shared Data Lists
      addEvent, updateEvent,               // Event Operations
      addReport, joinEvent,                // Report & Join Operations
      updateUser,                          // User Operations
      deleteEvent, deleteReport, removeUser, // Delete Actions
      clearAllData,                         // Debug Action
      refreshData: fetchData               // Manual Refresh Trigger
    }}>
      {children}
    </DataContext.Provider>
  );
};
