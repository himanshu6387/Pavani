import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";


// ============================================================
// PAGES
// ============================================================

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";

import Documents from "./pages/Documents";
import UploadDocument from "./pages/UploadDocument";
import DocumentDetails from "./pages/DocumentDetails";

import Expiry from "./pages/Expiry";

import CompareDocuments from "./pages/CompareDocuments";

import Timeline from "./pages/Timeline";

import FormFilling from "./pages/FormFilling";


// ============================================================
// COMPONENTS
// ============================================================

import ProtectedRoute from "./components/ProtectedRoute";


// ============================================================
// APP
// ============================================================

const App = () => {

  return (

    <BrowserRouter>

      <Routes>


        {/* ==================================================
            ROOT
        ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* ==================================================
            REGISTER
        ================================================== */}

        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        <Route
          path="/dashboard"
          element={

            <ProtectedRoute>

              <Dashboard />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DOCUMENTS
        ================================================== */}

        <Route
          path="/documents"
          element={

            <ProtectedRoute>

              <Documents />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            UPLOAD DOCUMENT
        ================================================== */}

        <Route
          path="/documents/upload"
          element={

            <ProtectedRoute>

              <UploadDocument />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DOCUMENT DETAILS
        ================================================== */}

        <Route
          path="/documents/:id"
          element={

            <ProtectedRoute>

              <DocumentDetails />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            EXPIRY
        ================================================== */}

        <Route
          path="/expiry"
          element={

            <ProtectedRoute>

              <Expiry />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DOCUMENT COMPARISON
        ================================================== */}

        <Route
          path="/compare"
          element={

            <ProtectedRoute>

              <CompareDocuments />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DOCUMENT INTELLIGENCE TIMELINE
        ================================================== */}

        <Route
          path="/timeline"
          element={

            <ProtectedRoute>

              <Timeline />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            AI FORM / FILLING ASSISTANT
        ================================================== */}

        <Route
          path="/form-filling"
          element={

            <ProtectedRoute>

              <FormFilling />

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            FALLBACK
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


      </Routes>

    </BrowserRouter>

  );

};


// ============================================================
// EXPORT
// ============================================================

export default App;