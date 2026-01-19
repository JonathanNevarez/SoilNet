import { useState, useEffect } from "react";
import { getUserNodes } from "../services/nodes.service";
import { getCurrentUser } from "../services/authService";
import { useSocket } from "../services/SocketContext";

export function useNodesRealtime() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const user = getCurrentUser();

  // 1. Carga inicial de nodos
  useEffect(() => {
    async function fetchNodes() {
      if (!user) return;
      try {
        const data = await getUserNodes(user.uid);
        // Aseguramos que cada nodo tenga un objeto lastReading válido si no lo tiene
        const processedNodes = data.map(n => ({
          ...n,
          lastReading: n.lastReading || null
        }));
        setNodes(processedNodes);
      } catch (error) {
        console.error("Error cargando nodos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNodes();
  }, [user?.uid]); // Dependencia segura

  // 2. Escuchar eventos de Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewReading = (data) => {
      console.log("Nueva lectura recibida por socket:", data);
      
      setNodes((currentNodes) => 
        currentNodes.map((node) => {
          if (node.nodeId === data.nodeId) {
            return {
              ...node,
              lastReading: {
                ...data, // data trae humidity, rssi, voltage, sensor_timestamp
                createdAt: new Date().toISOString() // Actualizamos el tiempo localmente para reflejar "ahora"
              }
            };
          }
          return node;
        })
      );
    };

    socket.on("reading:new", handleNewReading);

    return () => {
      socket.off("reading:new", handleNewReading);
    };
  }, [socket]);

  return { nodes, loading };
}