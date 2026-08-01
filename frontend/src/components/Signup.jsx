import { useState } from "react";
import axios from "axios";
import "./Signup.css"; // Import external CSS
import { Link, useNavigate } from "react-router-dom";
import { Cloud, Lock, Mail, User, X, Eye, EyeOff } from 'lucide-react'; // Added icons for better UI
import { API_URL } from '../config';

const Signup = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password validation function
    const validatePassword = (password) => {
        let errors = [];
        if (password.length < 8) errors.push("❌ At least 8 characters");
        if (!/[a-z]/.test(password)) errors.push("❌ One lowercase letter");
        if (!/[A-Z]/.test(password)) errors.push("❌ One uppercase letter");
        if (!/\d/.test(password)) errors.push("❌ One number");
        if (!/[!@#$%^&*]/.test(password)) errors.push("❌ One special character (!@#$%^&*)");
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === "password") {
            setPasswordErrors(validatePassword(value));
        }
        if (name === "confirmPassword") {
            setConfirmPasswordError(value !== formData.password ? "❌ Passwords do not match" : "");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (!termsAccepted) {
            setMessage("❌ Please accept the Terms and Conditions to proceed.");
            setLoading(false);
            return;
        }

        const passwordValidationErrors = validatePassword(formData.password);
        if (passwordValidationErrors.length > 0) {
            setMessage("❌ Password does not meet security requirements.");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage("❌ Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            // Updated to the existing register endpoint
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name, // The backend currently only looks for email and password, but passing name is fine
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("✅ Signup Successful! You can login now.");
                setFormData({ name: "", email: "", password: "", confirmPassword: "" });
                setPasswordErrors([]);
                setConfirmPasswordError("");

                setTimeout(() => {
                    navigate("/login");
                }, 3000); // Redirect to login after 3 seconds
            } else {
                setMessage(`❌ ${data.error || data.message || "Signup failed. Try again."}`);
            }
        } catch (error) {
            setMessage("❌ Server Error: Unable to reach backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container auth-container">
            <div className="signup-form auth-box glass-panel">
                <div className="text-center mb-4">
                    <Cloud size={48} className="text-primary mb-2 gradient-text" style={{ color: "var(--primary)" }} />
                    <h2 className="gradient-text" style={{ fontSize: '2rem' }}>Create an Account</h2>
                    <p className="subtitle" style={{ color: 'var(--text-muted)' }}>Join us and explore amazing features</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="input-box" style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-box email-otp-row">
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    style={{ paddingLeft: '40px' }}
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>


                    <div className="form-group">
                        <div className="input-box" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="form-input"
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {passwordErrors.length > 0 && (
                            <ul className="password-errors">
                                {passwordErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-group">
                        <div className="input-box" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                className="form-input"
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirmPasswordError && <p className="error-message p-0">{confirmPasswordError}</p>}
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <input
                            type="checkbox"
                            id="terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            required
                        />
                        <label htmlFor="terms" style={{ cursor: 'pointer' }}>
                            I accept the <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms and Conditions</a>
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary mt-4 signup-submit-btn" disabled={loading}>
                        {loading ? <div className="loader mx-auto"></div> : "Sign Up"}
                    </button>
                </form>

                {message && <p className={`mt-3 message ${message.includes("✅") ? "success-message" : "error-message"}`}>{message}</p>}

                <p className="text-center mt-4 text-muted">
                    Already have an account? <Link to="/login" className="login-link">Sign In</Link>
                </p>
            </div>

            {showTermsModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="glass-panel" style={{
                        background: 'var(--card-bg)',
                        padding: '2rem',
                        borderRadius: '16px',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        position: 'relative'
                    }}>
                        <button 
                            onClick={() => setShowTermsModal(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 className="gradient-text" style={{ marginBottom: '1.5rem', marginTop: 0 }}>Terms and Conditions</h2>
                        
                        <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingRight: '10px' }}>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Acceptance of Terms</strong>
                                By accessing or using this cloud storage service, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>User Responsibility</strong>
                                You are solely responsible for the content you upload, store, or share using this service.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Prohibited Content</strong>
                                You agree not to upload, store, or share:
                                <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                                    <li>Illegal, harmful, or offensive content</li>
                                    <li>Copyrighted material without proper authorization</li>
                                    <li>Malware, viruses, or malicious files</li>
                                    <li>Content that violates any applicable laws or regulations</li>
                                </ul>
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Private and Sensitive Data</strong>
                                You are strongly advised not to upload sensitive or private information, including but not limited to:
                                <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                                    <li>Personal identification documents</li>
                                    <li>Financial information</li>
                                    <li>Passwords or confidential business data</li>
                                </ul>
                                <p style={{ marginTop: '8px', marginBottom: 0 }}>We are not responsible for any misuse, exposure, or loss of such data.</p>
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Data Security</strong>
                                We take reasonable measures to protect your data. However, no system is completely secure, and we do not guarantee absolute security.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Data Loss & Availability</strong>
                                We are not responsible for any data loss, corruption, or unavailability due to system failures, maintenance, or unforeseen events. Users are encouraged to keep backups of their important files.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Account Security</strong>
                                You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Service Modifications</strong>
                                We reserve the right to modify, suspend, or discontinue the service at any time without prior notice.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Termination of Access</strong>
                                We may suspend or terminate your access if you violate these terms or engage in misuse of the platform.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Limitation of Liability</strong>
                                Under no circumstances shall we be liable for any direct, indirect, incidental, or consequential damages arising from the use of this service.
                            </div>
                            <div>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Changes to Terms</strong>
                                We may update these Terms and Conditions at any time. Continued use of the service constitutes acceptance of the updated terms.
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem' }}>Accept & Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Signup;
