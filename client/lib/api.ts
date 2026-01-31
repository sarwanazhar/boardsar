import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send cookies automatically
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
    // Backend sets cookie
    const response = await api.post(
      "/auth/login",
      { email, password },
      { withCredentials: true }
    );
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/me", { withCredentials: true });
    return response.data; // Returns { id, email }
  },
};

export const boardAPI = {
  getBoards: async () => {
    try {
      const response = await api.get("/api/boards", { withCredentials: true });
      
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
    const response = await api.get(`/api/boards/${boardId}`, { withCredentials: true });
    
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
      { withCredentials: true }
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
      { withCredentials: true }
    );
    
    // Backend already returns the correct format, no transformation needed
    return response.data.board;
  },

  deleteBoard: async (boardId: string) => {
    const response = await api.delete(
      `/api/boards/${boardId}`,
      { withCredentials: true }
    );
    return response.data;
  },
};

export default api;
