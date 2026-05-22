import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
const API_BASE = 'http://localhost:8000/api';

// Colores consistentes con CursosManager: borde sólido + fondo pastel
const CURSO_COLORS = [
    { solid: '#1e293b', pastel: '#f1f5f9', text: '#1e293b' },
    { solid: '#790EEC', pastel: '#f5f3ff', text: '#4c0d8f' },
    { solid: '#f43f5e', pastel: '#fff1f2', text: '#be123c' },
    { solid: '#10CFAE', pastel: '#f0fdf9', text: '#065f4a' },
    { solid: '#51B4E8', pastel: '#eff8ff', text: '#0c4a7a' },
    { solid: '#F3C252', pastel: '#fffbeb', text: '#7c4a00' },
    { solid: '#F1A5B9', pastel: '#fdf2f5', text: '#7c2042' },
    { solid: '#790EEC', pastel: '#ede9fe', text: '#4c0d8f' },
    { solid: '#10CFAE', pastel: '#f0fdfa', text: '#065f4a' },
    { solid: '#51B4E8', pastel: '#e0f2fe', text: '#0c4a7a' },
    { solid: '#f43f5e', pastel: '#ffe4e6', text: '#be123c' },
    { solid: '#F3C252', pastel: '#fef9c3', text: '#7c4a00' },
];

// Color único para encabezados de días
const DIA_COLOR = { bg: 'var(--color-hx-red)', text: '#ffffff' };



