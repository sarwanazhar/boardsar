import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardAPI } from "./api";

interface Board {
  _id: string;
  name: string;
  ownerId: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
  scale: number;
  position: {
    x: number;
    y: number;
  };
  shapes: any[];
}

interface BoardState {
  boards: Board[];
  isLoading: boolean;
  error: string | null;

  fetchBoards: () => Promise<void>;
  createBoard: (name: string) => Promise<void>;
  updateBoard: (boardId: string, data: any) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  clearError: () => void;
  setBoards: (boards: Board[]) => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      boards: [],
      isLoading: false,
      error: null,

      fetchBoards: async () => {
        set({ isLoading: true, error: null });
        try {
          const boards = await boardAPI.getBoards();
          console.log('Fetched boards:', boards);
          set({ boards, isLoading: false });
        } catch (err: any) {
          console.error('fetchBoards error:', err);
          console.error('Error response data:', err.response?.data);
          console.error('Error status:', err.response?.status);
          set({
            error: err.response?.data?.error || err.message || "Failed to fetch boards",
            isLoading: false,
          });
        }
      },

      createBoard: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
          const newBoard = await boardAPI.createBoard(name);
          set((state) => ({
            boards: [...state.boards, newBoard],
            isLoading: false,
          }));
        } catch (err: any) {
          set({
            error: err.response?.data?.error || "Failed to create board",
            isLoading: false,
          });
        }
      },

      updateBoard: async (boardId: string, data: any) => {
        set({ isLoading: true, error: null });
        try {
          const updatedBoard = await boardAPI.updateBoard(boardId, data);
          set((state) => ({
            boards: state.boards.map((board) =>
              board._id === boardId ? updatedBoard : board
            ),
            isLoading: false,
          }));
        } catch (err: any) {
          set({
            error: err.response?.data?.error || "Failed to update board",
            isLoading: false,
          });
        }
      },

      deleteBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        try {
          await boardAPI.deleteBoard(boardId);
          // Remove the deleted board from the store
          set((state) => ({
            boards: state.boards.filter(board => board._id !== boardId),
            isLoading: false
          }));
        } catch (err: any) {
          set({ 
            error: err.response?.data?.error || "Failed to delete board",
            isLoading: false 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setBoards: (boards: Board[]) => {
        set({ boards });
      },
    }),
    {
      name: "board-storage",
      partialize: (state) => ({
        boards: state.boards,
      }),
    }
  )
);