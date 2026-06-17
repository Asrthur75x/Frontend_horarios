import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const CURSO_COLORS = [
    { bg: 'bg-emerald-50', text: '#059669', border: 'border-emerald-200', solid: '#10b981', pastel: '#d1fae5' },
    { bg: 'bg-blue-50', text: '#2563eb', border: 'border-blue-200', solid: '#3b82f6', pastel: '#dbeafe' },
    { bg: 'bg-purple-50', text: '#9333ea', border: 'border-purple-200', solid: '#a855f7', pastel: '#f3e8ff' },
    { bg: 'bg-amber-50', text: '#d97706', border: 'border-amber-200', solid: '#f59e0b', pastel: '#fef3c7' },
    { bg: 'bg-rose-50', text: '#e11d48', border: 'border-rose-200', solid: '#f43f5e', pastel: '#ffe4e6' },
    { bg: 'bg-cyan-50', text: '#0891b2', border: 'border-cyan-200', solid: '#06b6d4', pastel: '#cffafe' },
    { bg: 'bg-fuchsia-50', text: '#c026d3', border: 'border-fuchsia-200', solid: '#d946ef', pastel: '#fae8ff' },
];

const DIA_COLOR = { bg: 'var(--color-hx-purple)' };

export default function HorariosPorProfesorManager() {
    const [secciones, setSecciones] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [dias, setDias] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [configGradoDia, setConfigGradoDia] = useState([]);
    const [grados, setGrados] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [seccionTurnos, setSeccionTurnos] = useState([]);
    const [maxBloquesDia, setMaxBloquesDia] = useState(6);

    const [status, setStatus] = useState('loading'); // loading, empty, ready
    const [asignaciones, setAsignaciones] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);

    const [selectedProfesor, setSelectedProfesor] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [secRes, curRes, profRes, diasRes, bloqRes, configRes, horarioRes, gradosRes, sedesRes, turnosRes, seccionTurnosRes] = await Promise.all([
                    fetch(`${API_BASE}/secciones`),
                    fetch(`${API_BASE}/cursos`),
                    fetch(`${API_BASE}/profesores`),
                    fetch(`${API_BASE}/dias`),
                    fetch(`${API_BASE}/bloques`),
                    fetch(`${API_BASE}/grado-dia-config`),
                    fetch(`${API_BASE}/cargar-horario`),
                    fetch(`${API_BASE}/grados`),
                    fetch(`${API_BASE}/sedes`),
                    fetch(`${API_BASE}/turnos`),
                    fetch(`${API_BASE}/seccion-turno`)
                ]);

                const [secData, curData, profData, diasData, bloqData, configData, horarioData, gradosData, sedesData, turnosData, stData] = await Promise.all([
                    secRes.ok ? secRes.json() : Promise.resolve([]),
                    curRes.ok ? curRes.json() : Promise.resolve([]),
                    profRes.ok ? profRes.json() : Promise.resolve([]),
                    diasRes.ok ? diasRes.json() : Promise.resolve([]),
                    bloqRes.ok ? bloqRes.json() : Promise.resolve([]),
                    configRes.ok ? configRes.json() : Promise.resolve([]),
                    horarioRes.ok ? horarioRes.json() : Promise.resolve(null),
                    gradosRes.ok ? gradosRes.json() : Promise.resolve([]),
                    sedesRes.ok ? sedesRes.json() : Promise.resolve([]),
                    turnosRes.ok ? turnosRes.json() : Promise.resolve([]),
                    seccionTurnosRes.ok ? seccionTurnosRes.json() : Promise.resolve([])
                ]);

                const diasOrdenados = diasData.sort((a, b) => a.orden - b.orden);
                const bloquesOrdenados = bloqData.sort((a, b) => a.numero_bloque - b.numero_bloque);
                const maxBlq = configData.reduce((acc, c) => Math.max(acc, c.bloques_dia || 0), 0);

                let asignacionesData = [];
                let nuevoStatus = 'empty';
                if (horarioData && horarioData.status === 'success' && horarioData.resultado?.asignaciones) {
                    asignacionesData = horarioData.resultado.asignaciones;
                    nuevoStatus = 'ready';
                } else if (horarioData && horarioData.asignaciones) {
                    asignacionesData = horarioData.asignaciones;
                    nuevoStatus = 'ready';
                }

                setSecciones(secData);
                setCursos(curData);
                setProfesores(profData);
                setDias(diasOrdenados);
                setBloques(bloquesOrdenados);
                setConfigGradoDia(configData);
                setGrados(gradosData);
                setSedes(sedesData);
                setTurnos(turnosData);
                setSeccionTurnos(stData);
                setMaxBloquesDia(maxBlq > 0 ? maxBlq : 6);
                setAsignaciones(asignacionesData);
                setStatus(nuevoStatus);

                if (profData.length > 0) {
                    setSelectedProfesor(`PROF_${profData[0].id_profesor}`);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                setStatus('empty');
            }
        };
        fetchData();
    }, []);

    const getCurso = (idStr) => {
        const id = parseInt(idStr.replace('CUR_', ''));
        const c = cursos.find(x => x.id_curso === id);
        return c ? c.nombre_curso : idStr;
    };

    const getSedePorSeccion = (secIdStr) => {
        const id = parseInt(secIdStr.replace('SEC_', ''));
        const s = secciones.find(x => x.id_seccion === id);
        if (s && s.id_sede) {
            const sede = sedes.find(x => x.id_sede === s.id_sede);
            return sede ? sede.nombre_sede : 'Sede Desconocida';
        }
        return 'Sede Desconocida';
    };

    const getGradoSeccion = (secIdStr) => {
        const id = parseInt(secIdStr.replace('SEC_', ''));
        const s = secciones.find(x => x.id_seccion === id);
        if (s) {
            let desc = '';
            if (s.id_grado) {
                const g = grados.find(x => x.id_grado === s.id_grado);
                if (g) desc += g.numero + '° ';
            }
            desc += s.nombre;
            return desc;
        }
        return secIdStr;
    };

    const getColor = (cursoIdStr) => {
        const id = parseInt(cursoIdStr.replace('CUR_', '')) || 0;
        const idx = cursos.findIndex(x => x.id_curso === id);
        return CURSO_COLORS[(idx >= 0 ? idx : id) % CURSO_COLORS.length];
    };

    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Filtramos las asignaciones del profesor seleccionado
    const filteredAsignaciones = asignaciones.filter(a =>
        a.profesor_id === selectedProfesor
    );

    // Identificar qué días tienen asignaciones para adaptar la tabla
    const assignedDays = new Set(filteredAsignaciones.map(a => normalize(a.dia)));
    // Como es profesor, mostramos todos los días que tengan actividad o los días configurados de la institución
    // Por simplicidad mostraremos los días laborables principales (1 a 5/6) que la institución configuró
    const diasConfigurados = [...new Set(configGradoDia.map(c => c.id_dia))];
    const gridDias = dias.filter(d => diasConfigurados.includes(d.id_dia) || assignedDays.has(normalize(d.nombre_dia)));

    // Determinar la cantidad de bloques
    let blockNumbers = Array.from({ length: maxBloquesDia }, (_, i) => i + 1);

    return (
        <div className={`w-full h-full flex flex-col items-center animate-fade-in relative ${status === 'empty' ? 'justify-center' : 'justify-start'}`}>
            
            {status === 'ready' && (
                <div className="w-full bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col flex-1 w-full max-w-md">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filtrar por Profesor</label>
                        <select
                            value={selectedProfesor}
                            onChange={e => setSelectedProfesor(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-hx-purple w-full"
                        >
                            <option value="">Seleccione un Profesor</option>
                            {profesores.map(p => (
                                <option key={p.id_profesor} value={`PROF_${p.id_profesor}`}>{p.nombre_profesor}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-4 mt-20">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-hx-purple rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                    </div>
                    <p className="text-slate-400 text-sm font-semibold">Cargando horarios...</p>
                </div>
            )}

            {status === 'empty' && (
                <div className="relative flex flex-col items-center justify-center max-w-2xl w-full mx-auto mt-6 p-8 rounded-[40px] overflow-hidden group transition-all duration-500">
                    <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up w-full">
                        <div className="w-40 h-40 mb-6 flex items-center justify-center drop-shadow-xl hover:scale-105 transition-transform duration-500">
                            <img
                                src="/imagen.svg"
                                alt="Ilustración de horarios"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <h2 className="text-[28px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 mb-3 tracking-tight">
                            Aún no hay horarios listos
                        </h2>

                        <p className="text-slate-500 text-[15px] font-medium max-w-[420px] mx-auto leading-relaxed mb-8">
                            Para ver el horario de los profesores, primero debes generar un horario general desde la sección "Generar Horario".
                        </p>
                    </div>
                </div>
            )}

            {status === 'ready' && (
                <div className="w-full animate-fade-in-up">
                    {selectedProfesor && filteredAsignaciones.length === 0 && (
                        <div className="p-6 bg-white border border-slate-200 rounded-[24px] text-center mb-5 shadow-sm">
                            <p className="text-slate-500 font-medium">Este profesor no tiene asignaciones en el horario actual.</p>
                        </div>
                    )}

                    {selectedProfesor && filteredAsignaciones.length > 0 && (
                        <div className="flex flex-col gap-8 items-start w-full">
                            {turnos.map(turno => {
                                // Filtrar las asignaciones que pertenecen a este turno
                                const asignacionesTurno = filteredAsignaciones.filter(a => {
                                    const secId = parseInt(a.seccion_id.replace('SEC_', ''));
                                    const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                                    if (!diaObj) return false;
                                    const st = seccionTurnos.find(st => st.id_seccion === secId && st.id_dia === diaObj.id_dia);
                                    return st && st.id_turno === turno.id_turno;
                                });

                                // Si el profesor no enseña en este turno, no mostramos la tabla
                                if (asignacionesTurno.length === 0) return null;

                                return (
                                    <div key={turno.id_turno} className="w-full bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-x-auto p-6">
                                        <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-hx-purple"></div>
                                            Turno {turno.nombre}
                                        </h3>
                                        <table className="w-full border-collapse min-w-[600px] table-fixed">
                                            <thead>
                                                <tr>
                                                    <th className="w-16 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Blq</th>
                                                    {gridDias.map((dia) => (
                                                        <th key={dia.id_dia} className="pb-3 px-1">
                                                            <div className="rounded-xl py-2.5 px-3 text-center" style={{ backgroundColor: DIA_COLOR.bg }}>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/70">{dia.nombre_dia.slice(0, 3).toUpperCase()}</p>
                                                                <p className="text-[14px] font-black text-white">{dia.nombre_dia}</p>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {blockNumbers.map((bNum) => {
                                                    return (
                                                        <tr key={bNum} style={{ height: '110px' }}>
                                                            <td className="py-1 pr-2 text-center align-middle" style={{ width: '52px' }}>
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                                                                    <span className="text-[11px] font-black text-slate-600">{bNum}</span>
                                                                </div>
                                                            </td>
                                                            {gridDias.map((dia) => {
                                                                const cubiertoPorAnterior = asignacionesTurno.some(x =>
                                                                    normalize(x.dia) === normalize(dia.nombre_dia)
                                                                    && x.horas > 1
                                                                    && (bNum - 1) > x.slot_inicio
                                                                    && (bNum - 1) < (x.slot_inicio + x.horas)
                                                                );
                                                                if (cubiertoPorAnterior) return null;

                                                                const a = asignacionesTurno.find(x =>
                                                                    normalize(x.dia) === normalize(dia.nombre_dia)
                                                                    && (bNum - 1) === x.slot_inicio
                                                                );

                                                                if (a) {
                                                                    const col = getColor(a.curso_id);
                                                                    const span = a.horas || 1;
                                                                    return (
                                                                        <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                            <div className="rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 border-2"
                                                                                style={{ backgroundColor: col.pastel, borderColor: col.solid, height: `calc(${span} * 110px - 8px)` }}>
                                                                                <div className="w-full flex flex-col items-center justify-center">
                                                                                    {span > 1 && (
                                                                                        <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border" style={{ borderColor: col.solid, color: col.solid, backgroundColor: 'transparent' }}>
                                                                                            {span} horas
                                                                                        </span>
                                                                                    )}
                                                                                    
                                                                                    <p className="text-[16px] md:text-[18px] font-black leading-snug" style={{ color: col.text }}>
                                                                                        {getCurso(a.curso_id)}
                                                                                    </p>
                                                                                    
                                                                                    <div className="mt-2 w-full flex flex-col gap-1 items-center">
                                                                                        <span className="inline-block px-2 py-1 rounded-[6px] text-[10px] font-black tracking-widest uppercase bg-white/50" style={{ color: col.solid }}>
                                                                                            {getGradoSeccion(a.seccion_id)}
                                                                                        </span>
                                                                                        
                                                                                        <span className="inline-block text-[9px] font-black tracking-wider uppercase opacity-80" style={{ color: col.text }}>
                                                                                            📍 {getSedePorSeccion(a.seccion_id)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <td key={dia.id_dia} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center" style={{ height: 'calc(110px - 8px)' }}>
                                                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                }
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
