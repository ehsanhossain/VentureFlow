import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { showAlert } from '../../components/Alert';
import successImage from '../../assets/image/password_change_success.png';

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showAlert({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        if (password.length < 8) {
            showAlert({ type: 'error', message: 'Password must be at least 8 characters long.' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/user/change-password', { password });
            setSuccess(true);
        } catch (error: any) {
            showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-white px-6 text-center">
                <div className="w-full max-w-lg flex flex-col items-center">
                    <h1 className="text-3xl font-medium text-[#064771] mb-2 flex flex-col items-center gap-2 text-center">
                        <span className="block w-full">VentureFlow</span>
                        <span className="block w-full">Congrats!!</span>
                    </h1>

                    <p className="text-gray-500 mb-8 max-w-md">
                        Great news! You've successfully reset your password. Please head to the login page to sign in now.
                    </p>

                    <div className="mb-8 w-full flex justify-center">
                        <img
                            src={successImage}
                            alt="Success"
                            className="w-full max-w-[300px] object-contain"
                        />
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-3 bg-[#064771] text-white font-medium rounded-full hover:bg-[#053a5c] transition-colors shadow-lg text-lg"
                    >
                        Continue your M&A Journey
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen flex justify-center items-center bg-white px-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-medium text-[#064771] mb-2">VentureFlow</h1>
                    <h2 className="text-xl font-medium text-gray-900">Change Your Password</h2>
                    <p className="text-gray-500 mt-2 text-sm">For security reasons, you must change your password before continuing.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 ">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#064771] focus:border-[#064771] outline-none transition-all bg-gray-50"
                            placeholder="Enter new password"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 ">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#064771] focus:border-[#064771] outline-none transition-all bg-gray-50"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#064771] text-white font-medium rounded-xl hover:bg-[#053a5c] transition-all shadow-md mt-4 flex items-center justify-center font-medium"
                    >
                        {loading ? (
                            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
                        ) : (
                            'Reset Password & Continue'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
