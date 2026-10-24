import axios from "axios";

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL = "http://localhost:5000/api";


/*
|--------------------------------------------------------------------------
| AXIOS INSTANCE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Do NOT set Content-Type globally here.
|
| Why?
|
| Normal JSON requests can automatically receive:
|
|     application/json
|
| But file uploads use FormData and the browser must automatically
| generate:
|
|     multipart/form-data; boundary=----------------...
|
| If we force Content-Type globally, multipart uploads can break.
|
|--------------------------------------------------------------------------
*/

const api = axios.create({

  baseURL: API_BASE_URL,

  timeout: 120000,

  headers: {
    Accept: "application/json",
  },

});


/*
|--------------------------------------------------------------------------
| TOKEN HELPER
|--------------------------------------------------------------------------
*/

const getStoredToken = () => {

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken");

  return token || null;

};


/*
|--------------------------------------------------------------------------
| USER HELPER
|--------------------------------------------------------------------------
*/

const getStoredUser = () => {

  const rawUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {

    return JSON.parse(rawUser);

  } catch (error) {

    console.warn(
      "Unable to parse stored user."
    );

    return null;

  }

};


/*
|--------------------------------------------------------------------------
| CLEAR AUTH
|--------------------------------------------------------------------------
*/

const clearStoredAuth = () => {

  localStorage.removeItem("token");

  localStorage.removeItem("accessToken");

  localStorage.removeItem("user");


  sessionStorage.removeItem("token");

  sessionStorage.removeItem("accessToken");

  sessionStorage.removeItem("user");

};


/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
|
| Automatically attaches JWT to every API request.
|
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(

  (config) => {

    const token =
      getStoredToken();


    /*
    |--------------------------------------------------------------------------
    | AUTHORIZATION
    |--------------------------------------------------------------------------
    */

    if (token) {

      config.headers =
        config.headers || {};


      config.headers.Authorization =
        `Bearer ${token}`;

    }


    /*
    |--------------------------------------------------------------------------
    | FORM DATA REQUEST
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | If the request body is FormData, DO NOT manually set
    | Content-Type.
    |
    | Browser/Axios will generate the correct boundary.
    |
    |--------------------------------------------------------------------------
    */

    if (
      config.data instanceof FormData
    ) {

      /*
      Delete any previously inherited JSON/multipart Content-Type.
      */

      if (config.headers) {

        delete config.headers["Content-Type"];

        delete config.headers["content-type"];

      }

    }


    /*
    |--------------------------------------------------------------------------
    | NORMAL JSON REQUEST
    |--------------------------------------------------------------------------
    */

    else {

      config.headers =
        config.headers || {};


      /*
      Only set JSON when there is actually a body that needs JSON.
      */

      if (
        config.data !== undefined &&
        config.data !== null
      ) {

        config.headers["Content-Type"] =
          "application/json";

      }

    }


    /*
    |--------------------------------------------------------------------------
    | DEBUG LOG
    |--------------------------------------------------------------------------
    */

    console.log(
      `API Request: ${(
        config.method || "GET"
      ).toUpperCase()} ${config.url}`,
      token
        ? "🔐 Token attached"
        : "🔓 No token"
    );


    /*
    |--------------------------------------------------------------------------
    | UPLOAD DEBUG
    |--------------------------------------------------------------------------
    */

    if (
      config.data instanceof FormData
    ) {

      console.log(
        "📦 FormData request detected."
      );


      /*
      Print FormData keys.
      */

      for (
        const [key, value]
        of config.data.entries()
      ) {

        if (
          value instanceof File
        ) {

          console.log(
            `📎 FormData file [${key}]:`,
            {
              name:
                value.name,

              type:
                value.type,

              size:
                value.size,

            }
          );

        } else {

          console.log(
            `📝 FormData field [${key}]:`,
            value
          );

        }

      }

    }


    return config;

  },


  (error) => {

    return Promise.reject(
      error
    );

  }

);


