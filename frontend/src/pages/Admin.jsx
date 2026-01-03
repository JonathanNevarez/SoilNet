import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Link, Plus, Unlink, Users, Cpu, Link2 } from "lucide-react";
import { logout } from "../services/authService";
import UserModal from "../components/admin/UserModal";
import NodeModal from "../components/admin/NodeModal";
import AssignNodeModal from "../components/admin/AssignNodeModal";
import { getAllUsers, getAllNodes, createUser, updateUser, deleteUser, createNode, updateNode, deleteNode, assignNode, unassignNode } from "../services/admin.service";

/**
 * Panel de administración para gestionar usuarios y nodos.
 * Permite crear, editar, eliminar y asignar usuarios y nodos.
 * @returns {JSX.Element} El componente del panel de administración.
 */
export default function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("users");
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [nodes, setNodes] = useState([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  /**
   * Carga inicial de usuarios y nodos al montar el componente.
   */
  useEffect(() => {
    fetchUsers();
    fetchNodes();
  }, []);

  /**
   * Obtiene y actualiza la lista de usuarios desde la API.
   */
  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      setMessage(error.message || "Error cargando usuarios");
    }
  };

  /**
   * Obtiene y actualiza la lista de nodos desde la API.
   */
  const fetchNodes = async () => {
    try {
      const data = await getAllNodes();
      setNodes(data);
    } catch (error) {
      setMessage(error.message || "Error cargando nodos");
    }
  };

  /**
   * Cierra la sesión del administrador y redirige a la página de login.
   */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  /**
   * Guarda o actualiza un usuario.
   * @param {object} data - Los datos del usuario a guardar.
   */
  const handleSaveUser = async (data) => {
    try {
      const isEdit = Boolean(editingUser);
      let result;

      if (isEdit) {
        result = await updateUser(editingUser._id, data);
      } else {
        result = await createUser(data);
      }

      setMessage(result.message);
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setMessage(error.message || "Error de conexión");
    }
  };

  /**
   * Elimina un usuario por su UID.
   * @param {string} uid - El UID del usuario a eliminar.
   */
  const handleDeleteUser = async (uid) => {
    if (!confirm("¿Eliminar este usuario definitivamente?")) return;

    try {
      const result = await deleteUser(uid);
      setMessage(result.message);
      fetchUsers();
      fetchNodes(); // Para actualizar ownerName en nodos
    } catch (error) {
      setMessage(error.message || "Error de conexión");
    }
  };

  /**
   * Guarda o actualiza un nodo.
   * @param {object} data - Los datos del nodo a guardar.
   */
  const handleSaveNode = async (data) => {
    try {
      const isEdit = Boolean(editingNode);
      let result;

      if (isEdit) {
        result = await updateNode(editingNode.nodeId, data);
      } else {
        result = await createNode(data);
      }

      setMessage(result.message);
      setShowNodeModal(false);
      setEditingNode(null);
      fetchNodes();
    } catch (error) {
      setMessage(error.message || "Error de conexión");
    }
  };

  /**
   * Elimina un nodo por su ID.
   * @param {string} nodeId - El ID del nodo a eliminar.
   */
  const handleDeleteNode = async (nodeId) => {
    if (!confirm("¿Eliminar este nodo?")) return;

    try {
      const result = await deleteNode(nodeId);
      setMessage(result.message);
      fetchNodes();
    } catch (error) {
      setMessage(error.message || "Error de conexión");
    }
  };

  /**
   * Asigna un nodo a un usuario.
   * @param {string} userUid - El UID del usuario al que se asignará el nodo.
   */
  const handleAssignNode = async (userUid) => {
    try {
      const result = await assignNode(selectedNode.nodeId, userUid);
      setMessage(result.message);
      setShowAssignModal(false);
      setSelectedNode(null);
      fetchNodes();
    } catch (error) {
      setMessage(error.message || "Error de conexión");
    }
  };

  /**
   * Desasigna un nodo.
   * @param {string} nodeId - El ID del nodo a desasignar.
   */
  const handleUnassignNode = async (nodeId) => {
    if (!confirm("¿Desasignar este nodo?")) return;

    try {
      const result = await unassignNode(nodeId);
      setMessage(result.message);
      fetchNodes();
    } catch (error) {
      setMessage(error.message || "Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9F7] pt-20 px-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="fixed top-0 inset-x-0 z-50
                          bg-green-600 shadow-md">
          <div className="max-w-6xl mx-auto px-4 h-14
                          flex items-center justify-between">

            <div className="leading-tight">
              <h1 className="text-base font-semibold text-white">
                Panel Administrador
              </h1>
              <p className="text-xs text-green-100">
                Gestión de usuarios y nodos IoT
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-white
                        hover:bg-green-700 px-3 py-1 rounded-lg transition"
            >
              Cerrar sesión
            </button>

          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-white rounded-xl p-4 shadow
                          flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Users size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Usuarios</p>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow
                          flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Cpu size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Nodos totales</p>
              <p className="text-3xl font-bold">{nodes.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow
                          flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <Link2 size={22} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Nodos asignados</p>
              <p className="text-3xl font-bold text-green-600">
                {nodes.filter(n => n.assigned).length}
              </p>
            </div>
          </div>

        </div>

        <div className="flex justify-center">
          <div className="flex gap-8 border-b border-gray-200">
            {["users", "nodes"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition
                  ${
                    activeTab === tab
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab === "users" ? "Usuarios" : "Nodos"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Usuarios
              </h2>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2
                          px-4 py-2 rounded-lg text-sm font-semibold
                          bg-green-600 text-white hover:bg-green-700"
              >
                <Plus size={16} /> Agregar usuario
              </button>
            </div>

            {users.length === 0 ? (
              <p className="text-center text-gray-400 py-10">
                No hay usuarios registrados
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {users.map(u => (
                    <div
                      key={u._id}
                      className="bg-white rounded-xl p-4 shadow
                                flex justify-between items-start"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-800">
                          {u.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {u.email}
                        </p>
                        <span
                          className="inline-block mt-1 text-xs
                                    px-2 py-1 rounded-full
                                    bg-gray-100 text-gray-600"
                        >
                          {u.role}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setShowUserModal(true);
                          }}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-[700px] w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Rol</th>
                        <th className="px-3 py-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr
                          key={u._id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="px-3 py-2">{u.fullName}</td>
                          <td className="px-3 py-2">{u.email}</td>
                          <td className="px-3 py-2">{u.role}</td>
                          <td className="px-3 py-2 flex gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setShowUserModal(true);
                              }}
                              className="p-2 rounded hover:bg-blue-50 text-blue-600"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="p-2 rounded hover:bg-red-50 text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "nodes" && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Nodos
              </h2>

              <button
                onClick={() => {
                  setEditingNode(null);
                  setShowNodeModal(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2
                          px-4 py-2 rounded-lg text-sm font-semibold
                          bg-green-600 text-white hover:bg-green-700"
              >
                <Plus size={16} /> Agregar nodo
              </button>
            </div>

            {nodes.length === 0 ? (
              <p className="text-center text-gray-400 py-10">
                No hay nodos creados aún
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {nodes.map(n => (
                    <div
                      key={n.nodeId}
                      className="bg-white rounded-xl p-4 shadow
                                space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {n.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {n.nodeId}
                          </p>
                        </div>

                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold
                            ${
                              n.assigned
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {n.assigned ? "Asignado" : "Libre"}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        Suelo: <span className="font-medium">
                          {n.soil_type === 'SANDY' ? 'Arenoso' : 
                           n.soil_type === 'CLAY' ? 'Arcilloso' : 'Franco'}
                        </span>
                      </p>

                      <p className="text-sm text-gray-600">
                        Usuario: <span className="font-medium">
                          {n.ownerName || "-"}
                        </span>
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditingNode(n);
                            setShowNodeModal(true);
                          }}
                          className="flex-1 p-2 rounded-lg bg-blue-50 text-blue-600
                                    flex justify-center"
                        >
                          <Edit size={16} />
                        </button>

                        {!n.assigned && (
                          <button
                            onClick={() => {
                              setSelectedNode(n);
                              setShowAssignModal(true);
                            }}
                            className="flex-1 p-2 rounded-lg bg-green-50 text-green-600
                                      flex justify-center"
                          >
                            <Link size={16} />
                          </button>
                        )}

                        {n.assigned && (
                          <button
                            onClick={() => handleUnassignNode(n.nodeId)}
                            className="flex-1 p-2 rounded-lg bg-yellow-50 text-yellow-600
                                      flex justify-center"
                          >
                            <Unlink size={16} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteNode(n.nodeId)}
                          className="flex-1 p-2 rounded-lg bg-red-50 text-red-600
                                    flex justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-[750px] w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Suelo</th>
                        <th className="px-3 py-2">Usuario</th>
                        <th className="px-3 py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map(n => (
                        <tr
                          key={n.nodeId}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="px-3 py-2">{n.nodeId}</td>
                          <td className="px-3 py-2">{n.name}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`font-semibold ${
                                n.assigned
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {n.assigned ? "Asignado" : "Libre"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {n.soil_type === 'SANDY' ? 'Arenoso' : 
                             n.soil_type === 'CLAY' ? 'Arcilloso' : 'Franco'}
                          </td>
                          <td className="px-3 py-2">
                            {n.ownerName || "-"}
                          </td>
                          <td className="px-3 py-2 flex gap-2">
                            <button
                              onClick={() => {
                                setEditingNode(n);
                                setShowNodeModal(true);
                              }}
                              className="p-2 rounded hover:bg-blue-50 text-blue-600"
                            >
                              <Edit size={16} />
                            </button>

                            {!n.assigned && (
                              <button
                                onClick={() => {
                                  setSelectedNode(n);
                                  setShowAssignModal(true);
                                }}
                                className="p-2 rounded hover:bg-green-50 text-green-600"
                              >
                                <Link size={16} />
                              </button>
                            )}

                            {n.assigned && (
                              <button
                                onClick={() => handleUnassignNode(n.nodeId)}
                                className="p-2 rounded hover:bg-yellow-50 text-yellow-600"
                              >
                                <Unlink size={16} />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteNode(n.nodeId)}
                              className="p-2 rounded hover:bg-red-50 text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        <UserModal
          isOpen={showUserModal}
          user={editingUser}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
        />

        <NodeModal
          isOpen={showNodeModal}
          node={editingNode}
          onClose={() => setShowNodeModal(false)}
          onSave={handleSaveNode}
        />

        <AssignNodeModal
          isOpen={showAssignModal}
          node={selectedNode}
          users={users}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignNode}
        />

      </div>
    </div>
  );
}