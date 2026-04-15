import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

// Shared singleton across the app so we never open duplicate connections.
let sharedSocket = null;
let refCount = 0;

function getSocket() {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return sharedSocket;
}

/**
 * useSocket — connect to the Socket.IO server and optionally join a user room.
 *
 * @param {string|null} userEmail  When provided the socket joins room `user:<email>`
 *                                 so the server can target events at this user.
 * @param {boolean}     isAdmin    When true the socket joins the "admins" room.
 * @param {Object}      handlers   Map of { eventName: handlerFn } to subscribe.
 *
 * Returns { socket, connected }.
 */
export function useSocket({ userEmail = null, isAdmin = false, handlers = {} } = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref up-to-date without re-subscribing on every render
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    refCount += 1;

    // Join rooms
    if (userEmail) {
      socket.emit('joinClaimRoom', userEmail);
    }
    if (isAdmin) {
      socket.emit('joinClaimRoom', '__admin__'); // server-side we handle this as "admins" room
      socket.emit('joinAdminRoom');              // direct join if server supports it
    }

    // Register event listeners via a stable wrapper that reads the latest handler
    const wrappers = {};
    Object.keys(handlersRef.current).forEach((event) => {
      wrappers[event] = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, wrappers[event]);
    });

    return () => {
      // Remove only our listeners
      Object.entries(wrappers).forEach(([event, fn]) => socket.off(event, fn));
      refCount -= 1;
      // Disconnect the shared socket when no consumers remain
      if (refCount <= 0) {
        socket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, isAdmin]);

  const emit = useCallback((event, ...args) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  return { socket: socketRef.current, emit };
}
