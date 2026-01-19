import React, { useState, useRef, useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { Send, X, Sprout, Bot, AlertTriangle, Trash2, GripHorizontal } from 'lucide-react'; // Importamos GripHorizontal para indicar arrastre
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
  
  // Estado para la posición del botón (inicialmente esquina inferior derecha)
  const [position, setPosition] = useState({ bottom: 80, right: 24 }); // Ajustado para no tapar navbar inferior si existe
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonStartPos = useRef({ bottom: 0, right: 0 });

  const messagesEndRef = useRef(null);
  const windowRef = useRef(null);
  const buttonRef = useRef(null);

  // Mensaje de bienvenida inicial
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const contextText = activeNodeId 
        ? (nodeName ? `del nodo ${nodeName}` : `del nodo actual`)
        : `de todo el sistema`;

      setMessages([
        { 
          role: 'system', 
          content: `Hola, soy SoilNet AI. 🤖 Estoy analizando los datos en tiempo real . ¿En qué puedo ayudarte?` 
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
      // Si estamos arrastrando, no cerrar
      if (isDragging) return;

      if (windowRef.current && !windowRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isDragging]);

  // Lógica de arrastre
  const handleMouseDown = (e) => {
    // Solo iniciar arrastre con clic izquierdo
    if (e.button !== 0) return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Guardamos la posición actual como referencia, convirtiendo a números si es necesario
    // Nota: position.bottom y position.right son números en nuestro estado
    buttonStartPos.current = { ...position };
    
    // Prevenir selección de texto
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = dragStartPos.current.x - e.clientX; // Invertido porque right aumenta hacia la izquierda
      const deltaY = dragStartPos.current.y - e.clientY; // Invertido porque bottom aumenta hacia arriba

      setPosition({
        bottom: buttonStartPos.current.bottom + deltaY,
        right: buttonStartPos.current.right + deltaX
      });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // Al soltar, "imantar" a los laterales respetando zonas seguras (Header/Navbar)
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const elemSize = 56;
      
      // Márgenes de seguridad
      const marginX = 20;
      const safeBottom = 90; // Altura aprox Navbar + margen
      const safeTop = 90;    // Altura aprox Header + margen

      const currentLeft = windowWidth - position.right - elemSize;
      const isLeft = currentLeft < windowWidth / 2;

      // 1. Pegar al lateral más cercano
      const newRight = isLeft ? windowWidth - marginX - elemSize : marginX;

      // 2. Mantener altura pero restringir (clamp) entre Header y Navbar
      let newBottom = position.bottom;
      const maxBottom = windowHeight - safeTop - elemSize;

      if (newBottom < safeBottom) newBottom = safeBottom;
      if (newBottom > maxBottom) newBottom = maxBottom;

      setPosition({
        right: newRight,
        bottom: newBottom
      });
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  // Manejo táctil para móviles
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    buttonStartPos.current = { ...position };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = dragStartPos.current.x - touch.clientX;
    const deltaY = dragStartPos.current.y - touch.clientY;

    setPosition({
      bottom: buttonStartPos.current.bottom + deltaY,
      right: buttonStartPos.current.right + deltaX
    });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Lógica de imán (Laterales + Zonas seguras)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const elemSize = 56;
    const marginX = 20;
    const safeBottom = 90;
    const safeTop = 90;

    const currentLeft = windowWidth - position.right - elemSize;
    const isLeft = currentLeft < windowWidth / 2;

    const newRight = isLeft ? windowWidth - marginX - elemSize : marginX;
    
    let newBottom = position.bottom;
    const maxBottom = windowHeight - safeTop - elemSize;

    if (newBottom < safeBottom) newBottom = safeBottom;
    if (newBottom > maxBottom) newBottom = maxBottom;

    setPosition({
      right: newRight,
      bottom: newBottom
    });
  };


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

  // Estilo dinámico para la posición
  const floatingStyle = {
    bottom: `${position.bottom}px`,
    right: `${position.right}px`,
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', // Animación suave al soltar
    zIndex: 9999 // Asegurar que esté por encima de todo
  };

  // Calcular posición de la ventana de chat relativa al botón
  // Si el botón está muy arriba, la ventana se abre hacia abajo. Si está muy a la izquierda, se abre hacia la derecha.
  const isTopHalf = position.bottom > window.innerHeight / 2;
  const windowStyle = {
    position: 'fixed',
    bottom: isTopHalf ? 'auto' : `${position.bottom + 70}px`,
    top: isTopHalf ? `${window.innerHeight - position.bottom + 10}px` : 'auto',
    right: position.right > window.innerWidth / 2 ? 'auto' : `${position.right}px`,
    left: position.right > window.innerWidth / 2 ? `${window.innerWidth - position.right - 56}px` : 'auto',
    zIndex: 9999
  };

  return (
    <>
      {/* Botón Flotante (FAB) */}
      <div 
        ref={buttonRef}
        style={floatingStyle}
        className={`fixed w-14 h-14 rounded-full bg-green-700 text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing touch-none ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
            // Evitar abrir si fue un arrastre
            if (!isDragging) setIsOpen(true);
        }}
        title="Consultar al Asistente IA"
      >
        <Bot size={28} />
      </div>

      {/* Ventana de Chat */}
      {isOpen && (
        <div ref={windowRef} style={windowStyle} className="w-80 sm:w-96 h-[500px] max-h-[60vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-br from-green-700 to-green-600 text-white p-4 flex justify-between items-center font-semibold shadow-sm cursor-move"
               onMouseDown={handleMouseDown} // Permitir arrastrar desde el header también si se desea mover toda la ventana
               onTouchStart={handleTouchStart}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-2 pointer-events-none">
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
