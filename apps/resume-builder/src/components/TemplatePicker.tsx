import React from "react";
import type { ResumeTemplate } from "../data/templates.js";
import { RESUME_TEMPLATES } from "../data/templates.js";
import { X, FileText, PenLine, Columns2 } from "lucide-react";

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
    professional: <FileText size={24} />,
    minimal: <PenLine size={24} />,
    "two-column": <Columns2 size={24} />,
};

interface TemplatePickerProps {
    onSelect: (template: ResumeTemplate) => void;
    onClose: () => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect, onClose }) => {
    return (
        <div className="rb-template-overlay" onClick={onClose}>
            <div className="rb-template-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rb-template-header">
                    <h2 className="rb-template-title">Choose a Template</h2>
                    <button className="rb-template-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="rb-template-grid">
                    {RESUME_TEMPLATES.map((tpl) => (
                        <button
                            key={tpl.id}
                            className="rb-template-card"
                            onClick={() => onSelect(tpl)}
                        >
                            <span className="rb-template-icon">{TEMPLATE_ICONS[tpl.id] ?? tpl.icon}</span>
                            <span className="rb-template-name">{tpl.name}</span>
                            <span className="rb-template-desc">{tpl.description}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
