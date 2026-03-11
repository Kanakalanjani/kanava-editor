import React from "react";

interface JsonPanelProps {
    jsonOutput: string;
    onClose: () => void;
}

export const JsonPanel: React.FC<JsonPanelProps> = ({ jsonOutput, onClose }) => {
    if (!jsonOutput) return null;

    return (
        <div className="pg-json">
            <div className="pg-json-header">
                <span>Document JSON</span>
                <button onClick={onClose}>Close</button>
            </div>
            <pre className="pg-json-content">{jsonOutput}</pre>
        </div>
    );
};