export default function HorariosManager() {
    const [status, setStatus] = useState('loading');
    const [loadingStep, setLoadingStep] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [maxBloquesDia, setMaxBloquesDia] = useState(6);

    const [secciones, setSecciones] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [dias, setDias] = useState([]);
    const [bloques, setBloques] = useState([]);

    const [selectedSeccion, setSelectedSeccion] = useState('');
    const [viewMode, setViewMode] = useState('seccion');

    const loadingMessages = [
        "Analizando disponibilidad de docentes...",
        "Calculando carga académica...",
        "Resolviendo restricciones del colegio...",
        "Optimizando cruces en las sedes...",
        "Validando turnos...",
        "¡Horarios generados con éxito!"
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hacer todas las peticiones en paralelo
                const [secRes, curRes, profRes, diasRes, bloqRes, configRes, horarioRes] = await Promise.all([
                    fetch(`${API_BASE}/secciones`),
                    fetch(`${API_BASE}/cursos`),
                    fetch(`${API_BASE}/profesores`),
                    fetch(`${API_BASE}/dias`),
                    fetch(`${API_BASE}/bloques`),
                    fetch(`${API_BASE}/grado-dia-config`),
                    fetch(`${API_BASE}/cargar-horario`)
                ]);

                // Parsear todos los JSON juntos (sin setState intermedios que causen re-renders parciales)
                const [secData, curData, profData, diasData, bloqData, configData, horarioData] = await Promise.all([
                    secRes.ok ? secRes.json() : Promise.resolve([]),
                    curRes.ok ? curRes.json() : Promise.resolve([]),
                    profRes.ok ? profRes.json() : Promise.resolve([]),
                    diasRes.ok ? diasRes.json() : Promise.resolve([]),
                    bloqRes.ok ? bloqRes.json() : Promise.resolve([]),
                    configRes.ok ? configRes.json() : Promise.resolve([]),
                    horarioRes.ok ? horarioRes.json() : Promise.resolve(null),
                ]);

                // Calcular valores derivados
                const diasOrdenados = diasData.sort((a, b) => a.orden - b.orden);
                const bloquesOrdenados = bloqData.sort((a, b) => a.numero_bloque - b.numero_bloque);
                const maxBlq = configData.reduce((acc, c) => Math.max(acc, c.bloques_dia || 0), 0);
                const primeraSeccion = secData.length > 0 ? `SEC_${secData[0].id_seccion}` : '';

                // Verificar si hay horario guardado
                let asignacionesData = [];
                let nuevoStatus = 'empty';
                if (horarioData && horarioData.status === 'success' && horarioData.resultado?.asignaciones) {
                    asignacionesData = horarioData.resultado.asignaciones;
                    nuevoStatus = 'ready';
                }

                // Un solo batch de setState — React los agrupa y hace un único re-render
                setSecciones(secData);
                setCursos(curData);
                setProfesores(profData);
                setDias(diasOrdenados);
                setBloques(bloquesOrdenados);
                setMaxBloquesDia(maxBlq > 0 ? maxBlq : 6);
                setAsignaciones(asignacionesData);
                setSelectedSeccion(primeraSeccion);
                setStatus(nuevoStatus);

            } catch (error) {
                console.error("Error fetching data:", error);
                setStatus('empty');
            }
        };
        fetchData();
    }, []);

    const handleGenerar = async () => {
        setStatus('generating');
        setLoadingStep(0);
        setErrorMsg(null);

        const interval = setInterval(() => {
            setLoadingStep(prev => prev < loadingMessages.length - 2 ? prev + 1 : prev);
        }, 1500);

        try {
            const res = await fetch(`${API_BASE}/generar-horario`, { method: 'POST' });
            const data = await res.json();

            if (data.status === 'error' || data.errores) {
                const msgs = data.errores ? data.errores.join(", ") : "Error desconocido del motor";
                setErrorMsg(`No se puede generar el horario por inconsistencias en los datos: ${msgs}`);
                setStatus('empty');
                clearInterval(interval);
                return;
            }

            if (data.status === 'success' && data.resultado && data.resultado.asignaciones) {
                setAsignaciones(data.resultado.asignaciones);
                clearInterval(interval);
                setLoadingStep(loadingMessages.length - 1);
                setTimeout(() => setStatus('ready'), 1000);
            } else if (data.asignaciones) {
                setAsignaciones(data.asignaciones);
                clearInterval(interval);
                setLoadingStep(loadingMessages.length - 1);
                setTimeout(() => setStatus('ready'), 1000);
            } else {
                throw new Error("Respuesta inválida del servidor");
            }
        } catch (error) {
            clearInterval(interval);
            setErrorMsg(`Hubo un error de conexión o validación con el motor de horarios: ${error.message}`);
            setStatus('empty');
        }
    };

    const exportarPDFActual = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById('horario-table-container');
            if (!element) return;
            element.style.background = 'white';
            const imgData = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
            element.style.background = '';
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const elRect = element.getBoundingClientRect();
            const pdfHeight = (elRect.height * pdfWidth) / elRect.width;
            const sec = secciones.find(s => `SEC_${s.id_seccion}` === selectedSeccion);
            const nombreSec = sec ? `${sec.nombre}` : 'General';
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.text(`Horario Académico - ${nombreSec}`, 14, 15);
            pdf.addImage(imgData, 'PNG', 14, 20, pdfWidth - 28, pdfHeight - 28);
            pdf.save(`Horario_${nombreSec.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            alert("Hubo un error al generar el PDF: " + (error.message || error));
        } finally {
            setIsExporting(false);
        }
    };

    const exportarTodosPDF = async () => {
        setIsExporting(true);
        try {
            const originalSeccion = selectedSeccion;
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            for (let i = 0; i < secciones.length; i++) {
                const sec = secciones[i];
                setSelectedSeccion(`SEC_${sec.id_seccion}`);
                await new Promise(resolve => setTimeout(resolve, 300));
                const element = document.getElementById('horario-table-container');
                if (!element) continue;
                element.style.background = 'white';
                const imgData = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
                element.style.background = '';
                const elRect = element.getBoundingClientRect();
                const pdfHeight = (elRect.height * pdfWidth) / elRect.width;
                if (i > 0) pdf.addPage();
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(16);
                pdf.text(`Horario Académico - ${sec.nombre}`, 14, 15);
                pdf.addImage(imgData, 'PNG', 14, 20, pdfWidth - 28, pdfHeight - 28);
            }
            setSelectedSeccion(originalSeccion);
            pdf.save('Horarios_Completos_Institucion.pdf');
        } catch (error) {
            alert("Hubo un error al generar los PDFs: " + (error.message || error));
        } finally {
            setIsExporting(false);
        }
    };

    const getCurso = (idStr) => {
        const id = parseInt(idStr.replace('CUR_', ''));
        const c = cursos.find(x => x.id_curso === id);
        return c ? c.nombre_curso : idStr;
    };

    const getProfesor = (idStr) => {
        const id = parseInt(idStr.replace('PROF_', ''));
        const p = profesores.find(x => x.id_profesor === id);
        return p ? p.nombre_profesor : idStr;
    };

    const getColor = (cursoIdStr) => {
        const id = parseInt(cursoIdStr.replace('CUR_', '')) || 0;
        const idx = cursos.findIndex(x => x.id_curso === id);
        return CURSO_COLORS[(idx >= 0 ? idx : id) % CURSO_COLORS.length];
    };

    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredAsignaciones = asignaciones.filter(a => a.seccion_id === selectedSeccion);
    const blockNumbers = Array.from({ length: maxBloquesDia }, (_, i) => i + 1);
    const gridDias = dias;

    return (
        <div className="w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center animate-fade-in relative pb-10">

            {/* Estado cargando datos del servidor */}
            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"/>
                        <div className="absolute inset-0 border-4 border-hx-blue rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }}/>
                    </div>
                    <p className="text-slate-400 text-sm font-semibold">Cargando horarios...</p>
                </div>
            )}

            {/* Estado vacío */}
            {status === 'empty' && (
                <div className="flex flex-col items-center justify-center max-w-2xl w-full mx-auto text-center p-12 bg-white rounded-[32px] border border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-hx-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"/>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-hx-pink/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"/>
                    <div className="relative z-10 flex flex-col items-center w-full">
                        {errorMsg && (
                            <div className="w-full bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6 font-bold text-sm text-left whitespace-pre-wrap">
                                {errorMsg}
                            </div>
                        )}
                        <div className="w-24 h-24 mb-8 bg-gradient-to-br from-indigo-500 via-hx-blue to-teal-400 rounded-3xl flex items-center justify-center shadow-lg shadow-hx-blue/20 rotate-3 hover:rotate-6 transition-transform duration-500">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Es hora de hacer la magia ✨</h2>
                        <p className="text-slate-500 text-[15px] font-medium max-w-md mx-auto mb-10 leading-relaxed">
                            Tienes todas las áreas, cursos, docentes y asignaciones listas. Deja que nuestro algoritmo CP-SAT arme el rompecabezas perfecto.
                        </p>
                        <button onClick={handleGenerar} className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-300 bg-slate-900 rounded-2xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
                            <div className="absolute inset-0 w-full h-full -ml-16 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine"/>
                            <svg className="w-5 h-5 text-hx-yellow group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                            <span className="text-[16px] tracking-wide relative z-10">Generar Horarios Automáticamente</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Estado cargando */}
            {status === 'generating' && (
                <div className="flex flex-col items-center justify-center max-w-xl w-full mx-auto p-12">
                    <div className="relative w-32 h-32 mb-12">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"/>
                        <div className="absolute inset-0 border-4 border-hx-blue rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}/>
                        <div className="absolute inset-4 border-4 border-slate-100 rounded-full"/>
                        <div className="absolute inset-4 border-4 border-hx-pink rounded-full border-b-transparent animate-spin-reverse" style={{ animationDuration: '2s' }}/>
                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl animate-pulse">✨</span></div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Procesando Motor CP-SAT</h3>
                    <div className="w-full space-y-3">
                        {loadingMessages.map((msg, index) => (
                            <div key={index} className={`flex items-center gap-4 transition-all duration-500 ${index < loadingStep ? 'opacity-100' : index === loadingStep ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden m-0'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${index < loadingStep ? 'bg-green-100 text-green-500' : 'bg-hx-blue/10 text-hx-blue'}`}>
                                    {index < loadingStep
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        : <div className="w-2.5 h-2.5 rounded-full bg-hx-blue animate-ping"/>
                                    }
                                </div>
                                <p className={`font-semibold text-[15px] ${index < loadingStep ? 'text-slate-400' : 'text-slate-800'}`}>{msg}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Horario listo */}
            {status === 'ready' && (
                <div className="w-full animate-fade-in-up">

                    {/* Header simple */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Horarios Generados</h2>
                            <p className="text-slate-400 text-sm mt-0.5 font-medium">Vista por sección académica</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={handleGenerar} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white rounded-xl transition-all shadow-sm">
                                Regenerar
                            </button>
                            <button onClick={exportarPDFActual} disabled={isExporting} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-bold rounded-xl transition-all shadow-sm">
                                {isExporting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                                PDF Sección
                            </button>
                            <button onClick={exportarTodosPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2.5 bg-[#1A5AD7] text-white text-sm font-bold rounded-xl hover:bg-[#1548c0] transition-all shadow-md shadow-[#1A5AD7]/25">
                                {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
                                PDF Completo
                            </button>
                        </div>
                    </div>

                    {/* Pills de sección */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {secciones.map(sec => (
                            <button key={sec.id_seccion}
                                onClick={() => setSelectedSeccion(`SEC_${sec.id_seccion}`)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                                    selectedSeccion === `SEC_${sec.id_seccion}`
                                        ? 'bg-[#1A5AD7] text-white border-[#1A5AD7] shadow-md shadow-[#1A5AD7]/20'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-[#1A5AD7]/40 hover:text-[#1A5AD7]'
                                }`}>
                                {sec.nombre}{sec.grado?.numero ? ` · ${sec.grado.numero}°` : ''}
                            </button>
                        ))}
                    </div>

                    {/* Tabla con rowSpan para bloques fusionados */}
                    <div id="horario-table-container" className="bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-x-auto p-6">
                        <table className="w-full border-collapse min-w-[600px]">
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
                                    // Calcular qué celdas se deben renderizar (omitir las cubiertas por rowSpan)
                                    return (
                                        <tr key={bNum} style={{ height: '80px' }}>
                                            {/* Número de bloque */}
                                            <td className="py-1 pr-2 text-center align-middle" style={{ width: '52px' }}>
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                                                    <span className="text-[11px] font-black text-slate-600">{bNum}</span>
                                                </div>
                                            </td>
                                            {gridDias.map((dia) => {
                                                // Verificar si este bloque está cubierto por un rowSpan de un bloque anterior
                                                const cubiertoPorAnterior = filteredAsignaciones.some(x =>
                                                    normalize(x.dia) === normalize(dia.nombre_dia)
                                                    && x.horas > 1
                                                    && (bNum - 1) > x.slot_inicio
                                                    && (bNum - 1) < (x.slot_inicio + x.horas)
                                                );
                                                if (cubiertoPorAnterior) return null;

                                                // Buscar asignación que empiece en este bloque
                                                const a = filteredAsignaciones.find(x =>
                                                    normalize(x.dia) === normalize(dia.nombre_dia)
                                                    && (bNum - 1) === x.slot_inicio
                                                );

                                                if (a) {
                                                    const col = getColor(a.curso_id);
                                                    const span = a.horas || 1;
                                                    return (
                                                        <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                            <div className="rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:shadow-lg border-2"
                                                                style={{ backgroundColor: col.pastel, borderColor: col.solid, height: `calc(${span} * 80px - 8px)` }}>
                                                                <div>
                                                                    {span > 1 && (
                                                                        <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border" style={{ borderColor: col.solid, color: col.solid, backgroundColor: 'transparent' }}>
                                                                            {span} horas
                                                                        </span>
                                                                    )}
                                                                    <p className="text-[18px] font-black leading-snug" style={{ color: col.text }}>
                                                                        {getCurso(a.curso_id)}
                                                                    </p>
                                                                    <p className="text-[11px] font-semibold mt-2" style={{ color: col.text, opacity: 0.75 }}>
                                                                        <span className="font-black" style={{ opacity: 1 }}>Profesor: </span>{getProfesor(a.profesor_id)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                } else {
                                                    return (
                                                        <td key={dia.id_dia} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center" style={{ height: 'calc(80px - 8px)' }}>
                                                                <div className="w-1 h-1 rounded-full bg-slate-300"/>
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

                        {/* Leyenda de cursos */}
                        {filteredAsignaciones.length > 0 && (() => {
                            const cursosEnSeccion = [...new Set(filteredAsignaciones.map(a => a.curso_id))];
                            return (
                                <div className="mt-6 pt-5 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cursos en esta sección</p>
                                    <div className="flex flex-wrap gap-2">
                                        {cursosEnSeccion.map(cid => {
                                            const col = getColor(cid);
                                            return (
                                                <span key={cid} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border-2"
                                                    style={{ backgroundColor: col.pastel, borderColor: col.solid, color: col.text }}>
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.solid }}/>
                                                    {getCurso(cid)}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shine { 100% { left: 125%; } }
                .animate-shine { animation: shine 3s infinite linear; }
                .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
                @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
