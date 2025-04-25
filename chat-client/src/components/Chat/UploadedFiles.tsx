import React from 'react';
import './UploadedFiles.css';

interface UploadedFilesProps {
    files: File[];
    isUploading?: boolean; // Lowercase "boolean" for the type
}

const UploadedFiles: React.FC<UploadedFilesProps> = ({ files, isUploading }) => {
    return (
        <div className="uploaded-files">
            {isUploading && <p className="uploading">Uploading file...</p>}

            {files.length > 0 && (
                <>
                    <h3>Uploaded Files:</h3>
                    <ul>
                        {files.map((file, index) => (
                            <li key={index}>
                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default UploadedFiles;
