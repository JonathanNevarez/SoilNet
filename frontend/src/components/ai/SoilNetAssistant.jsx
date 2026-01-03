import React, { useState, useRef, useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { Send, X, Sprout, Bot, AlertTriangle, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askSoilNetAI } from '../../services/ai.service';

/**
 * Componente flotante del Asistente IA.
 * Si se pasa nodeId, analiza ese nodo. Si no, actúa como asistente general.
 * 
 * @param {string} [nodeId] - ID del nodo activo (opcional).
 * @param {string} nodeName - Nombre amigable del nodo.
 */
const SoilNetAssistant = ({ nodeId, nodeName }) => {
  const location = useLocation();
  // Detectar nodeId desde la URL manualmente usando matchPath para asegurar que funcione en el Layout
  const match = matchPath("/nodos/:nodeId", location.pathname);
  const routeNodeId = match?.params?.nodeId ? decodeURIComponent(match.params.nodeId) : null;
  const activeNodeId = nodeId || routeNodeId;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const windowRef = useRef(null);

  // Mensaje de bienvenida inicial
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const contextText = activeNodeId 
        ? (nodeName ? `del nodo ${nodeName}` : `del nodo actual`)
        : `de todo el sistema`;

      setMessages([
        { 
          role: 'system', 
          content: `Hola, soy SoilNet AI. 🤖 Estoy analizando los datos en tiempo real ${contextText}. ¿En qué puedo ayudarte?` 
        }
      ]);
    }
  }, [isOpen, nodeName, activeNodeId, messages.length]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Cerrar al hacer clic fuera de la ventana
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (windowRef.current && !windowRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    // 1. Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      // Obtener token (ajusta según dónde guardes tu token: localStorage, Context, etc.)
      const token = localStorage.getItem('token'); 
      
      if (!token) {
        throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
      }

      // 2. Llamar al backend
      const data = await askSoilNetAI(activeNodeId, text, token);
      
      // 3. Agregar respuesta de la IA
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'error', content: error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const suggestions = activeNodeId
    ? ["¿Debo regar?", "¿Estado de batería?", "¿Humedad actual?", "¿Es normal este nivel?"]
    : ["¿Cuántos nodos hay?", "¿Resumen del sistema?", "¿Nodos con alertas?", "¿Ubicación de nodos?"];

  return (
    <>
      {/* Botón Flotante (FAB) */}
      <button 
        className={`fixed bottom-20 right-6 w-14 h-14 rounded-full bg-green-700 text-white shadow-lg hover:scale-105 hover:bg-green-800 transition-all flex items-center justify-center z-50 ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Consultar al Asistente IA"
      >
        <Bot size={28} />
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div ref={windowRef} className="fixed bottom-36 right-6 w-80 sm:w-96 h-[500px] max-h-[60vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-br from-green-700 to-green-600 text-white p-4 flex justify-between items-center font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <Sprout size={20} />
              <span>SoilNet Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                className="p-1 rounded-full hover:bg-white/20 transition-colors" 
                onClick={() => setMessages([])}
                title="Borrar historial"
              >
                <Trash2 size={18} />
              </button>
              <button className="p-1 rounded-full hover:bg-white/20 transition-colors" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words ${
                msg.role === 'user' 
                  ? 'self-end bg-green-700 text-white rounded-br-sm' 
                  : msg.role === 'assistant'
                  ? 'self-start bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                  : msg.role === 'error'
                  ? 'self-center text-red-600 bg-red-50 text-xs'
                  : 'self-center bg-gray-200 text-gray-600 text-xs text-center rounded-lg'
              }`}>
                {msg.role === 'assistant' && /alerta/i.test(msg.content) && (
                  <div className="flex items-center gap-1.5 text-amber-600 mb-2 font-medium border-b border-amber-100 pb-1">
                    <AlertTriangle size={16} />
                    <span>Atención</span>
                  </div>
                )}
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 my-1 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-1 space-y-1" {...props} />,
                      strong: ({node, ...props}) => <span className="font-bold text-green-700" {...props} />,
                      p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="self-start bg-white border border-gray-200 rounded-xl rounded-bl-sm shadow-sm px-4 py-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chips de Sugerencias */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
            {suggestions.map((text, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(text)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 bg-white text-green-700 text-xs font-medium rounded-full border border-green-200 hover:bg-green-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 text-sm transition-colors disabled:bg-gray-100"
            />
            <button 
              type="submit" 
              className="bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default SoilNetAssistant;