/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(

  (response) => {

    return response;

  },


  (error) => {

    const status =
      error.response?.status;


    /*
    |--------------------------------------------------------------------------
    | 401
    |--------------------------------------------------------------------------
    */

    if (
      status === 401
    ) {

      console.warn(
        "Authentication failed. Token may be missing or expired."
      );


      clearStoredAuth();


      const currentPath =
        window.location.pathname;


      if (
        currentPath !== "/login" &&
        currentPath !== "/register"
      ) {

        window.location.href =
          "/login";

      }

    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD ERROR DEBUG
    |--------------------------------------------------------------------------
    */

    if (
      error.config?.data instanceof FormData
    ) {

      console.error(
        "❌ FormData request failed."
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

    }


    return Promise.reject(
      error
    );

  }

);


/*
|--------------------------------------------------------------------------
| AUTH API
|--------------------------------------------------------------------------
*/

export const authAPI = {

  login: async (
    credentials
  ) => {

    const response =
      await api.post(
        "/auth/login",
        credentials
      );

    return response.data;

  },


  register: async (
    userData
  ) => {

    const response =
      await api.post(
        "/auth/register",
        userData
      );

    return response.data;

  },


  getMe: async () => {

    const response =
      await api.get(
        "/auth/me"
      );

    return response.data;

  },


  logout: async () => {

    try {

      const response =
        await api.post(
          "/auth/logout"
        );

      clearStoredAuth();

      return response.data;

    } catch (error) {

      clearStoredAuth();

      return null;

    }

  },

};


/*
|--------------------------------------------------------------------------
| DOCUMENT API
|--------------------------------------------------------------------------
*/

export const documentAPI = {

  getAll: async () => {

    const response =
      await api.get(
        "/documents"
      );

    return response.data;

  },


  getById: async (
    id
  ) => {

    const response =
      await api.get(
        `/documents/${id}`
      );

    return response.data;

  },


  upload: async (
    formData,
    config = {}
  ) => {

    /*
    |--------------------------------------------------------------------------
    | VALIDATE FORMDATA
    |--------------------------------------------------------------------------
    */

    if (
      !(formData instanceof FormData)
    ) {

      throw new Error(
        "Document upload requires FormData."
      );

    }


    /*
    |--------------------------------------------------------------------------
    | DEBUG FORMDATA
    |--------------------------------------------------------------------------
    */

    console.log(
      "🚀 Starting document upload..."
    );


    for (
      const [key, value]
      of formData.entries()
    ) {

      if (
        value instanceof File
      ) {

        console.log(
          "📎 Upload file:",
          {
            field:
              key,

            name:
              value.name,

            type:
              value.type,

            size:
              value.size,

          }
        );

      } else {

        console.log(
          "📝 Upload field:",
          key,
          value
        );

      }

    }


    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | DO NOT manually set:
    |
    | Content-Type: multipart/form-data
    |
    | Browser must create the boundary automatically.
    |
    |--------------------------------------------------------------------------
    */

    const uploadConfig = {

      ...config,

      headers: {

        ...(config.headers || {}),

        /*
        Explicitly remove Content-Type.
        */

      },

    };


    delete uploadConfig.headers[
      "Content-Type"
    ];

    delete uploadConfig.headers[
      "content-type"
    ];


    /*
    |--------------------------------------------------------------------------
    | POST
    |--------------------------------------------------------------------------
    */

    const response =
      await api.post(
        "/documents/upload",
        formData,
        uploadConfig
      );


    return response.data;

  },


  delete: async (
    id
  ) => {

    const response =
      await api.delete(
        `/documents/${id}`
      );

    return response.data;

  },

};


/*
|--------------------------------------------------------------------------
| SEARCH API
|--------------------------------------------------------------------------
*/

export const searchAPI = {

  search: async (
    query,
    category = "all"
  ) => {

    const response =
      await api.get(
        "/search",
        {
          params: {
            q:
              query,

            category:
              category,

          },

        }
      );

    return response.data;

  },

};


/*
|--------------------------------------------------------------------------
| REMINDER API
|--------------------------------------------------------------------------
*/

export const reminderAPI = {

  getAll: async () => {

    const response =
      await api.get(
        "/reminders"
      );

    return response.data;

  },


  generate: async () => {

    const response =
      await api.post(
        "/reminders/generate"
      );

    return response.data;

  },


  delete: async (
    id
  ) => {

    const response =
      await api.delete(
        `/reminders/${id}`
      );

    return response.data;

  },

};


/*
|--------------------------------------------------------------------------
| AI API
|--------------------------------------------------------------------------
*/

export const aiAPI = {

  analyze: async (
    data
  ) => {

    const response =
      await api.post(
        "/ai/analyze",
        data
      );

    return response.data;

  },


  ask: async (
    question
  ) => {

    const response =
      await api.post(
        "/ask",
        {
          question,
        }
      );

    return response.data;

  },

};


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default api;