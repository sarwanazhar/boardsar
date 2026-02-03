import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Remove automatic redirect — let logic handle it:
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (email: string, password: string) => {
    const response = await api.post("/auth/register", {
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    // Backend should return token in response body for localStorage
    const response = await api.post(
      "/auth/login",
      { email, password }
    );
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/me");
    return response.data; // Returns { id, email }
  },
};

export const boardAPI = {
  getBoards: async () => {
    try {
      const response = await api.get("/api/boards");

      // Backend already returns the correct format, no transformation needed
      return response.data.boards || [];
    } catch (error: any) {
      console.error('getBoards error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  getBoard: async (boardId: string) => {
    const response = await api.get(`/api/boards/${boardId}`);

    // Backend already returns the correct format, no transformation needed
    return response.data.board;
  },

  createBoard: async (name: string) => {
    const response = await api.post(
      "/api/boards",
      {
        boardId: name, // Use name as boardId for simplicity
        board: {
          shapes: {},
          activeTool: "select",
          viewport: { scale: 1, x: 0, y: 0 },
          selection: {
            selectedIds: [],
            isMarqueeSelecting: false,
            marqueeStart: null,
            marqueeEnd: null,
          },
          dragState: {
            isGroupDragging: false,
            startPoint: null,
            shapeSnapshots: {},
          },
          drawingState: { isDrawing: false, currentShapeId: null },
          textEditingState: { editingId: null },
          history: { past: [], future: [] },
        }
      },
    );

    // Backend already returns the correct format, no transformation needed
    return response.data.board;
  },

  updateBoard: async (boardId: string, data: any) => {
    const response = await api.put(
      `/api/boards/${boardId}`,
      {
        board: data,
        boardId: boardId
      },
    );

    // Backend already returns the correct format, no transformation needed
    return response.data.board;
  },

  deleteBoard: async (boardId: string) => {
    const response = await api.delete(
      `/api/boards/${boardId}`,
    );
    return response.data;
  },
};

export default api;
