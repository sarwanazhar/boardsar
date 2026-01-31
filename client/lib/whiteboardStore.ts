import { create } from "zustand";
import { persist } from "zustand/middleware";
import { boardAPI } from "./api";

interface ShapeBase {
  id: string;
  type: "pen" | "line" | "rect" | "circle" | "text";
}

interface PenShape extends ShapeBase {
  type: "pen";
  points: number[];
  stroke: string;
}

interface LineShape extends ShapeBase {
  type: "line";
  points: number[];
  stroke: string;
}

interface RectShape extends ShapeBase {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

interface CircleShape extends ShapeBase {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

interface TextShape extends ShapeBase {
  type: "text";
  x: number;
  y: number;
  text: string;
  fill: string;
  fontSize: number;
}

type Shape = PenShape | LineShape | RectShape | CircleShape | TextShape;

interface Viewport {
  scale: number;
  x: number;
  y: number;
}

interface Selection {
  selectedIds: string[];
  isMarqueeSelecting: boolean;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;
}

interface DragState {
  isGroupDragging: boolean;
  startPoint: { x: number; y: number } | null;
  shapeSnapshots: Record<string, { x?: number; y?: number; points?: number[] }>;
}

interface DrawingState {
  isDrawing: boolean;
  currentShapeId: string | null;
}

interface TextEditingState {
  editingId: string | null;
}

interface History {
  past: Record<string, Shape>[];
  future: Record<string, Shape>[];
}

interface BoardState {
  shapes: Record<string, Shape>;
  activeTool: "select" | "pen" | "line" | "rect" | "circle" | "text" | "eraser";
  viewport: Viewport;
  selection: Selection;
  dragState: DragState;
  drawingState: DrawingState;
  textEditingState: TextEditingState;
  history: History;
}

interface WhiteboardState {
  boardId: string | null;
  boardState: BoardState;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  saveTimeoutId: NodeJS.Timeout | null;

  // Actions
  setBoardId: (boardId: string) => void;
  setBoardState: (state: BoardState) => void;
  loadBoard: (boardId: string) => Promise<void>;
  saveBoard: () => Promise<void>;
  debouncedSaveBoard: () => void;
  clearError: () => void;
  resetBoard: () => void;
  updateBoardState: (updater: (state: BoardState) => BoardState) => void;
}

export const useWhiteboardStore = create<WhiteboardState>()(
  persist(
    (set, get) => ({
      boardId: null,
      boardState: {
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
      },
      isLoading: false,
      error: null,
      isSaving: false,
      saveTimeoutId: null,

      setBoardId: (boardId) => set({ boardId }),
      
      setBoardState: (boardState) => set({ boardState }),

      loadBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        try {
          const boardData = await boardAPI.getBoard(boardId);
          
          // The API returns the board state directly, not wrapped in a .board property
          // boardData should be the actual board state object
          const boardStateData = boardData || {
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
          };

          set({
            boardId,
            boardState: boardStateData,
            isLoading: false,
          });
        } catch (error: any) {
          // Check if it's a 404 error (board not found)
          if (error.response?.status === 404) {
            set({
              error: "Board not found",
              isLoading: false,
              // Clear the board ID to prevent infinite retries
              boardId: null,
            });
          } else {
            set({
              error: error.response?.data?.error || "Failed to load board",
              isLoading: false,
            });
          }
        }
      },

      saveBoard: async () => {
        const { boardId, boardState } = get();
        if (!boardId) return;

        set({ isSaving: true, error: null });
        try {
          await boardAPI.updateBoard(boardId, boardState);
          set({ isSaving: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || "Failed to save board",
            isSaving: false,
          });
        }
      },

      debouncedSaveBoard: () => {
        const { saveTimeoutId } = get();
        
        // Clear existing timeout
        if (saveTimeoutId) {
          clearTimeout(saveTimeoutId);
        }

        // Set new timeout for 2 seconds
        const newTimeoutId = setTimeout(() => {
          get().saveBoard();
          set({ saveTimeoutId: null });
        }, 2000);

        set({ saveTimeoutId: newTimeoutId });
      },

      clearError: () => set({ error: null }),

      resetBoard: () => {
        set({
          boardState: {
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
          },
        });
      },

      updateBoardState: (updater) => {
        const { boardState, debouncedSaveBoard } = get();
        const newBoardState = updater(boardState);
        set({ boardState: newBoardState });
        
        // Use debounced save instead of immediate save
        debouncedSaveBoard();
      },
    }),
    {
      name: "whiteboard-storage",
      partialize: (state) => ({
        boardId: state.boardId,
        boardState: state.boardState,
      }),
    }
  )
);
