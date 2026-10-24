import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      name,
      email,
      password,
      confirmPassword
    } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register(
        name,
        email,
        password
      );

      navigate("/dashboard");

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
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
            BUILD YOUR DIGITAL VAULT
          </span>

          <h1>
            Your life.
            <br />
            <span>Organized intelligently.</span>
          </h1>

          <p>
            Bring your important documents and life
            information together in one intelligent,
            secure place.
          </p>

          <div className="feature-list">

            <div className="feature-item">
              <div className="feature-number">
                01
              </div>

              <div>
                <strong>Secure</strong>
                <p>
                  Keep important information protected.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-number">
                02
              </div>

              <div>
                <strong>Intelligent</strong>
                <p>
                  Let AI organize and understand your data.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-number">
                03
              </div>

              <div>
                <strong>Personal</strong>
                <p>
                  One private space for your digital life.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>


      <div className="auth-right">

        <div className="auth-card register-card">

          <div className="mobile-brand">
            <div className="brand-icon">L</div>
            <span>LifeVault AI</span>
          </div>

          <h2>Create your vault</h2>

          <p className="auth-subtitle">
            Start organizing your digital life.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Full name</label>

              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>


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
              <label>Password</label>

              <div className="password-input">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>
            </div>


            <div className="form-group">
              <label>Confirm password</label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>


            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating vault..."
                : "Create my vault"}
            </button>

          </form>


          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>


          <Link
            to="/login"
            className="secondary-btn"
          >
            Sign in
          </Link>

          <p className="privacy-note">
            By creating an account, your information
            will be stored securely in your private vault.
          </p>

        </div>

      </div>

    </div>
  );
};

export default Register;