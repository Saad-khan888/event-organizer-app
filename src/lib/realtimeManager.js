// -----------------------------------------------------------------------------
// REALTIME SUBSCRIPTION MANAGER
// -----------------------------------------------------------------------------
// Handles WebSocket lifecycle for Supabase Realtime subscriptions
// Ensures proper connection state management and prevents race conditions

/**
 * Creates a managed Realtime subscription with proper lifecycle handling
 * @param {Object} supabase - Supabase client instance
 * @param {string} channelName - Unique channel identifier
 * @param {Function} setupCallback - Function that configures the channel (receives channel object)
 * @param {Object} options - Configuration options
 * @returns {Promise<Function>} Cleanup function to call on unmount
 */
export async function createManagedSubscription(
    supabase,
    channelName,
    setupCallback,
    options = {}
) {
    const {
        waitForAuth = true,
        retryOnError = true,
        maxRetries = 3,
        retryDelay = 2000,
        onStatusChange = null
    } = options;

    let channel = null;
    let isCleanedUp = false;
    let retryCount = 0;
    let retryTimeout = null;

    // Wait for session restoration if required
    if (waitForAuth) {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.warn('⚠️ Session check failed:', error);
            }
            if (!session) {
                console.log('ℹ️ No active session, subscription may have limited access');
            }
        } catch (err) {
            console.warn('⚠️ Could not verify session:', err);
        }
    }

    const subscribe = () => {
        if (isCleanedUp) return;

        // Create channel
        channel = supabase.channel(channelName);

        // Let the caller configure the channel (add .on() listeners)
        setupCallback(channel);

        // Subscribe with status monitoring
        channel.subscribe((status, err) => {
            if (isCleanedUp) return;

            // Notify caller of status changes
            if (onStatusChange) {
                onStatusChange(status, err);
            }

            switch (status) {
                case 'SUBSCRIBED':
                    console.log(`✅ Realtime channel "${channelName}" subscribed`);
                    retryCount = 0; // Reset retry counter on success
                    break;

                case 'CHANNEL_ERROR': {
                    console.warn(`⚠️ Channel "${channelName}" error:`, err);
                    
                    // Don't retry on binding mismatch errors (Realtime not enabled on table)
                    const isBindingMismatch = err?.message?.includes('mismatch between server and client bindings');
                    
                    if (isBindingMismatch) {
                        console.warn(`⚠️ Realtime not enabled for channel "${channelName}". Skipping retry.`);
                        console.warn('💡 To enable: Run "ALTER TABLE your_table REPLICA IDENTITY FULL;" in Supabase SQL Editor');
                        return; // Don't retry
                    }
                    
                    if (retryOnError && retryCount < maxRetries) {
                        retryCount++;
                        console.log(`🔄 Retrying subscription (${retryCount}/${maxRetries})...`);
                        retryTimeout = setTimeout(() => {
                            if (!isCleanedUp && channel) {
                                supabase.removeChannel(channel);
                                subscribe();
                            }
                        }, retryDelay);
                    }
                    break;
                }

                case 'TIMED_OUT':
                    console.warn(`⏱️ Channel "${channelName}" timed out`);
                    if (retryOnError && retryCount < maxRetries) {
                        retryCount++;
                        console.log(`🔄 Retrying subscription (${retryCount}/${maxRetries})...`);
                        retryTimeout = setTimeout(() => {
                            if (!isCleanedUp && channel) {
                                supabase.removeChannel(channel);
                                subscribe();
                            }
                        }, retryDelay);
                    }
                    break;

                case 'CLOSED':
                    console.log(`🔌 Channel "${channelName}" closed`);
                    break;

                default:
                    console.log(`ℹ️ Channel "${channelName}" status: ${status}`);
            }
        });
    };

    // Start initial subscription
    subscribe();

    // Return cleanup function
    return () => {
        isCleanedUp = true;

        // Clear any pending retry
        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }

        // Only remove channel if it exists
        if (channel) {
            try {
                // Check if channel is in a state that can be safely removed
                const channelState = channel.state;
                
                if (channelState === 'joined' || channelState === 'errored' || channelState === 'closed') {
                    supabase.removeChannel(channel);
                    console.log(`🧹 Cleaned up channel "${channelName}"`);
                } else {
                    // Channel is still joining, unsubscribe first then remove
                    const channelRef = channel;
                    channel.unsubscribe().then(() => {
                        try {
                            supabase.removeChannel(channelRef);
                            console.log(`🧹 Cleaned up channel "${channelName}" after unsubscribe`);
                        } catch {
                            // Ignore - channel may already be removed
                        }
                    }).catch(() => {
                        // Ignore errors during cleanup
                    });
                }
            } catch {
                // Silently ignore cleanup errors to prevent console spam
            }
            channel = null;
        }
    };
}

/**
 * Waits for WebSocket to reach OPEN state before proceeding
 * @param {Object} supabase - Supabase client instance
 * @param {number} timeout - Maximum wait time in milliseconds
 * @returns {Promise<boolean>} True if connection is open, false if timeout
 */
export async function waitForConnection(supabase, timeout = 5000) {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const checkConnection = () => {
            const socket = supabase.realtime?.connection;
            
            if (socket?.readyState === WebSocket.OPEN) {
                resolve(true);
                return;
            }

            if (Date.now() - startTime > timeout) {
                console.warn('⚠️ WebSocket connection timeout');
                resolve(false);
                return;
            }

            setTimeout(checkConnection, 100);
        };

        checkConnection();
    });
}
