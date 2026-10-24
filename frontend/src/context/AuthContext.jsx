import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api, {
  authAPI,
} from "../services/api";

/*
|--------------------------------------------------------------------------
| AUTH CONTEXT
|--------------------------------------------------------------------------
*/

const AuthContext = createContext(null);

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD CURRENT USER
  |--------------------------------------------------------------------------
  */

  const loadUser = async () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("accessToken");

    /*
    No token means no authenticated session.
    */

    if (!token) {
      setUser(null);
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();

      /*
      Backend can return:
      { user: {...} }

      or:
      { data: { user: {...} } }

      or:
      { ...user }
      */

      const currentUser =
        response?.user ||
        response?.data?.user ||
        response?.data ||
        response;

      if (currentUser) {
        setUser(currentUser);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error(
        "Authentication check failed:",
        error
      );

      /*
      api.js will clear invalid authentication
      when backend returns 401.
      */

      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({
        email,
        password,
      });

      console.log(
        "Login response:",
        response
      );

      /*
      Support multiple common backend response formats.
      */

      const token =
        response?.token ||
        response?.accessToken ||
        response?.data?.token ||
        response?.data?.accessToken;

      const loggedInUser =
        response?.user ||
        response?.data?.user ||
        response?.data?.userData;

      /*
      IMPORTANT:
      Save token BEFORE making /auth/me or /documents
      requests.
      */

      if (!token) {
        throw new Error(
          "Login successful but server did not return an authentication token."
        );
      }

      /*
      Clear old authentication first.
      */

      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("accessToken");

      /*
      Store the JWT in one consistent location.
      */

      localStorage.setItem(
        "token",
        token
      );

      /*
      Store user if backend returned it.
      */

      if (loggedInUser) {
        localStorage.setItem(
          "user",
          JSON.stringify(loggedInUser)
        );

        setUser(loggedInUser);
      }

      /*
      Mark authenticated.
      */

      setAuthenticated(true);

      /*
      If backend did not return user,
      fetch it using the newly stored token.
      */

      if (!loggedInUser) {
        try {
          const meResponse =
            await authAPI.getMe();

          const currentUser =
            meResponse?.user ||
            meResponse?.data?.user ||
            meResponse?.data ||
            meResponse;

          if (currentUser) {
            setUser(currentUser);

            localStorage.setItem(
              "user",
              JSON.stringify(currentUser)
            );
          }
        } catch (meError) {
          console.error(
            "Failed to load logged-in user:",
            meError
          );
        }
      }

      return {
        success: true,
        user:
          loggedInUser ||
          user,
        token,
      };
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      setUser(null);
      setAuthenticated(false);

      throw error;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REGISTER
  |--------------------------------------------------------------------------
  */

  const register = async (
    name,
    email,
    password
  ) => {
    try {
      const response =
        await authAPI.register({
          name,
          email,
          password,
        });

      console.log(
        "Registration response:",
        response
      );

      /*
      Some backends automatically log the user in
      after registration.
      */

      const token =
        response?.token ||
        response?.accessToken ||
        response?.data?.token ||
        response?.data?.accessToken;

      const registeredUser =
        response?.user ||
        response?.data?.user;

      if (token) {
        localStorage.setItem(
          "token",
          token
        );

        if (registeredUser) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              registeredUser
            )
          );

          setUser(registeredUser);
        }

        setAuthenticated(true);
      }

      return response;
    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      throw error;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn(
        "Backend logout failed:",
        error
      );
    }

    /*
    Always remove frontend authentication.
    */

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    setUser(null);
    setAuthenticated(false);

    /*
    Go to login.
    */

    window.location.href = "/login";
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL AUTH CHECK
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadUser();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const value = {
    user,

    loading,

    authenticated,

    isAuthenticated: authenticated,

    login,

    register,

    logout,

    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/*
|--------------------------------------------------------------------------
| useAuth
|--------------------------------------------------------------------------
*/

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext; 