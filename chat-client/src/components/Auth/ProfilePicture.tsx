import React, { useState } from 'react';

const ProfilePicture: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('profilePicture', selectedFile);

        try {
            const response = await fetch('http://localhost:8080/auth/upload-profile-picture', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Profile picture uploaded successfully:', data);
            } else {
                console.error('Upload failed:', data.message);
            }
        } catch (error) {
            console.error('Error during upload:', error);
        }
    };

    return (
        <div>
            <h2>Upload Profile Picture</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
};

export default ProfilePicture;
