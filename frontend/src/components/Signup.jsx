import { useState } from "react";
import axios from "axios";
import "./Signup.css"; // Import external CSS
import { Link, useNavigate } from "react-router-dom";
import { Cloud, Lock, Mail, User } from 'lucide-react'; // Added icons for better UI

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
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [otpMessage, setOtpMessage] = useState("");
    const [disableOtpButton, setDisableOtpButton] = useState(false);

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

    // Send OTP function with debounce to prevent spam clicking
    const sendOTP = async () => {
        if (!formData.email.includes("@")) {
            setOtpMessage("❌ Enter a valid email.");
            return;
        }

        setDisableOtpButton(true); // Disable button to prevent multiple clicks
        setOtpMessage("⏳ Sending OTP...");

        try {
            const response = await axios.post("http://localhost:5000/api/auth/send-otp", { email: formData.email });

            if (response.data.message) {
                setIsOtpSent(true);
                setOtpMessage("✅ OTP sent successfully! Please check your email. Check your spam/junk folder too.");
            } else {
                setOtpMessage("❌ Failed to send OTP. Try again.");
            }
        } catch (error) {
            setOtpMessage(error.response?.data?.error ? `❌ ${error.response.data.error}` : "❌ Server error. Please try again.");
        } finally {
            setTimeout(() => setDisableOtpButton(false), 3000); // Enable button after 3 seconds
        }
    };

    // Verify OTP function
    const verifyOTP = async () => {
        if (!otp.trim()) {
            setOtpMessage("❌ Enter the OTP.");
            return;
        }

        setOtpMessage("⏳ Verifying OTP...");

        try {
            const response = await axios.post("http://localhost:5000/api/auth/verify-otp", { email: formData.email, otp });

            if (response.data.message === "OTP Verified Successfully!") {
                setIsEmailVerified(true);
                setOtpMessage("✅ Email verified successfully!");
            } else {
                setOtpMessage("❌ Invalid OTP. Try again.");
            }
        } catch (error) {
            setOtpMessage(error.response?.data?.error ? `❌ ${error.response.data.error}` : "❌ Verification failed. Try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (!isEmailVerified) {
            setMessage("❌ Verify your email before signing up.");
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
            const response = await fetch("http://localhost:5000/api/auth/register", {
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
                setIsEmailVerified(false);
                setIsOtpSent(false);
                setOtp("");

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
                                    disabled={isEmailVerified}
                                />
                            </div>
                            {!isOtpSent && (
                                <button type="button" onClick={sendOTP} className="btn otp-btn" disabled={disableOtpButton || isEmailVerified}>
                                    {disableOtpButton ? "..." : "Send OTP"}
                                </button>
                            )}
                        </div>
                    </div>

                    {isOtpSent && !isEmailVerified && (
                        <div className="form-group input-box email-otp-row">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                            <button type="button" onClick={verifyOTP} className="btn otp-btn verify-btn">Verify</button>
                        </div>
                    )}
                    {otpMessage && <p className={`message ${otpMessage.includes("✅") ? "success-message" : "error-message"}`}>{otpMessage}</p>}

                    <div className="form-group">
                        <div className="input-box" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
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
                                type="password"
                                name="confirmPassword"
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {confirmPasswordError && <p className="error-message p-0">{confirmPasswordError}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary mt-4 signup-submit-btn" disabled={loading || !isEmailVerified}>
                        {loading ? <div className="loader mx-auto"></div> : "Sign Up"}
                    </button>
                </form>

                {message && <p className={`mt-3 message ${message.includes("✅") ? "success-message" : "error-message"}`}>{message}</p>}

                <p className="text-center mt-4 text-muted">
                    Already have an account? <Link to="/login" className="login-link">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
