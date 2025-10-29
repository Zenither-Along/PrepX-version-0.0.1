import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeOffIcon } from './icons';

const ProfileView: React.FC = () => {
    const { currentUser, changePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        
        setIsLoading(true);
        const { success, message } = await changePassword(currentPassword, newPassword);
        if (success) {
            setSuccess(message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setError(message);
        }
        setIsLoading(false);
    };

    if (!currentUser) return null;

    return (
        <div className="bg-brand-primary h-full flex flex-col">
            <header className="flex-shrink-0 flex items-center px-4 sm:px-8 border-b border-brand-accent h-16">
                <h1 className="text-2xl font-bold text-brand-text">Profile & Settings</h1>
            </header>
            <main className="flex-grow overflow-y-auto p-4 sm:p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-brand-secondary p-6 rounded-lg border border-brand-accent">
                        <h2 className="text-xl font-semibold mb-2 text-brand-text">Account Information</h2>
                        <p className="text-gray-600 mb-6">Your username is permanent and cannot be changed.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                value={currentUser.username}
                                disabled
                                className="mt-1 block w-full px-3 py-2 border border-brand-accent rounded-md shadow-sm bg-brand-accent text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="mt-8">
                        <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-lg border border-brand-accent">
                            <h2 className="text-xl font-semibold mb-4 text-brand-text">Change Password</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                                    <div className="relative mt-1">
                                        <input
                                            type={isCurrentPasswordVisible ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="block w-full px-3 py-2 pr-10 border border-brand-accent rounded-md shadow-sm bg-brand-primary text-brand-text focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                                        />
                                        <button type="button" onClick={() => setIsCurrentPasswordVisible(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                                            {isCurrentPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                                     <div className="relative mt-1">
                                        <input
                                            type={isNewPasswordVisible ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="block w-full px-3 py-2 pr-10 border border-brand-accent rounded-md shadow-sm bg-brand-primary text-brand-text focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                                        />
                                        <button type="button" onClick={() => setIsNewPasswordVisible(p => !p)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                                            {isNewPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                    <input
                                        type={isNewPasswordVisible ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-brand-accent rounded-md shadow-sm bg-brand-primary text-brand-text focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                                    />
                                </div>
                            </div>
                            
                            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
                            {success && <p className="text-sm text-green-600 mt-4">{success}</p>}

                            <div className="mt-6 flex justify-center">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-primary bg-brand-text hover:bg-gray-800 disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfileView;