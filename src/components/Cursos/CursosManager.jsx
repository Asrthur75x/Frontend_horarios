import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

// --- Componente Tarjeta Libro (Book Card) ---
const CursoBookCard = ({ curso, area, onEdit, onDelete, index }) => {
    // Paleta de colores con valores hex directos (evita el bug de purge de Tailwind JIT)
    const colors = [
        { bg: '#1e293b', spine: '#0f172a', text: '#f1f5f9', bmBg: '#fbbf24' }, // Slate oscuro
        { bg: '#a855f7', spine: '#9333ea', text: '#ffffff', bmBg: '#fde68a' }, // Morado
        { bg: '#f43f5e', spine: '#e11d48', text: '#ffffff', bmBg: '#fef08a' }, // Rosa/Rojo
        { bg: '#10b981', spine: '#059669', text: '#ffffff', bmBg: '#fbbf24' }, // Esmeralda
        { bg: '#3b82f6', spine: '#2563eb', text: '#ffffff', bmBg: '#fde68a' }, // Azul
        { bg: '#f59e0b', spine: '#d97706', text: '#1c1917', bmBg: '#fda4af' }, // Ámbar
        { bg: '#06b6d4', spine: '#0891b2', text: '#ffffff', bmBg: '#fde68a' }, // Cyan
        { bg: '#ec4899', spine: '#db2777', text: '#ffffff', bmBg: '#fef9c3' }, // Rosa fucsia
        { bg: '#8b5cf6', spine: '#7c3aed', text: '#ffffff', bmBg: '#fbbf24' }, // Violeta
        { bg: '#14b8a6', spine: '#0d9488', text: '#ffffff', bmBg: '#fde68a' }, // Teal
        { bg: '#ef4444', spine: '#dc2626', text: '#ffffff', bmBg: '#fef08a' }, // Rojo vivo
        { bg: '#6366f1', spine: '#4f46e5', text: '#ffffff', bmBg: '#fda4af' }, // Índigo
    ];
    const c = colors[index % colors.length];

    return (
        <div className="w-full flex justify-center animate-fade-in" style={{ perspective: '1000px' }}>
            {/* Wrapper interno: libro + botones en fila */}
            <div className="group relative flex items-start gap-2">

                {/* Contenedor del Libro */}
                <div
                    className="relative w-[160px] md:w-[180px] h-[240px] md:h-[260px] rounded-r-xl rounded-l-md transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-[15px_20px_25px_rgba(0,0,0,0.25)] cursor-pointer flex-shrink-0"
                    style={{
                        backgroundColor: c.bg,
                        boxShadow: '10px 10px 15px rgba(0,0,0,0.2)',
                        transformStyle: 'preserve-3d',
                    }}
                    onClick={() => onEdit(curso)}
                >
                    {/* Lomo del libro */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-6 rounded-l-md z-20"
                        style={{ backgroundColor: c.spine, boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2)' }}
                    >
                        <div className="absolute top-4 bottom-4 left-2 w-0.5 bg-white/10 rounded-full"></div>
                    </div>

                    {/* Detalles de la portada */}
                    <div className="absolute inset-0 ml-6 p-4 md:p-5 flex flex-col items-center text-center z-20">
                        <div
                            className="text-[9px] font-bold uppercase tracking-[0.15em] mt-1 md:mt-2 line-clamp-2"
                            style={{ color: c.text, opacity: 0.8 }}
                        >
                            {area ? area.nombre_area || area.nombre : 'Sin Área'}
                        </div>

                        <div className="flex-1 flex items-center justify-center w-full">
                            <h3
                                className="text-[17px] md:text-xl font-black leading-snug drop-shadow-md px-1"
                                style={{ color: c.text }}
                            >
                                {curso.nombre_curso}
                            </h3>
                        </div>

                        <div
                            className="text-[10px] font-bold mb-2 md:mb-3 border-t border-white/20 pt-2 w-1/2"
                            style={{ color: c.text, opacity: 0.6 }}
                        >
                            ID: {curso.id_curso}
                        </div>
                    </div>

                    {/* Marcador (Bookmark) */}
                    <div
                        className="absolute -bottom-4 right-6 w-8 h-10 z-10 transition-all duration-300 group-hover:h-14 group-hover:-bottom-8 drop-shadow-md"
                        style={{ backgroundColor: c.bmBg }}
                    >
                        <div
                            className="absolute -bottom-3 left-0 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[12px] border-b-transparent"
                            style={{ borderLeftColor: c.bmBg, borderRightColor: c.bmBg }}
                        ></div>
                    </div>

                    {/* Páginas (Bordes de hojas) */}
                    <div className="absolute top-1 bottom-1 right-[-4px] w-1 bg-white rounded-r-sm z-0" style={{ boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.1)' }}></div>
                    <div className="absolute top-2 bottom-2 right-[-6px] w-1 bg-slate-100 rounded-r-sm z-0"></div>

                    {/* Brillo de portada */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-r-xl rounded-l-md pointer-events-none z-30"></div>
                </div>

                {/* Acciones — siempre visibles a la derecha del libro */}
                <div className="flex flex-col gap-2 pt-2 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(curso); }}
                        title="Editar"
                        className="p-2.5 bg-white text-hx-purple rounded-full shadow-lg hover:bg-purple-50 hover:scale-110 transition-all cursor-pointer"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(curso.id_curso); }}
                        title="Eliminar"
                        className="p-2.5 bg-white text-red-500 rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all cursor-pointer"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default function CursosManager() {
    const [cursos, setCursos] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Adaptado al SQLModel: id_curso, nombre_curso y id_area
    const [nuevoCurso, setNuevoCurso] = useState({
        nombre_curso: '',
        id_area: ''
    });

    // ── Cargar cursos y áreas del backend al montar ──
    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const [resCursos, resAreas] = await Promise.all([
                fetch(`${API_BASE}/cursos`, { signal }).catch((e) => {
                    if (e.name === 'AbortError') throw e;
                    return { ok: false, json: async () => [] };
                }),
                fetch(`${API_BASE}/areas`, { signal }).catch((e) => {
                    if (e.name === 'AbortError') throw e;
                    return { ok: false, json: async () => [] };
                }),
            ]);

            if (resCursos.ok) {
                const dataCursos = await resCursos.json();
                setCursos(dataCursos);
            } else setCursos([]);

            if (resAreas.ok) {
                const dataAreas = await resAreas.json();
                setAreas(dataAreas);
            } else setAreas([]);

            setError(null);
        } catch (err) {
            if (err.name === 'AbortError') return; // navegación: ignorar silenciosamente
            console.warn('No se pudo obtener datos del backend.', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchDatos(controller.signal);
        return () => controller.abort(); // limpieza al desmontar
    }, []);


    // ── Abrir modal para nuevo curso ──
    const abrirModalNueva = () => {
        setIsEditing(false);
        setEditId(null);
        setNuevoCurso({ nombre_curso: '', id_area: '' });
        setIsModalOpen(true);
    };

    // ── Abrir modal para edición ──
    const abrirModalEdicion = (curso) => {
        setIsEditing(true);
        setEditId(curso.id_curso);
        setNuevoCurso({
            nombre_curso: curso.nombre_curso || '',
            id_area: curso.id_area || ''
        });
        setIsModalOpen(true);
    };

    // ── Eliminar ──
    const eliminarCurso = (id) => {
        const confirmacion = window.confirm("¿Seguro que deseas eliminar este curso?");
        if (confirmacion) {
            setCursos(cursos.filter(c => c.id_curso !== id));
        }
    };

    // ── Guardar curso ──
    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        const payload = {
            nombre_curso: nuevoCurso.nombre_curso,
            id_area: nuevoCurso.id_area ? parseInt(nuevoCurso.id_area) : null
        };

        try {
            if (isEditing) {
                setCursos(cursos.map(c => c.id_curso === editId
                    ? { ...c, ...payload }
                    : c
                ));
            } else {
                const nuevoId = Math.floor(Math.random() * 1000);
                const objNuevo = {
                    id_curso: nuevoId,
                    ...payload
                };

                try {
                    const res = await fetch(`${API_BASE}/cursos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        await fetchDatos();
                    } else {
                        setCursos([...cursos, objNuevo]);
                    }
                } catch (apiErr) {
                    setCursos([...cursos, objNuevo]);
                }
            }

            setIsModalOpen(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-fade-in relative">

            {/* Cabecera Superior (Banner + Espacio Derecho) */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Banner Principal (Izquierda) */}
                <div className="md:w-2/3 bg-gradient-to-r from-hx-purple via-purple-500 to-fuchsia-400 rounded-[24px] p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                    {/* Formas abstractas decorativas */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                    <div className="absolute bottom-0 right-32 w-32 h-32 bg-hx-purple/40 rounded-full blur-xl translate-y-1/4"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="max-w-md">
                            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight drop-shadow-sm text-white">
                                Directorio de Cursos
                            </h2>
                            <p className="text-white/90 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Gestiona y explora todas las asignaturas de la institución. Registra nuevos cursos y asígnalos a sus áreas académicas.
                            </p>

                            <button
                                onClick={abrirModalNueva}
                                className="bg-white text-hx-purple hover:bg-slate-50 font-extrabold py-2.5 px-6 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm w-max">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Añadir Nuevo Curso
                            </button>
                        </div>

                        {/* Logo decorativo estilo libros */}
                        <div className="hidden sm:flex text-white/90 opacity-80 pt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                                <path d="M6.5 2v20"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Espacio Derecho Reservado */}
                <div className="md:w-1/3 bg-white border-2 border-slate-200 border-dashed rounded-[24px] flex flex-col items-center justify-center p-8 min-h-[180px]">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-300 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </div>
                    <p className="text-slate-400 font-extrabold text-sm">Biblioteca Virtual</p>
                    <p className="text-slate-400/70 text-xs mt-1 text-center font-medium max-w-[160px]">
                        Explora la colección de asignaturas disponibles.
                    </p>
                </div>
            </div>

            {/* Banner de Error Menor */}
            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl flex items-center gap-3">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <p className="text-sm font-medium">Usando datos locales por ahora debido a error de conectividad.</p>
                </div>
            )}

            {/* Estado de Carga */}
            {loading && cursos.length === 0 && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-hx-purple/30 border-t-hx-purple rounded-full animate-spin"></div>
                </div>
            )}

            {/* Grid de Cursos (Estilo Tarjetas Libro) */}
            {!loading && (
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-[#111827]">Biblioteca de Cursos ({cursos.length})</h2>
                    </div>

                    {cursos.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg width="32" height="32" fill="none" stroke="#cbd5e1" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No hay cursos registrados</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Comienza creando tu primer curso usando el botón en la cabecera superior.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-x-10 gap-y-16 px-6 py-6">
                            {cursos.map((curso, index) => {
                                const localId = curso.id_curso || `ID-${index + 1}`;
                                const areaEncontrada = areas.find(a => a.id_area === curso.id_area);
                                return (
                                    <CursoBookCard
                                        key={localId}
                                        curso={curso}
                                        area={areaEncontrada}
                                        index={index}
                                        onEdit={abrirModalEdicion}
                                        onDelete={eliminarCurso}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Flotante de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div
                        className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">{isEditing ? 'Editar Curso' : 'Nuevo Curso'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="p-8 space-y-6">

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Nombre del Curso</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Matemática Básica"
                                    value={nuevoCurso.nombre_curso}
                                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre_curso: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-hx-purple focus:ring-4 focus:ring-hx-purple/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Área Académica</label>
                                <select
                                    required
                                    value={nuevoCurso.id_area}
                                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, id_area: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-hx-purple focus:ring-4 focus:ring-hx-purple/10 outline-none transition-all text-sm font-medium text-[#111827] bg-white cursor-pointer"
                                >
                                    <option value="" disabled>-- Selecciona un área --</option>
                                    {areas.map(area => (
                                        <option key={area.id_area} value={area.id_area}>
                                            {area.nombre || area.nombre_area}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="cursor-pointer flex-1 py-3 text-sm font-bold text-[#64748B] hover:text-[#111827] bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-sm rounded-xl transition-all flex items-center justify-center gap-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="cursor-pointer flex-1 py-3 px-4 bg-hx-purple hover:bg-hx-purple/90 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {guardando ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            {isEditing ? 'Guardar Cambios' : 'Añadir Registro'}
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
