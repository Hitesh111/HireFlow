import React, { useState, useRef } from 'react';
import { Upload, FileText, Wand2, Download, Check, AlertCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import ResumeTemplate from '../components/ResumeTemplate';

export default function Tailor({ addToast }) {
    // Master Resume State
    const [resumeInputMode, setResumeInputMode] = useState('file'); // 'file' or 'text'
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeText, setResumeText] = useState('');
    
    // Job Description State
    const [jdInputMode, setJdInputMode] = useState('text'); // 'file' or 'text'
    const [jdFile, setJdFile] = useState(null);
    const [jdText, setJdText] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [tailoredResume, setTailoredResume] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showThinking, setShowThinking] = useState(false);
    const [inputScores, setInputScores] = useState(null);
    const [outputScores, setOutputScores] = useState(null);
    const pdfRef = useRef(null);

    const handleGenerate = async () => {
        if (resumeInputMode === 'file' && !resumeFile) {
            addToast('Please upload a master resume file', 'error');
            return;
        }
        if (resumeInputMode === 'text' && !resumeText.trim()) {
            addToast('Please paste your master resume text', 'error');
            return;
        }
        if (jdInputMode === 'file' && !jdFile) {
            addToast('Please upload a job description file', 'error');
            return;
        }
        if (jdInputMode === 'text' && !jdText.trim()) {
            addToast('Please paste a job description', 'error');
            return;
        }

        setIsLoading(true);
        setTailoredResume(null);
        setInputScores(null);
        setOutputScores(null);
        setLogs([]);  // Clear previous logs when starting a new generation

        try {
            const formData = new FormData();
            
            // Append Resume
            if (resumeInputMode === 'file') {
                formData.append('master_resume_file', resumeFile);
            } else {
                formData.append('master_resume_text', resumeText);
            }

            // Append JD
            if (jdInputMode === 'file') {
                formData.append('job_description_file', jdFile);
            } else {
                formData.append('job_description_text', jdText);
            }

            const response = await fetch('/api/tailor_resume', {
                method: 'POST',
                body: formData, // No Content-Type header needed; browser boundary will be set
            });

            if (!response.ok) {
                let errorMsg = 'Failed to tailor resume';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.detail || errorMsg;
                } catch(e) {}
                throw new Error(errorMsg);
            }

            // Read the SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                
                // Keep the last partial chunk in the buffer
                buffer = lines.pop() || "";

                for (const chunk of lines) {
                    if (!chunk.trim()) continue;
                    
                    const eventMatch = chunk.match(/^event:\s*(.*?)$/m);
                    const dataMatch = chunk.match(/^data:\s*(.*?)$/m);
                    
                    if (eventMatch && dataMatch) {
                        const event = eventMatch[1].trim();
                        let dataStr = dataMatch[1].trim();
                        if (event === "log") {
                            // Unescape newlines for display
                            dataStr = dataStr.replace(/\\n/g, '\n');
                            setLogs(prev => [...prev, dataStr]);
                        } else if (event === "result") {
                            // Final payload is base64-encoded JSON to avoid SSE newline corruption
                            try {
                                const decodedStr = atob(dataStr);
                                const parsedEventContent = JSON.parse(decodedStr);
                                // The backend returns a JSON string inside the formatted_resume key.
                                const resumeJsonObject = JSON.parse(parsedEventContent.formatted_resume);
                                setTailoredResume(resumeJsonObject);
                                // Parse and set scores
                                if (parsedEventContent.input_scores) setInputScores(parsedEventContent.input_scores);
                                if (parsedEventContent.output_scores) setOutputScores(parsedEventContent.output_scores);
                                addToast('Resume tailored successfully!', 'success');
                            } catch (e) {
                                console.error("Failed to parse result JSON:", e);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Tailoring error:', error);
            addToast(error.message || 'Failed to connect to server', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!tailoredResume || !pdfRef.current) return;

        addToast('Generating PDF sequence initiated...');
        
        const opt = {
            margin:       0,
            filename:     'tailored_resume.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(pdfRef.current).save().then(() => {
            addToast('Resume PDF downloaded successfully!', 'success');
        }).catch(err => {
            console.error("PDF generation failed:", err);
            addToast('Failed to generate PDF', 'error');
        });
    };

    const isReady = (resumeInputMode === 'file' ? !!resumeFile : !!resumeText.trim()) &&
                    (jdInputMode === 'file' ? !!jdFile : !!jdText.trim());

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-title">
                    <Wand2 className="header-icon" />
                    <h1>Tailor Resume</h1>
                </div>
                <p className="header-subtitle">
                    Provide your master resume (JSON, PDF, DOCX, or Text) and a job description to generate a highly targeted, ATS-optimized resume using AI.
                </p>
            </header>

            <div className="workflow-layout">
                {/* ----------------- TOP ROW: INPUTS ----------------- */}
                <div className="inputs-row">
                    {/* Master Resume Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">1. Master Resume</h2>
                            <div className="tab-group">
                                <button 
                                    className={`tab-btn ${resumeInputMode === 'file' ? 'active' : ''}`}
                                    onClick={() => setResumeInputMode('file')}
                                >File</button>
                                <button 
                                    className={`tab-btn ${resumeInputMode === 'text' ? 'active' : ''}`}
                                    onClick={() => setResumeInputMode('text')}
                                >Plain Text</button>
                            </div>
                        </div>
                        <div className="card-body">
                            {resumeInputMode === 'file' ? (
                                <div className="upload-container">
                                    <label className="upload-label">
                                        <input 
                                            type="file" 
                                            accept=".json,application/json,.pdf,.docx" 
                                            onChange={(e) => setResumeFile(e.target.files[0] || null)} 
                                            className="hidden-input" 
                                        />
                                        <div className="upload-area">
                                            {resumeFile ? (
                                                <>
                                                    <Check className="icon-success" size={32} />
                                                    <span className="upload-text">{resumeFile.name} loaded</span>
                                                    <span className="upload-hint">Ready for AI processing</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="icon-muted" size={32} />
                                                    <span className="upload-text">Click to upload Master Resume</span>
                                                    <span className="upload-hint">Supports .json, .pdf, .docx</span>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <textarea
                                    className="input-textarea"
                                    placeholder="Paste your resume text here (or pure JSON)..."
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    rows={8}
                                />
                            )}
                        </div>
                    </div>

                    {/* Job Description Card */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h2 className="card-title">2. Job Description</h2>
                            <div className="tab-group">
                                <button 
                                    className={`tab-btn ${jdInputMode === 'text' ? 'active' : ''}`}
                                    onClick={() => setJdInputMode('text')}
                                >Plain Text</button>
                                <button 
                                    className={`tab-btn ${jdInputMode === 'file' ? 'active' : ''}`}
                                    onClick={() => setJdInputMode('file')}
                                >File</button>
                            </div>
                        </div>
                        <div className="card-body">
                            {jdInputMode === 'text' ? (
                                <textarea
                                    className="input-textarea"
                                    placeholder="Paste the full job description here..."
                                    value={jdText}
                                    onChange={(e) => setJdText(e.target.value)}
                                    rows={8}
                                />
                            ) : (
                                <div className="upload-container">
                                    <label className="upload-label">
                                        <input 
                                            type="file" 
                                            accept=".pdf,.docx,.txt" 
                                            onChange={(e) => setJdFile(e.target.files[0] || null)} 
                                            className="hidden-input" 
                                        />
                                        <div className="upload-area">
                                            {jdFile ? (
                                                <>
                                                    <Check className="icon-success" size={32} />
                                                    <span className="upload-text">{jdFile.name} loaded</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="icon-muted" size={32} />
                                                    <span className="upload-text">Click to upload Job Description</span>
                                                    <span className="upload-hint">Supports .pdf, .docx, .txt</span>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ----------------- MIDDLE ROW: ACTION ----------------- */}
                <div className="action-row">
                    <button 
                        className="btn btn-primary btn-generate" 
                        onClick={handleGenerate}
                        disabled={isLoading || !isReady}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner-small"></div>
                                <span>Analyzing & Tailoring...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} />
                                <span>Generate Tailored Resume</span>
                            </>
                        )}
                    </button>
                </div>

                {/* ----------------- BOTTOM ROW: OUTPUT ----------------- */}
                <div className="output-row">
                    <div className="card h-full flex flex-col">
                        <div className="card-header flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h2 className="card-title mb-0">3. Tailored Result</h2>
                                {logs.length > 0 && (
                                    <span
                                        onClick={() => setShowThinking(v => !v)}
                                        style={{
                                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                            color: showThinking ? 'var(--primary)' : 'var(--text-muted)',
                                            background: showThinking ? 'rgba(99,102,241,0.12)' : 'transparent',
                                            border: '1px solid var(--border)', borderRadius: '20px',
                                            padding: '3px 10px', transition: 'all 0.2s'
                                        }}
                                    >
                                        {showThinking ? '↑ Hide' : '▶ Logs'}
                                    </span>
                                )}
                            </div>
                            {tailoredResume && (
                                <button className="btn btn-outline btn-sm" onClick={handleDownload} style={{gap: '8px', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none'}}>
                                    <Download size={16} />
                                    <span>Download PDF</span>
                                </button>
                            )}
                        </div>
                        <div className="card-body flex-1 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Agent logs panel */}
                            {showThinking && logs.length > 0 && (
                                <div style={{background:'#0f172a', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px', border:'1px solid #1e293b'}}>
                                    {logs.map((log, idx) => (
                                        <div key={idx} style={{display:'flex', alignItems:'center', gap:'10px', padding:'4px 0'}}>
                                            <span style={{width:'18px', height:'18px', borderRadius:'50%', background: idx === logs.length - 1 && isLoading ? '#f59e0b' : '#22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', flexShrink:0}}>✓</span>
                                            <span style={{fontSize:'12px', color:'#94a3b8'}}>{log}</span>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'4px 0'}}>
                                            <div style={{width:'18px', height:'18px', borderRadius:'50%', border:'2px solid #6366f1', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', flexShrink:0}} />
                                            <span style={{fontSize:'12px', color:'#6366f1'}}>Processing...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isLoading && !tailoredResume ? (
                                <div className="loading-state">
                                    <div className="spinner large"></div>
                                    <p style={{maxWidth:'360px', textAlign:'center'}}>AI is crafting your tailored resume...
                                        <br/><span style={{fontSize:'12px', opacity:0.6}}>Usually takes 30–60 seconds</span>
                                    </p>
                                </div>
                            ) : tailoredResume ? (
                                <div className="result-container" style={{backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', overflowY: 'auto'}}>

                                    {/* ATS Score Cards */}
                                    {(inputScores || outputScores) && (
                                        <div style={{marginBottom:'24px'}}>
                                            <div style={{fontSize:'12px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px'}}>ATS Compatibility Analysis</div>
                                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                                                {[
                                                    {label: 'Original Resume', icon: '📄', scores: inputScores, accent: '#f59e0b', dim: true},
                                                    {label: 'Tailored Resume', icon: '✨', scores: outputScores, accent: '#818cf8', dim: false}
                                                ].map(({label, icon, scores, accent, dim}) => scores && (
                                                    <div key={label} style={{background: dim ? '#1a2236' : '#1e1b4b', borderRadius:'10px', padding:'16px', border:`1px solid ${accent}44`, opacity: dim ? 0.85 : 1}}>
                                                        <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'14px'}}>
                                                            <span style={{fontSize:'16px'}}>{icon}</span>
                                                            <span style={{fontSize:'12px', fontWeight:'700', color: accent, textTransform:'uppercase', letterSpacing:'0.05em'}}>{label}</span>
                                                            <span style={{marginLeft:'auto', fontSize:'20px', fontWeight:'800', color: (() => {const avg = Math.round(Object.values(scores).reduce((a,b)=>a+b,0)/4); return avg >= 80 ? '#22c55e' : avg >= 60 ? '#f59e0b' : '#ef4444';})()}}>
                                                                {Math.round(Object.values(scores).reduce((a,b)=>a+b,0)/4)}%
                                                            </span>
                                                        </div>
                                                        {[
                                                            {key: 'jd_match', label: 'JD Match'},
                                                            {key: 'skills_coverage', label: 'Skills'},
                                                            {key: 'experience_relevance', label: 'Experience'},
                                                            {key: 'ats_formatting', label: 'ATS Format'},
                                                        ].map(({key, label: metricLabel}) => {
                                                            const val = scores[key] ?? 0;
                                                            const inputVal = inputScores?.[key] ?? 0;
                                                            const delta = scores === outputScores ? val - inputVal : null;
                                                            const color = val >= 80 ? '#22c55e' : val >= 60 ? '#f59e0b' : '#ef4444';
                                                            return (
                                                                <div key={key} style={{marginBottom:'9px'}}>
                                                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}>
                                                                        <span style={{fontSize:'11px', color:'#64748b'}}>{metricLabel}</span>
                                                                        <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                                                                            {delta !== null && delta !== 0 && <span style={{fontSize:'10px', fontWeight:'700', color: delta > 0 ? '#22c55e' : '#ef4444'}}>{delta > 0 ? '+' : ''}{delta}</span>}
                                                                            <span style={{fontSize:'11px', fontWeight:'700', color}}>{val}%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{background:'#1e293b', borderRadius:'3px', height:'5px', overflow:'hidden'}}>
                                                                        <div style={{width:`${val}%`, height:'100%', background:color, borderRadius:'3px', transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)'}}/>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Resume Preview */}
                                    <div style={{borderRadius:'8px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
                                        <ResumeTemplate data={tailoredResume} ref={pdfRef} />
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <FileText className="icon-muted mb-4" size={48} />
                                    <h3>No Resume Generated Yet</h3>
                                    <p>Upload your inputs and click generate to see the structured, tailored result here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx="true">{`
                .workflow-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    margin-top: 32px;
                }
                
                .inputs-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                .action-row {
                    display: flex;
                    justify-content: center;
                    padding: 16px 0;
                }

                .btn-generate {
                    padding: 16px 48px;
                    font-size: 16px;
                    border-radius: 30px;
                    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4);
                }

                .btn-generate:hover:not(:disabled) {
                    transform: translateY(-2px) scale(1.02);
                }

                .output-row {
                    width: 100%;
                }
                
                @media (max-width: 1024px) {
                    .inputs-row {
                        grid-template-columns: 1fr;
                    }
                }
                
                .h-full { height: 100%; }
                .flex { display: flex; }
                .flex-col { flex-direction: column; }
                .flex-1 { flex: 1; }
                .overflow-hidden { overflow: hidden; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .mb-4 { margin-bottom: 16px; }
                
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .tab-group {
                    display: flex;
                    background-color: var(--bg-secondary);
                    border-radius: 6px;
                    overflow: hidden;
                    border: 1px solid var(--border);
                }
                
                .tab-btn {
                    padding: 6px 12px;
                    font-size: 0.8rem;
                    border: none;
                    background: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .tab-btn.active {
                    background-color: var(--primary);
                    color: white;
                }
                
                .tab-btn:hover:not(.active) {
                    background-color: rgba(0, 0, 0, 0.05);
                }
                
                .upload-container {
                    border: 2px dashed var(--border);
                    border-radius: 8px;
                    padding: 32px;
                    text-align: center;
                    transition: all 0.2s;
                    background-color: var(--bg-secondary);
                }
                
                .upload-container:hover {
                    border-color: var(--primary);
                    background-color: var(--primary-light);
                }
                
                .upload-label {
                    cursor: pointer;
                    display: block;
                    width: 100%;
                }
                
                .hidden-input {
                    display: none;
                }
                
                .upload-area {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }
                
                .upload-text {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                
                .upload-hint {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                
                .icon-muted { color: var(--text-muted); }
                .icon-success { color: var(--success); }
                
                .input-textarea {
                    width: 100%;
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background-color: var(--bg-secondary);
                    color: var(--text-primary);
                    font-family: inherit;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    resize: vertical;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                .input-textarea:focus {
                    border-color: var(--primary);
                }
                
                .btn-sm {
                    padding: 6px 12px;
                    font-size: 0.85rem;
                }
                
                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: var(--text-muted);
                    padding: 48px 24px;
                }
                
                .loading-state p, .empty-state p {
                    margin-top: 16px;
                    max-width: 400px;
                }
                
                .empty-state h3 {
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }
                
                .result-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    gap: 16px;
                }
                
                .success-banner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background-color: rgba(16, 185, 129, 0.1);
                    color: var(--success);
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 0.9rem;
                }
                
                .code-viewer {
                    flex: 1;
                    background-color: #1e1e1e;
                    border-radius: 8px;
                    overflow: auto;
                    padding: 16px;
                }
                
                .code-viewer pre {
                    margin: 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                
                .code-viewer code {
                    color: #d4d4d4;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                    font-size: 0.85rem;
                    line-height: 1.5;
                }
                
                .mb-0 { margin-bottom: 0; }
                .gap-4 { gap: 16px; }
                .gap-2 { gap: 8px; }
                .text-sm { font-size: 0.875rem; }
                .text-gray-400 { color: #9ca3af; }
                .cursor-pointer { cursor: pointer; }

                .thinking-viewer {
                    background-color: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                    max-height: 150px;
                }
                .thinking-header {
                    background-color: #2d2d2d;
                    padding: 6px 12px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #aaa;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border-top-left-radius: 6px;
                    border-top-right-radius: 6px;
                }
                .thinking-content {
                    padding: 8px 12px;
                    overflow-y: auto;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                    font-size: 0.8rem;
                    color: #4ade80;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .log-entry {
                    word-break: break-all;
                }
                .log-indicator {
                    color: #3b82f6;
                    margin-right: 6px;
                }
            `}</style>
        </div>
    );
}
