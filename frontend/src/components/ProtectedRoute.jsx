import { Navigate } from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";


const ProtectedRoute = ({
  children
}) => {

  const {
    user,
    loading
  } = useAuth();


  // ======================================
  // LOADING
  // ======================================

  if (loading) {

    return (
      <div className="auth-loading">

        <div className="loading-spinner"></div>

        <p>
          Checking your secure vault...
        </p>

      </div>
    );

  }


  // ======================================
  // NOT LOGGED IN
  // ======================================

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // ======================================
  // LOGGED IN
  // ======================================

  return children;
};


export default ProtectedRoute;