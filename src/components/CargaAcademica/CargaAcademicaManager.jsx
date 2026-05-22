import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const CURSO_COLORS = [
    { bg: '#1e293b', text: '#f1f5f9', light: '#f1f5f9' },
    { bg: '#a855f7', text: '#ffffff', light: '#faf5ff' },
    { bg: '#f43f5e', text: '#ffffff', light: '#fff1f2' },
    { bg: '#10b981', text: '#ffffff', light: '#f0fdf4' },
    { bg: '#3b82f6', text: '#ffffff', light: '#eff6ff' },
    { bg: '#f59e0b', text: '#1c1917', light: '#fffbeb' },
    { bg: '#06b6d4', text: '#ffffff', light: '#ecfeff' },
    { bg: '#ec4899', text: '#ffffff', light: '#fdf2f8' },
    { bg: '#8b5cf6', text: '#ffffff', light: '#f5f3ff' },
    { bg: '#14b8a6', text: '#ffffff', light: '#f0fdfa' },
    { bg: '#ef4444', text: '#ffffff', light: '#fef2f2' },
    { bg: '#6366f1', text: '#ffffff', light: '#eef2ff' },
];

const ProfesorCard = ({ prof, cursos, profesorCurso, onAsignar }) => {
    const nombre = prof?.nombre_profesor || 'Sin nombre';
    const ids = profesorCurso.filter(pc => pc.id_profesor === prof.id_profesor).map(pc => pc.id_curso);
    const asignados = cursos.filter(c => ids.includes(c.id_curso));
    return (
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
            <div className="px-6 pt-6 pb-6 flex flex-col gap-2" style={{ backgroundColor: '#e0f2fe', minHeight: '175px' }}>
                <h3 className="font-black text-slate-800 text-[17px] leading-snug truncate">{nombre}</h3>
                <p className="text-[12px] font-medium text-slate-500">
                    {asignados.length === 0 ? 'Sin especialidades asignadas aún.' : `Capacitado para enseñar ${asignados.length} curso${asignados.length !== 1 ? 's' : ''}.`}
                </p>
                <div className="flex flex-wrap gap-1.5 overflow-hidden" style={{ maxHeight: '58px' }}>
                    {asignados.length === 0 ? (
                        <span className="text-[11px] font-semibold text-slate-400 italic">— ninguno todavía —</span>
                    ) : asignados.map((curso) => {
                        const idx = cursos.findIndex(x => x.id_curso === curso.id_curso);
                        const c = CURSO_COLORS[idx % CURSO_COLORS.length];
                        const nc = curso?.nombre_curso || '?';
                        return (
                            <span key={curso.id_curso} className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0"
                                style={{ backgroundColor: c.bg, color: c.text }}>
                                {nc}
                            </span>
                        );
                    })}
                </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100">
                <button onClick={(e) => { e.stopPropagation(); onAsignar(prof); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold text-white transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                    style={{ backgroundColor: '#51B4E8' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#38a6e0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#51B4E8'}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    Asignar Cursos
                </button>
            </div>
        </div>
    );
};

export default function CargaAcademicaManager() {
    const [profesores, setProfesores] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [areas, setAreas] = useState([]);
    const [profesorCurso, setProfesorCurso] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProfesor, setSelectedProfesor] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [modalError, setModalError] = useState(null);

    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const [r1, r2, r3, r4] = await Promise.all([
                fetch(`${API_BASE}/profesores`, { signal }).catch(() => ({ ok: false })),
                fetch(`${API_BASE}/cursos`, { signal }).catch(() => ({ ok: false })),
                fetch(`${API_BASE}/profesor-curso`, { signal }).catch(() => ({ ok: false })),
                fetch(`${API_BASE}/areas`, { signal }).catch(() => ({ ok: false })),
            ]);
            if (r1.ok) setProfesores(await r1.json());
            if (r2.ok) setCursos(await r2.json());
            if (r3.ok) setProfesorCurso(await r3.json());
            if (r4.ok) setAreas(await r4.json());
            setError(null);
        } catch (err) {
            if (err.name === 'AbortError') return;
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const c = new AbortController();
        fetchDatos(c.signal);
        return () => c.abort();
    }, []);

    const filtered = profesores
        .filter(p => p.nombre_profesor?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const ac = profesorCurso.filter(pc => pc.id_profesor === a.id_profesor).length;
            const bc = profesorCurso.filter(pc => pc.id_profesor === b.id_profesor).length;
            return ac - bc;
        });
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const currentProfesores = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const cursosDelProfesor = selectedProfesor
        ? profesorCurso.filter(pc => pc.id_profesor === selectedProfesor.id_profesor).map(pc => pc.id_curso)
        : [];

    const abrirModal = (prof) => {
        setModalError(null);
        setSelectedProfesor(prof);
        setSelectedArea(null);
        setIsModalOpen(true);
    };

    const handleAsignar = async (id_curso) => {
        if (!selectedProfesor || guardando || cursosDelProfesor.includes(id_curso)) return;
        setGuardando(true);
        try {
            const res = await fetch(`${API_BASE}/profesor-curso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_profesor: selectedProfesor.id_profesor, id_curso })
            });
            if (!res.ok) throw new Error('Error al asignar curso');
            const nuevo = await res.json();
            setProfesorCurso(prev => [...prev, nuevo]);
        } catch (err) {
            alert(err.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-fade-in relative pb-10">

            {/* Cabecera */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3 bg-gradient-to-r from-hx-blue via-blue-600 to-indigo-700 rounded-[24px] p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight text-white">Especialidades Docentes</h2>
                        <p className="text-white/90 text-[13px] font-medium leading-relaxed max-w-sm">
                            Selecciona un docente y elige qué cursos está capacitado para enseñar.
                        </p>
                    </div>
                </div>
                <div className="md:w-1/3 bg-white border border-slate-200 rounded-[24px] p-6 min-h-[180px] flex flex-col">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">Resumen</p>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="flex flex-col justify-between rounded-2xl p-5 bg-blue-50">
                            <p className="text-[12px] font-semibold text-blue-400">Docentes</p>
                            <p className="text-3xl font-black text-hx-blue">{profesores.length}</p>
                        </div>
                        <div className="flex flex-col justify-between rounded-2xl p-5 bg-indigo-50">
                            <p className="text-[12px] font-semibold text-indigo-400">Asignaciones</p>
                            <p className="text-3xl font-black text-indigo-600">{profesorCurso.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium">{error}</div>}

            {/* Toolbar + Grid */}
            {!loading && (
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-8 bg-white py-2 px-4 rounded-[20px] border border-slate-100 shadow-sm h-16 w-full overflow-hidden">
                        <div className="flex-shrink-0 flex items-center gap-3 w-1/4">
                            <div className="w-10 h-10 bg-hx-blue/10 rounded-xl flex items-center justify-center text-hx-blue">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight whitespace-nowrap">
                                Docentes <span className="text-slate-400 text-[15px] font-bold ml-1">({filtered.length})</span>
                            </h2>
                        </div>
                        <div className="flex-1 max-w-lg mx-4">
                            <div className="relative flex items-center bg-white rounded-full p-1.5 border-2 border-slate-200 focus-within:border-hx-blue transition-all h-12 w-full">
                                <input type="text" placeholder="Buscar docente..." value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="flex-1 bg-transparent pl-6 pr-3 py-1 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full w-full" />
                                <div className="w-9 h-9 rounded-full bg-hx-blue flex items-center justify-center text-white flex-shrink-0 shadow-sm mr-0.5">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-1/4"></div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <h3 className="text-xl font-black text-slate-800">{searchTerm ? 'No se encontraron resultados' : 'No hay docentes registrados'}</h3>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
                                {currentProfesores.map(prof => (
                                    <ProfesorCard key={prof.id_profesor} prof={prof} cursos={cursos} profesorCurso={profesorCurso} onAsignar={abrirModal} />
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12 mb-4">
                                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-hx-blue transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${currentPage === i + 1 ? 'bg-hx-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-hx-blue transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-hx-blue/30 border-t-hx-blue rounded-full animate-spin"></div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && selectedProfesor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>

                        {/* Header */}
                        <div className="px-8 py-5 flex justify-between items-center border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                                    {(selectedProfesor?.nombre_profesor || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{selectedProfesor?.nombre_profesor || 'Sin nombre'}</h2>
                                    <p className="text-[12px] text-slate-500 font-medium">
                                        {selectedArea ? `Área: ${selectedArea.nombre}` : 'Selecciona un área para ver sus cursos'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}
                                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Cuerpo */}
                        <div className="overflow-y-auto p-6 bg-slate-50/50" style={{ flex: '1 1 auto' }}>
                            {guardando && (
                                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-hx-blue/10 text-hx-blue text-sm font-bold">
                                    <div className="w-4 h-4 border-2 border-hx-blue/30 border-t-hx-blue rounded-full animate-spin"></div>
                                    Guardando...
                                </div>
                            )}

                            {!selectedArea && (
                                <div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">Paso 1 — Elige un área</p>
                                    {areas.length === 0 ? (
                                        <p className="text-center py-10 text-slate-400">No hay áreas registradas.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {areas.map(area => {
                                                const nombreArea = area?.nombre || 'Sin nombre';
                                                const cursosArea = cursos.filter(c => c.id_area === area.id_area);
                                                const asig = cursosArea.filter(c => cursosDelProfesor.includes(c.id_curso)).length;
                                                return (
                                                    <button key={area.id_area} onClick={() => setSelectedArea(area)}
                                                        className="w-full text-left rounded-2xl border-2 border-slate-100 bg-white hover:border-hx-blue hover:shadow-md transition-all p-4 cursor-pointer group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-hx-blue/10 flex items-center justify-center text-hx-blue font-black text-sm shrink-0 group-hover:bg-hx-blue group-hover:text-white transition-colors">
                                                                {nombreArea.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-extrabold text-slate-800 text-[13px] truncate">{nombreArea}</p>
                                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                                    {cursosArea.length} curso{cursosArea.length !== 1 ? 's' : ''}
                                                                    {asig > 0 && <span className="ml-2 text-hx-blue font-bold">• {asig} asignado{asig !== 1 ? 's' : ''}</span>}
                                                                </p>
                                                            </div>
                                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-hx-blue shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedArea && (
                                <div>
                                    <div className="flex items-center gap-3 mb-6 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
                                        <button onClick={() => setSelectedArea(null)} className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-hx-blue transition-colors cursor-pointer shrink-0">
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estás viendo</p>
                                            <p className="text-[14px] font-extrabold text-slate-800 truncate">{selectedArea?.nombre || 'Sin nombre'}</p>
                                        </div>
                                    </div>
                                    {cursos.filter(c => c.id_area === selectedArea.id_area).length === 0 ? (
                                        <p className="text-center py-10 text-slate-400">No hay cursos en esta área.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {cursos.filter(c => c.id_area === selectedArea.id_area).map(curso => {
                                                const idx = cursos.findIndex(x => x.id_curso === curso.id_curso);
                                                const col = CURSO_COLORS[idx % CURSO_COLORS.length];
                                                const isAsig = cursosDelProfesor.includes(curso.id_curso);
                                                const nombreCurso = curso?.nombre_curso || 'Sin nombre';
                                                return (
                                                    <div key={curso.id_curso} onClick={() => handleAsignar(curso.id_curso)}
                                                        className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${isAsig ? 'shadow-md cursor-default' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md cursor-pointer'}`}
                                                        style={isAsig ? { border: `2px solid ${col.bg}`, boxShadow: `0 4px 16px ${col.bg}30` } : {}}>
                                                        <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: col.bg }}>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: col.text, opacity: 0.85 }}>Asignatura</span>
                                                            {isAsig && <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: col.text }}>✓ Asignado</span>}
                                                        </div>
                                                        <div className="p-4 flex items-center gap-3" style={{ backgroundColor: isAsig ? col.light : '#ffffff' }}>
                                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ backgroundColor: col.bg }}>
                                                                {nombreCurso.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-extrabold text-[13px] truncate leading-tight" style={{ color: isAsig ? col.bg : '#1e293b' }}>{nombreCurso}</p>
                                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{isAsig ? 'Ya enseña este curso' : '+ Clic para asignar'}</p>
                                                            </div>
                                                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                                                                style={isAsig ? { borderColor: col.bg, backgroundColor: col.bg } : { borderColor: '#cbd5e1' }}>
                                                                {isAsig && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
                            <p className="text-[13px] text-slate-500 font-medium">
                                <span className="font-black text-hx-blue">{cursosDelProfesor.length}</span> curso{cursosDelProfesor.length !== 1 ? 's' : ''} asignado{cursosDelProfesor.length !== 1 ? 's' : ''}
                            </p>
                            <button onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-hx-blue hover:bg-hx-blue/90 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md">
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
