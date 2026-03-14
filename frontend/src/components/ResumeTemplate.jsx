import React from 'react';

/**
 * Parses inline markdown: **bold**, *italic*, removes standalone asterisks
 * Returns an array of React elements.
 */
function renderInlineMarkdown(text) {
    if (!text) return null;
    const parts = [];
    // Match **bold**, *italic*, or plain text
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add any text before the match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        if (match[1] !== undefined) {
            // **bold**
            parts.push(<strong key={match.index}>{match[1]}</strong>);
        } else if (match[2] !== undefined) {
            // *italic*
            parts.push(<em key={match.index}>{match[2]}</em>);
        }
        lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}

const SECTION_STYLE = { marginBottom: '24px' };
const SECTION_HEADING = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderBottom: '1.5px solid #e5e7eb',
    paddingBottom: '4px',
    marginBottom: '14px',
};

const ResumeTemplate = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    const {
        personal_info = {},
        summary = '',
        skills = [],
        experience = [],
        education = [],
        projects = [],
    } = data;

    return (
        <div
            ref={ref}
            style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: '#111827',
                padding: '48px 56px',
                background: 'white',
                maxWidth: '800px',
                margin: '0 auto',
                lineHeight: '1.6',
                fontSize: '14px',
            }}
        >
            {/* ── Header ── */}
            <header style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 style={{
                    fontSize: '30px',
                    fontWeight: '800',
                    color: '#111827',
                    margin: '0 0 6px 0',
                    letterSpacing: '0.05em',
                    fontFamily: "'Inter', Arial, sans-serif",
                    textTransform: 'uppercase',
                }}>
                    {personal_info.name || 'Candidate Name'}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', fontSize: '13px', color: '#4b5563' }}>
                    {personal_info.email && (
                        <span>{personal_info.email}</span>
                    )}
                    {personal_info.phone && (
                        <>
                            <span style={{ color: '#d1d5db' }}>|</span>
                            <span>{personal_info.phone}</span>
                        </>
                    )}
                    {personal_info.links && personal_info.links.filter(Boolean).map((link, idx) => (
                        <React.Fragment key={idx}>
                            <span style={{ color: '#d1d5db' }}>|</span>
                            <a
                                href={link.startsWith('http') ? link : `https://${link}`}
                                style={{ color: '#4f46e5', textDecoration: 'none' }}
                            >
                                {link}
                            </a>
                        </React.Fragment>
                    ))}
                </div>
            </header>

            {/* ── Professional Summary ── */}
            {summary && (
                <section style={SECTION_STYLE}>
                    <h2 style={SECTION_HEADING}>Professional Summary</h2>
                    <p style={{ margin: 0, textAlign: 'justify' }}>
                        {renderInlineMarkdown(summary)}
                    </p>
                </section>
            )}

            {/* ── Skills ── */}
            {skills && skills.length > 0 && (
                <section style={SECTION_STYLE}>
                    <h2 style={SECTION_HEADING}>Skills</h2>
                    <p style={{ margin: 0 }}>
                        {skills.join(' • ')}
                    </p>
                </section>
            )}

            {/* ── Professional Experience ── */}
            {experience && experience.length > 0 && (
                <section style={SECTION_STYLE}>
                    <h2 style={SECTION_HEADING}>Professional Experience</h2>
                    {experience.map((exp, idx) => (
                        <div key={idx} style={{ marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, fontFamily: "'Inter', Arial, sans-serif" }}>
                                    {exp.title}
                                </h3>
                                <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '12px' }}>{exp.date}</span>
                            </div>
                            <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#374151', marginBottom: '8px', marginTop: '2px' }}>
                                {exp.company}{exp.location ? `, ${exp.location}` : ''}
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                {exp.description && exp.description.map((desc, dIdx) => (
                                    <li key={dIdx} style={{ marginBottom: '5px' }}>
                                        {renderInlineMarkdown(desc)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            )}

            {/* ── Projects ── */}
            {projects && projects.length > 0 && (
                <section style={SECTION_STYLE}>
                    <h2 style={SECTION_HEADING}>Projects</h2>
                    {projects.map((proj, idx) => (
                        <div key={idx} style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, fontFamily: "'Inter', Arial, sans-serif" }}>
                                    {proj.name}
                                </h3>
                                {proj.date && <span style={{ fontSize: '13px', color: '#6b7280' }}>{proj.date}</span>}
                            </div>
                            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
                                {renderInlineMarkdown(proj.description)}
                            </p>
                        </div>
                    ))}
                </section>
            )}

            {/* ── Education ── */}
            {education && education.length > 0 && (
                <section style={SECTION_STYLE}>
                    <h2 style={SECTION_HEADING}>Education</h2>
                    {education.map((edu, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, fontFamily: "'Inter', Arial, sans-serif" }}>
                                    {edu.degree}
                                </h3>
                                <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#374151' }}>{edu.institution}</div>
                            </div>
                            <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '12px' }}>{edu.date}</span>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
});

ResumeTemplate.displayName = 'ResumeTemplate';
export default ResumeTemplate;
