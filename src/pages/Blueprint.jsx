import React from 'react';
import { UploadCloud } from 'lucide-react';

const Blueprint = () => (
    <>
        <div className="section-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Digital Infrastructure Maps</h2>
        </div>
        <div className="blueprint-drop">
            <UploadCloud size={52} style={{ color: 'var(--accent)', marginBottom: 18 }} />
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Upload Campus Blueprints</h3>
            <p style={{ color: 'var(--secondary-text)', marginBottom: 24, fontSize: 14 }}>
                Upload master architecture files for campus-wide synchronization.
            </p>
            <button className="btn-primary">Browse Files</button>
        </div>
    </>
);

export default Blueprint;
