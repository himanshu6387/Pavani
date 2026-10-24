import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(
        formData.email,
        formData.password
      );

      navigate("/dashboard");

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-left">

        <div className="brand">
          <div className="brand-icon">L</div>
          <span>LifeVault AI</span>
        </div>

        <div className="auth-content">

          <span className="eyebrow">
            YOUR DIGITAL LIFE, SECURED
          </span>

          <h1>
            Everything important.
            <br />
            <span>One secure vault.</span>
          </h1>

          <p>
            Securely manage your documents, important
            information and life essentials with AI.
          </p>

          <div className="security-points">
            <div>
              <span>✓</span>
              Secure document storage
            </div>

            <div>
              <span>✓</span>
              AI-powered organization
            </div>

            <div>
              <span>✓</span>
              Private & protected
            </div>
          </div>

        </div>

      </div>


      <div className="auth-right">

        <div className="auth-card">

          <div className="mobile-brand">
            <div className="brand-icon">L</div>
            <span>LifeVault AI</span>
          </div>

          <h2>Welcome back</h2>

          <p className="auth-subtitle">
            Sign in to access your LifeVault.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>


            <div className="form-group">

              <div className="label-row">
                <label>Password</label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className="password-input">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>


          <div className="auth-divider">
            <span>New to LifeVault?</span>
          </div>


          <Link
            to="/register"
            className="secondary-btn"
          >
            Create an account
          </Link>

          <p className="privacy-note">
            Your data belongs to you. We keep your
            personal information private and secure.
          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;