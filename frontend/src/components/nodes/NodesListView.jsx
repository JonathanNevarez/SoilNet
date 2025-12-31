import NodeCard from "./NodeCard";

/**
 * @file NodesListView.jsx
 * @brief Componente que renderiza una lista de tarjetas de nodos en una cuadrícula.
 * 
 * Si la lista está vacía, muestra un mensaje indicando que no hay nodos.
 *
 * @param {object} props - Propiedades del componente.
 * @param {Array<object>} props.nodes - Lista de objetos de nodo a visualizar.
 * @returns {JSX.Element} El componente de la lista de nodos.
 */
export default function NodesListView({ nodes }) {
  if (!nodes.length) {
    return (
      <p className="text-center text-gray-400 mt-10">
        No tienes nodos aún
      </p>
    );
  }

  return (
    // Se utiliza una cuadrícula responsiva para mejorar la visualización en diferentes tamaños de pantalla.
    // 1 columna en móvil, 2 en tablets y 3 en pantallas más grandes.
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {nodes.map(node => (
        <NodeCard key={node.nodeId} node={node} />
      ))}
    </div>
  );
}
