import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  // B. INITIAL DATA LOAD & REALTIME SUBSCRIPTIONS
  // -------------------
  // This effect runs ONCE when the app starts.
  // It fetches the initial lists and sets up Realtime Listeners with proper lifecycle management.
  useEffect(() => {
    let cleanup = null;

    // Function to fetch data from Supabase
    const fetchData = async () => {
      try {
        // Fetch ALL records from the 'events' table
        // Sorting: order by created_at descending (newest first)
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
        // NOTE: In a high-scale production app, we should paginate this or fetch individual profiles on demand.
        // For now, we fetch all to ensure Profile/Event pages have all necessary data without refactoring the whole app.
        const { data: usersList, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // Update our state variables with the fetched data
        setEvents(eventsList || []);
        setReports(reportsList || []);
        setUsers(usersList || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch initial data
    fetchData();

    // Cleanup: Unsubscribe when the component unmounts
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

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
  // This is a special update operation. It adds the current user's ID to the event's 'participants' array.
  const joinEvent = async (_eventId, _userId) => {
    return { success: false, error: 'Direct joining is disabled. Please purchase tickets to participate.' };
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
      clearAllData                         // Debug Action
    }}>
      {children}
    </DataContext.Provider>
  );
};
