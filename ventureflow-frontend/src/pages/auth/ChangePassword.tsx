import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { showAlert } from '../../components/Alert';
import coverImage from '../../assets/image/cover.svg';

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
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
            showAlert({ type: 'success', message: 'Password changed successfully!' });
            navigate('/dashboard');
        } catch (error: any) {
            showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-screen flex-col md:flex-row overflow-hidden bg-white font-poppins">
            <div className="hidden md:flex flex-col md:w-2/3 w-full justify-center items-start bg-white overflow-hidden relative h-[97vh] pr-2 pl-[15px] pt-[20px] rounded-[20px]">
                <img
                    src={coverImage}
                    alt="Venture Flow Cover"
                    className="w-full h-full object-cover rounded-[20px]"
                />
            </div>

            <div className="flex flex-col justify-center items-center px-6 sm:px-12 py-6 bg-white w-full md:w-1/3 shadow-md">
                <div className="w-full max-w-sm">
                    <h1 className="text-2xl font-bold text-[#064771] mb-2 font-poppins">Change Your Password</h1>
                    <p className="text-gray-500 mb-8 font-poppins">For security reasons, you must change your password before continuing.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-poppins">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#064771] outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 font-poppins">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#064771] outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#064771] text-white font-bold rounded-lg hover:bg-[#053a5c] transition-colors flex items-center justify-center font-poppins"
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
        </div>
    );
};

export default ChangePassword;
