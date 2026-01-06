// client/src/hooks/useWebSocket.ts - UPDATED
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import type { WebSocketMessage, WebSocketMessageType, WebSocketData } from '../types/websocket';

export function useWebSocket(roomId?: string) {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!token || !roomId) {
      console.log('⚠️ Cannot connect WebSocket: missing token or roomId', {
        hasToken: !!token,
        roomId
      });
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `ws://localhost:3001/ws?token=${encodeURIComponent(token)}`;
    console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      
      // Join the room
      const joinMessage = {
        type: 'JOIN_ROOM' as WebSocketMessageType,
        data: { roomId },
        timestamp: new Date()
      };
      console.log('📤 Sending JOIN_ROOM:', joinMessage);
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message.type);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [token, roomId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((type: WebSocketMessageType, data: WebSocketData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, data, timestamp: new Date() };
      console.log('📤 SENDING WebSocket message:', message); 
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('❌ WebSocket not open, cannot send:', type);
    }
  }, []);

  // Auto-connect when roomId changes
  useEffect(() => {
    if (roomId && token) {
      console.log('🔄 RoomId changed, connecting WebSocket:', roomId);
      connect();
    }
    return () => {
      disconnect();
    };
  }, [roomId, token, connect, disconnect]);

  return {
    isConnected,
    messages,
    sendMessage,
    connect,
    disconnect
  };
}