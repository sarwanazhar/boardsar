'use client'

import React, { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore, useInitAuth } from "@/lib/store"
import { useWhiteboardStore } from "@/lib/whiteboardStore"
import { LogoutButton } from "@/components/LogoutButton"
import { Stage, Layer, Rect, Circle, Line, Text, Transformer } from "react-konva"
import Konva from "konva"
import { boardAPI } from "@/lib/api"

/* =======================
   TYPES
======================= */

type Tool = "select" | "pen" | "line" | "rect" | "circle" | "text" | "eraser";

// Base shape properties
interface ShapeBase {
  id: string;
  type: "pen" | "line" | "rect" | "circle" | "text";
}

// Pen shape: freehand drawing with multiple points
interface PenShape extends ShapeBase {
  type: "pen";
  points: number[]; // [x1, y1, x2, y2, ...]
  stroke: string;
}

// Line shape: straight line with start and end points
interface LineShape extends ShapeBase {
  type: "line";
  points: number[]; // [x1, y1, x2, y2]
  stroke: string;
}

// Rectangle shape
interface RectShape extends ShapeBase {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

// Circle shape
interface CircleShape extends ShapeBase {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

// Text shape
interface TextShape extends ShapeBase {
  type: "text";
  x: number;
  y: number;
  text: string;
  fill: string;
  fontSize: number;
}

type Shape = PenShape | LineShape | RectShape | CircleShape | TextShape;

// Viewport state for zoom and pan
interface Viewport {
  scale: number;
  x: number;
  y: number;
}

// Selection state
interface Selection {
  selectedIds: string[];
  isMarqueeSelecting: boolean;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;
}

// Drag state for group dragging
interface DragState {
  isGroupDragging: boolean;
  startPoint: { x: number; y: number } | null;
  // Stores initial positions/points for each dragged shape
  shapeSnapshots: Record<string, { x?: number; y?: number; points?: number[] }>;
}

// Drawing state
interface DrawingState {
  isDrawing: boolean;
  currentShapeId: string | null;
}

// Text editing state
interface TextEditingState {
  editingId: string | null;
}

// History for undo/redo
interface History {
  past: Record<string, Shape>[];
  future: Record<string, Shape>[];
}

// **MAIN BOARD STATE - SINGLE SOURCE OF TRUTH**
interface Board {
  shapes: Record<string, Shape>; // Dictionary of shapes by ID
  activeTool: Tool;
  viewport: Viewport;
  selection: Selection;
  dragState: DragState;
  drawingState: DrawingState;
  textEditingState: TextEditingState;
  history: History;
}

/* =======================
   INITIAL BOARD STATE
======================= */

const initialBoard: Board = {
  shapes: {},
  activeTool: "select",
  viewport: {
    scale: 1,
    x: 0,
    y: 0,
  },
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
  drawingState: {
    isDrawing: false,
    currentShapeId: null,
  },
  textEditingState: {
    editingId: null,
  },
  history: {
    past: [],
    future: [],
  },
};

/* =======================
   HELPER FUNCTIONS
======================= */

// Generate unique ID
function generateId(): string {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get bounding box for a shape
function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  if (shape.type === "pen" || shape.type === "line") {
    const points = shape.points;
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (let i = 0; i < points.length; i += 2) {
      minX = Math.min(minX, points[i]);
      maxX = Math.max(maxX, points[i]);
      minY = Math.min(minY, points[i + 1]);
      maxY = Math.max(maxY, points[i + 1]);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else if (shape.type === "rect") {
    return {
      x: Math.min(shape.x, shape.x + shape.width),
      y: Math.min(shape.y, shape.y + shape.height),
      width: Math.abs(shape.width),
      height: Math.abs(shape.height),
    };
  } else if (shape.type === "circle") {
    return {
      x: shape.x - shape.radius,
      y: shape.y - shape.radius,
      width: shape.radius * 2,
      height: shape.radius * 2,
    };
  } else if (shape.type === "text") {
    const estimatedWidth = shape.text.length * shape.fontSize * 0.6;
    const estimatedHeight = shape.fontSize * 1.2;
    return {
      x: shape.x,
      y: shape.y,
      width: estimatedWidth,
      height: estimatedHeight,
    };
  }
  
  return { x: 0, y: 0, width: 0, height: 0 };
}

// Get combined bounding box for multiple shapes
function getMultiSelectionBounds(
  shapes: Record<string, Shape>,
  selectedIds: string[]
): { x: number; y: number; width: number; height: number } | null {
  if (selectedIds.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  selectedIds.forEach(id => {
    const shape = shapes[id];
    if (!shape) return;
    
    const bounds = getShapeBounds(shape);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  
  if (!isFinite(minX)) return null;
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Check if point is inside bounds
function isPointInBounds(
  point: { x: number; y: number },
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// Check if shapes intersect with marquee selection
function doesShapeIntersectMarquee(
  shape: Shape,
  marquee: { x: number; y: number; width: number; height: number }
): boolean {
  const bounds = getShapeBounds(shape);
  
  return !(
    bounds.x + bounds.width < marquee.x ||
    bounds.x > marquee.x + marquee.width ||
    bounds.y + bounds.height < marquee.y ||
    bounds.y > marquee.y + marquee.height
  );
}

/* =======================
   BOARD UPDATE FUNCTIONS
======================= */

// Save current shapes to history (for undo/redo)
function saveToHistory(board: Board): Board {
  return {
    ...board,
    history: {
      past: [...board.history.past, board.shapes],
      future: [], // Clear future when new action is taken
    },
  };
}

// Undo
function undo(board: Board): Board {
  if (board.history.past.length === 0) return board;
  
  const previous = board.history.past[board.history.past.length - 1];
  const newPast = board.history.past.slice(0, -1);
  
  return {
    ...board,
    shapes: previous,
    selection: { ...board.selection, selectedIds: [] },
    history: {
      past: newPast,
      future: [board.shapes, ...board.history.future],
    },
  };
}

// Redo
function redo(board: Board): Board {
  if (board.history.future.length === 0) return board;
  
  const next = board.history.future[0];
  const newFuture = board.history.future.slice(1);
  
  return {
    ...board,
    shapes: next,
    selection: { ...board.selection, selectedIds: [] },
    history: {
      past: [...board.history.past, board.shapes],
      future: newFuture,
    },
  };
}

// Delete selected shapes
function deleteSelectedShapes(board: Board): Board {
  if (board.selection.selectedIds.length === 0) return board;
  
  const newShapes = { ...board.shapes };
  board.selection.selectedIds.forEach(id => {
    delete newShapes[id];
  });
  
  return saveToHistory({
    ...board,
    shapes: newShapes,
    selection: { ...board.selection, selectedIds: [] },
  });
}

// Clear all shapes
function clearBoard(board: Board): Board {
  return saveToHistory({
    ...board,
    shapes: {},
    selection: { ...board.selection, selectedIds: [] },
  });
}

export default function WhiteboardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  
  const { user } = useAuthStore();
  const { initAuth } = useInitAuth();
  const {
    boardState,
    isLoading,
    error,
    isSaving,
    setBoardId,
    setBoardState,
    loadBoard,
    saveBoard,
    clearError,
    updateBoardState,
    resetBoard,
  } = useWhiteboardStore();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [hasLoadedBoard, setHasLoadedBoard] = useState(false);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  
  // Ref to ensure auth check only happens once
  const authCheckedRef = useRef(false);
  
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);
  
  // Refs for middle mouse panning and touch gestures
  const isMiddlePanning = useRef(false);
  const pointers = useRef<Map<number, PointerEvent>>(new Map());
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef(0);

  /* =======================
     AUTHENTICATION CHECK
  ======================= */

  useEffect(() => {
    if (authCheckedRef.current) return; // skip if already checked
    authCheckedRef.current = true;

    ;(async () => {
      try {
        await initAuth(); // calls /me once
      } catch (err) {
        // ignore — user will be null
      }
      setCheckingAuth(false);
    })();
  }, [initAuth]);

  useEffect(() => {
    if (checkingAuth) return;
    
    if (!user) {
      router.replace("/login");
      return;
    }

    // If there's a 404 error, redirect to boards page
    if (error === "Board not found") {
      router.replace("/board");
      return;
    }

    // Only load board if we haven't loaded it yet, it's not already loading, 
    // we have a valid board ID, and there's no error
    if (!hasLoadedBoard && !isLoading && !isBoardLoading && !error && boardId && boardId !== 'undefined' && boardId !== 'null') {
      console.log('🔍 Frontend requesting board ID:', boardId);
      console.log('🔍 User ID:', user.id);
      
      // Set board ID and load board data
      setBoardId(boardId);
      setIsBoardLoading(true);
      loadBoard(boardId);
      setHasLoadedBoard(true);
    }
  }, [checkingAuth, user, router, boardId, setBoardId, loadBoard, hasLoadedBoard, isLoading, isBoardLoading, error]);

  // Debug effect to monitor board state changes
  useEffect(() => {
    console.log('📊 Board state updated:', boardState);
  }, [boardState]);

  // Cleanup effect to reset board state when component unmounts
  useEffect(() => {
    return () => {
      // Reset board state when leaving the page
      resetBoard();
      setHasLoadedBoard(false);
      setIsBoardLoading(false);
    };
  }, [resetBoard]);

  // Ensure board state is properly initialized when component mounts
  useEffect(() => {
    if (boardState.shapes && Object.keys(boardState.shapes).length === 0) {
      console.log('🔄 Board state is empty, ensuring proper initialization');
    }
  }, [boardState]);

  // Reset board loading state when loadBoard completes
  useEffect(() => {
    if (!isLoading && isBoardLoading) {
      setIsBoardLoading(false);
    }
  }, [isLoading, isBoardLoading]);

  /* =======================
     RESPONSIVE STAGE SIZE
  ======================= */

  useEffect(() => {
    // Initialize stage size after component mounts
    setStageSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  /* =======================
     TRANSFORMER SETUP
  ======================= */

  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;

    // Show transformer only for single selection (not for text)
    if (boardState.selection.selectedIds.length === 1 && boardState.activeTool === "select") {
      const selectedId = boardState.selection.selectedIds[0];
      const shape = boardState.shapes[selectedId];
      
      if (shape && shape.type !== "text") {
        const node = stage.findOne(`#${selectedId}`);
        if (node) {
          tr.nodes([node]);
          tr.getLayer()?.batchDraw();
        } else {
          tr.nodes([]);
        }
      } else {
        tr.nodes([]);
      }
    } else {
      tr.nodes([]);
    }
  }, [boardState.selection.selectedIds, boardState.shapes, boardState.activeTool]);

  /* =======================
     KEYBOARD SHORTCUTS
  ======================= */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts while editing text
      if (boardState.textEditingState.editingId) {
        if (e.key === 'Escape') {
          updateBoardState(prev => ({
            ...saveToHistory(prev),
            textEditingState: { editingId: null },
          }));
        }
        return;
      }

      // Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        updateBoardState(undo);
      }
      
      // Redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        updateBoardState(redo);
      }
      
      // Delete
      if ((e.key === 'Backspace' || e.key === 'Delete') && boardState.selection.selectedIds.length > 0) {
        e.preventDefault();
        updateBoardState(deleteSelectedShapes);
      }
      
      // Tool shortcuts
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        updateBoardState(prev => ({ ...prev, activeTool: 'text' }));
      }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        updateBoardState(prev => ({ ...prev, activeTool: 'eraser' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardState.selection.selectedIds, boardState.textEditingState.editingId, updateBoardState]);

  /* =======================
     ZOOM & PAN
  ======================= */

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = boardState.viewport.scale;
    const mousePointTo = {
      x: (pointer.x - boardState.viewport.x) / oldScale,
      y: (pointer.y - boardState.viewport.y) / oldScale,
    };

    const scaleBy = 1.05;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const limitedScale = Math.max(0.1, Math.min(5, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    };

    updateBoardState(prev => ({
      ...prev,
      viewport: {
        scale: limitedScale,
        x: newPos.x,
        y: newPos.y,
      },
    }));
  };

  /* =======================
     ERASER LOGIC
  ======================= */

  const checkEraserCollision = (worldX: number, worldY: number, eraserRadius: number = 20) => {
    const shapesToRemove: string[] = [];

    Object.values(boardState.shapes).forEach((shape) => {
      let hit = false;

      if (shape.type === "pen" || shape.type === "line") {
        for (let i = 0; i < shape.points.length; i += 2) {
          const px = shape.points[i];
          const py = shape.points[i + 1];
          const dist = Math.sqrt((px - worldX) ** 2 + (py - worldY) ** 2);
          if (dist < eraserRadius) {
            hit = true;
            break;
          }
        }
      } else if (shape.type === "rect") {
        const left = Math.min(shape.x, shape.x + shape.width);
        const right = Math.max(shape.x, shape.x + shape.width);
        const top = Math.min(shape.y, shape.y + shape.height);
        const bottom = Math.max(shape.y, shape.y + shape.height);
        
        if (worldX >= left - eraserRadius && worldX <= right + eraserRadius &&
            worldY >= top - eraserRadius && worldY <= bottom + eraserRadius) {
          hit = true;
        }
      } else if (shape.type === "circle") {
        const dist = Math.sqrt((shape.x - worldX) ** 2 + (shape.y - worldY) ** 2);
        if (dist < shape.radius + eraserRadius) {
          hit = true;
        }
      } else if (shape.type === "text") {
        const bounds = getShapeBounds(shape);
        if (worldX >= bounds.x - eraserRadius && worldX <= bounds.x + bounds.width + eraserRadius &&
            worldY >= bounds.y - eraserRadius && worldY <= bounds.y + bounds.height + eraserRadius) {
          hit = true;
        }
      }

      if (hit) {
        shapesToRemove.push(shape.id);
      }
    });

    if (shapesToRemove.length > 0) {
      updateBoardState(prev => {
        const newShapes = { ...prev.shapes };
        shapesToRemove.forEach(id => delete newShapes[id]);
        return { ...prev, shapes: newShapes };
      });
    }
  };

  /* =======================
     POINTER HANDLERS
  ======================= */

  const handlePointerDown = (e: any) => {
    const stage = e.target.getStage();
    const evt = e.evt as PointerEvent;
    
    const clickedOnEmpty = e.target === stage || e.target.getType() === "Layer";

    // Track pointer
    pointers.current.set(evt.pointerId, evt);

    // --- MIDDLE MOUSE PAN ---
    if (evt.button === 1) {
      evt.preventDefault();
      isMiddlePanning.current = true;
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    // Convert to world coordinates
    const worldPointer = {
      x: (pointer.x - boardState.viewport.x) / boardState.viewport.scale,
      y: (pointer.y - boardState.viewport.y) / boardState.viewport.scale,
    };

    // --- GROUP BOUNDING BOX DRAG ---
    if (boardState.activeTool === "select" && boardState.selection.selectedIds.length > 1 && clickedOnEmpty) {
      const groupBounds = getMultiSelectionBounds(boardState.shapes, boardState.selection.selectedIds);
      
      if (groupBounds && isPointInBounds(worldPointer, groupBounds)) {
        // Capture initial positions/points of all selected shapes
        const shapeSnapshots: Record<string, { x?: number; y?: number; points?: number[] }> = {};
        
        boardState.selection.selectedIds.forEach(id => {
          const shape = boardState.shapes[id];
          if (!shape) return;
          
          if (shape.type === "pen" || shape.type === "line") {
            shapeSnapshots[id] = { points: [...shape.points] };
          } else if ('x' in shape && 'y' in shape) {
            shapeSnapshots[id] = { x: shape.x, y: shape.y };
          }
        });
        
        updateBoardState(prev => ({
          ...prev,
          dragState: {
            isGroupDragging: true,
            startPoint: worldPointer,
            shapeSnapshots,
          },
        }));
        
        stage.draggable(false);
        return;
      }
    }

    // --- PINCH ZOOM DETECTION (2 touches) ---
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      if (pts.every(p => p.pointerType === 'touch')) {
        const p1 = { x: pts[0].clientX, y: pts[0].clientY };
        const p2 = { x: pts[1].clientX, y: pts[1].clientY };
        const center = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        
        lastCenter.current = center;
        lastDist.current = dist;
        stage.draggable(false);
      }
      return;
    }

    // --- ERASER TOOL ---
    if (boardState.activeTool === "eraser") {
      updateBoardState(prev => ({
        ...prev,
        drawingState: { isDrawing: true, currentShapeId: null },
      }));
      checkEraserCollision(worldPointer.x, worldPointer.y);
      return;
    }

    // --- SELECT TOOL ---
    if (boardState.activeTool === "select") {
      // Start marquee selection on empty click
      if (clickedOnEmpty && evt.pointerType === 'mouse' && evt.button === 0) {
        updateBoardState(prev => ({
          ...prev,
          selection: {
            ...prev.selection,
            isMarqueeSelecting: true,
            marqueeStart: worldPointer,
            marqueeEnd: worldPointer,
            selectedIds: evt.shiftKey ? prev.selection.selectedIds : [],
          },
        }));
        stage.draggable(false);
        return;
      }
      
      // Enable stage panning for touch/empty mouse click
      if (clickedOnEmpty) {
        stage.draggable(true);
        if (evt.pointerType === 'mouse' && evt.button === 0 && !evt.shiftKey) {
          updateBoardState(prev => ({
            ...prev,
            selection: { ...prev.selection, selectedIds: [] },
          }));
        }
      }
      return;
    }

    // --- DRAWING TOOLS ---
    stage.draggable(false);
    
    const newId = generateId();

    if (boardState.activeTool === "pen") {
      const newShape: PenShape = {
        id: newId,
        type: "pen",
        points: [worldPointer.x, worldPointer.y],
        stroke: "#ffffff",
      };
      
      updateBoardState(prev => ({
        ...prev,
        shapes: { ...prev.shapes, [newId]: newShape },
        drawingState: { isDrawing: true, currentShapeId: newId },
      }));
    }

    if (boardState.activeTool === "line") {
      const newShape: LineShape = {
        id: newId,
        type: "line",
        points: [worldPointer.x, worldPointer.y, worldPointer.x, worldPointer.y],
        stroke: "#ffffff",
      };
      
      updateBoardState(prev => ({
        ...prev,
        shapes: { ...prev.shapes, [newId]: newShape },
        drawingState: { isDrawing: true, currentShapeId: newId },
      }));
    }

    if (boardState.activeTool === "rect") {
      const newShape: RectShape = {
        id: newId,
        type: "rect",
        x: worldPointer.x,
        y: worldPointer.y,
        width: 0,
        height: 0,
        fill: "transparent",
        stroke: "#80f20d",
      };
      
      updateBoardState(prev => ({
        ...prev,
        shapes: { ...prev.shapes, [newId]: newShape },
        drawingState: { isDrawing: true, currentShapeId: newId },
      }));
    }

    if (boardState.activeTool === "circle") {
      const newShape: CircleShape = {
        id: newId,
        type: "circle",
        x: worldPointer.x,
        y: worldPointer.y,
        radius: 1,
        stroke: "#00f3ff",
        strokeWidth: 3,
      };
      
      updateBoardState(prev => ({
        ...prev,
        shapes: { ...prev.shapes, [newId]: newShape },
        drawingState: { isDrawing: true, currentShapeId: newId },
      }));
    }

    if (boardState.activeTool === "text") {
      const newShape: TextShape = {
        id: newId,
        type: "text",
        x: worldPointer.x,
        y: worldPointer.y,
        text: "Double click to edit",
        fill: "#ffffff",
        fontSize: 24,
      };
      
      updateBoardState(prev => saveToHistory({
        ...prev,
        shapes: { ...prev.shapes, [newId]: newShape },
        activeTool: "select",
      }));
    }
  };

  const handlePointerMove = (e: any) => {
    const stage = e.target.getStage();
    
    // --- MIDDLE MOUSE PAN ---
    if (isMiddlePanning.current) {
      const dx = e.evt.movementX;
      const dy = e.evt.movementY;
      
      updateBoardState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          x: prev.viewport.x + dx,
          y: prev.viewport.y + dy,
        },
      }));
      return;
    }

    // --- GROUP DRAG MOVE ---
    // This is where we update all selected shapes' positions during group drag
    if (boardState.dragState.isGroupDragging && boardState.dragState.startPoint) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      
      const worldPointer = {
        x: (pointer.x - boardState.viewport.x) / boardState.viewport.scale,
        y: (pointer.y - boardState.viewport.y) / boardState.viewport.scale,
      };
      
      // Calculate delta from drag start
      const dx = worldPointer.x - boardState.dragState.startPoint.x;
      const dy = worldPointer.y - boardState.dragState.startPoint.y;
      
      updateBoardState(prev => {
        const newShapes = { ...prev.shapes };
        
        // Update each selected shape based on its initial snapshot
        prev.selection.selectedIds.forEach(id => {
          const shape = newShapes[id];
          const snapshot = prev.dragState.shapeSnapshots[id];
          if (!shape || !snapshot) return;
          
          // For pen/line shapes: update all points
          if ((shape.type === "pen" || shape.type === "line") && snapshot.points) {
            const updatedPoints = snapshot.points.map((coord, index) => 
              index % 2 === 0 ? coord + dx : coord + dy
            );
            newShapes[id] = { ...shape, points: updatedPoints };
          }
          // For shapes with x,y: update position
          else if ('x' in shape && 'y' in shape && snapshot.x !== undefined && snapshot.y !== undefined) {
            newShapes[id] = { 
              ...shape, 
              x: snapshot.x + dx, 
              y: snapshot.y + dy 
            };
          }
        });
        
        return { ...prev, shapes: newShapes };
      });
      return;
    }

    // --- PINCH ZOOM ---
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const p1 = { x: pts[0].clientX, y: pts[0].clientY };
      const p2 = { x: pts[1].clientX, y: pts[1].clientY };

      const newCenter = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
      const newDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

      if (lastCenter.current && lastDist.current) {
        const dx = newCenter.x - lastCenter.current.x;
        const dy = newCenter.y - lastCenter.current.y;
        
        const scaleChange = newDist / lastDist.current;
        const oldScale = boardState.viewport.scale;
        const newScale = Math.max(0.1, Math.min(5, oldScale * scaleChange));

        const pointer = stage.getPointerPosition();
        let newViewport = { ...boardState.viewport };
        
        if (pointer) {
          const mousePointTo = {
            x: (pointer.x - boardState.viewport.x) / oldScale,
            y: (pointer.y - boardState.viewport.y) / oldScale,
          };

          newViewport = {
            scale: newScale,
            x: pointer.x - mousePointTo.x * newScale + dx,
            y: pointer.y - mousePointTo.y * newScale + dy,
          };
        } else {
          newViewport = {
            scale: newScale,
            x: boardState.viewport.x + dx,
            y: boardState.viewport.y + dy,
          };
        }

        updateBoardState(prev => ({ ...prev, viewport: newViewport }));
      }

      lastCenter.current = newCenter;
      lastDist.current = newDist;
      return;
    }

    // --- MARQUEE SELECTION ---
    if (boardState.selection.isMarqueeSelecting && boardState.selection.marqueeStart) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const worldPointer = {
        x: (pointer.x - boardState.viewport.x) / boardState.viewport.scale,
        y: (pointer.y - boardState.viewport.y) / boardState.viewport.scale,
      };

      updateBoardState(prev => ({
        ...prev,
        selection: {
          ...prev.selection,
          marqueeEnd: worldPointer,
        },
      }));
      return;
    }

    // --- DRAWING TOOLS ---
    if (!boardState.drawingState.isDrawing || !boardState.drawingState.currentShapeId) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const worldPointer = {
      x: (pointer.x - boardState.viewport.x) / boardState.viewport.scale,
      y: (pointer.y - boardState.viewport.y) / boardState.viewport.scale,
    };

    // --- ERASER MOVE ---
    if (boardState.activeTool === "eraser") {
      checkEraserCollision(worldPointer.x, worldPointer.y);
      return;
    }

    updateBoardState(prev => {
      const currentShape = prev.shapes[prev.drawingState.currentShapeId!];
      if (!currentShape) return prev;

      const newShapes = { ...prev.shapes };

      if (currentShape.type === "pen") {
        newShapes[currentShape.id] = {
          ...currentShape,
          points: [...currentShape.points, worldPointer.x, worldPointer.y],
        };
      }

      if (currentShape.type === "line") {
        newShapes[currentShape.id] = {
          ...currentShape,
          points: [currentShape.points[0], currentShape.points[1], worldPointer.x, worldPointer.y],
        };
      }

      if (currentShape.type === "rect") {
        newShapes[currentShape.id] = {
          ...currentShape,
          width: worldPointer.x - currentShape.x,
          height: worldPointer.y - currentShape.y,
        };
      }

      if (currentShape.type === "circle") {
        const radius = Math.sqrt(
          Math.pow(worldPointer.x - currentShape.x, 2) + 
          Math.pow(worldPointer.y - currentShape.y, 2)
        );
        newShapes[currentShape.id] = {
          ...currentShape,
          radius,
        };
      }

      return { ...prev, shapes: newShapes };
    });
  };

  const handlePointerUp = (e: any) => {
    const stage = e.target.getStage();
    const evt = e.evt as PointerEvent;

    // --- MIDDLE MOUSE PAN END ---
    if (evt.button === 1) {
      isMiddlePanning.current = false;
      return;
    }

    // --- GROUP DRAG END ---
    if (boardState.dragState.isGroupDragging) {
      updateBoardState(prev => saveToHistory({
        ...prev,
        dragState: {
          isGroupDragging: false,
          startPoint: null,
          shapeSnapshots: {},
        },
      }));
      stage.draggable(true);
    }

    // --- MARQUEE SELECTION END ---
    if (boardState.selection.isMarqueeSelecting && boardState.selection.marqueeStart && boardState.selection.marqueeEnd) {
      const start = boardState.selection.marqueeStart;
      const end = boardState.selection.marqueeEnd;
      
      const marquee = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      };
      
      const intersectingIds: string[] = [];
      
      Object.values(boardState.shapes).forEach(shape => {
        if (doesShapeIntersectMarquee(shape, marquee)) {
          intersectingIds.push(shape.id);
        }
      });
      
      updateBoardState(prev => ({
        ...prev,
        selection: {
          ...prev.selection,
          isMarqueeSelecting: false,
          marqueeStart: null,
          marqueeEnd: null,
          selectedIds: evt.shiftKey 
            ? [...new Set([...prev.selection.selectedIds, ...intersectingIds])]
            : intersectingIds,
        },
      }));
      
      stage.draggable(true);
    }

    // Remove pointer from tracking
    pointers.current.delete(evt.pointerId);

    // --- DRAWING END ---
    if (boardState.drawingState.isDrawing) {
      if (boardState.activeTool === "eraser") {
        updateBoardState(prev => saveToHistory({
          ...prev,
          drawingState: { isDrawing: false, currentShapeId: null },
        }));
      } else if (boardState.activeTool === "line" || boardState.activeTool === "rect" || boardState.activeTool === "circle") {
        updateBoardState(prev => saveToHistory({
          ...prev,
          drawingState: { isDrawing: false, currentShapeId: null },
          activeTool: "select",
        }));
      } else {
        updateBoardState(prev => saveToHistory({
          ...prev,
          drawingState: { isDrawing: false, currentShapeId: null },
        }));
      }
    }

    lastCenter.current = null;
    lastDist.current = 0;

    if (boardState.activeTool !== "select") {
      stage.draggable(false);
    }
  };

  const handleDragEnd = (e: any) => {
    const stage = e.target.getStage();
    if (stage) {
      updateBoardState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          x: stage.x(),
          y: stage.y(),
        },
      }));
    }
  };

  const handleShapeClick = (id: string, evt: any) => {
    if (boardState.activeTool !== "select") return;
    
    updateBoardState(prev => {
      const isShiftKey = evt.evt?.shiftKey || false;
      
      if (isShiftKey) {
        const newSelectedIds = prev.selection.selectedIds.includes(id)
          ? prev.selection.selectedIds.filter(selectedId => selectedId !== id)
          : [...prev.selection.selectedIds, id];
        
        return {
          ...prev,
          selection: { ...prev.selection, selectedIds: newSelectedIds },
        };
      } else {
        return {
          ...prev,
          selection: { ...prev.selection, selectedIds: [id] },
        };
      }
    });
  };

  const handleTextDblClick = (id: string) => {
    updateBoardState(prev => ({
      ...prev,
      textEditingState: { editingId: id },
      selection: { ...prev.selection, selectedIds: [] },
    }));
  };

  const handleTextChange = (id: string, newText: string) => {
    updateBoardState(prev => {
      const shape = prev.shapes[id];
      if (!shape || shape.type !== "text") return prev;
      
      return {
        ...prev,
        shapes: {
          ...prev.shapes,
          [id]: { ...shape, text: newText },
        },
      };
    });
  };

  const handleTextBlur = () => {
    if (boardState.textEditingState.editingId) {
      updateBoardState(prev => saveToHistory({
        ...prev,
        textEditingState: { editingId: null },
      }));
    }
  };

  const handleShapeDragEnd = (id: string, e: any) => {
    const node = e.target;
    
    updateBoardState(prev => {
      const shape = prev.shapes[id];
      if (!shape || !('x' in shape && 'y' in shape)) return prev;
      
      return saveToHistory({
        ...prev,
        shapes: {
          ...prev.shapes,
          [id]: { ...shape, x: node.x(), y: node.y() },
        },
      });
    });
  };

  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateBoardState(prev => {
      const shape = prev.shapes[id];
      if (!shape) return prev;

      let updatedShape = shape;

      if (shape.type === "rect") {
        updatedShape = {
          ...shape,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        };
      } else if (shape.type === "circle") {
        updatedShape = {
          ...shape,
          x: node.x(),
          y: node.y(),
          radius: Math.max(5, shape.radius * scaleX),
        };
      } else if (shape.type === "text") {
        updatedShape = {
          ...shape,
          x: node.x(),
          y: node.y(),
          fontSize: Math.max(8, shape.fontSize * scaleX),
        };
      }

      return saveToHistory({
        ...prev,
        shapes: {
          ...prev.shapes,
          [id]: updatedShape,
        },
      });
    });
  };

  /* =======================
     RENDER SHAPE
  ======================= */

  const renderShape = (shape: Shape) => {
    const isSelected = boardState.selection.selectedIds.includes(shape.id);
    
    const commonProps = {
      id: shape.id,
      // Only draggable in select mode for single selection
      draggable: boardState.activeTool === "select" && boardState.selection.selectedIds.length === 1 && isSelected,
      onClick: (e: any) => handleShapeClick(shape.id, e),
      onTap: (e: any) => handleShapeClick(shape.id, e),
      onDragEnd: (e: any) => handleShapeDragEnd(shape.id, e),
      onTransformEnd: (e: any) => handleTransformEnd(shape.id, e),
    };

    switch (shape.type) {
      case "pen":
        return (
          <Line
            key={shape.id}
            {...commonProps}
            points={shape.points}
            stroke={shape.stroke}
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
          />
        );

      case "line":
        return (
          <Line
            key={shape.id}
            {...commonProps}
            points={shape.points}
            stroke={shape.stroke}
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
        );

      case "rect":
        return (
          <Rect
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={3}
            cornerRadius={8}
          />
        );

      case "circle":
        return (
          <Circle
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            fill="transparent"
          />
        );

      case "text":
        if (boardState.textEditingState.editingId === shape.id) {
          return null;
        }
        return (
          <Text
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            text={shape.text}
            fill={shape.fill}
            fontSize={shape.fontSize}
            fontFamily="Spline Sans, sans-serif"
            onDblClick={() => handleTextDblClick(shape.id)}
            onDblTap={() => handleTextDblClick(shape.id)}
          />
        );
    }
  };

  /* =======================
     UI ACTIONS
  ======================= */

  const handleClear = () => {
    updateBoardState(clearBoard);
  };

  const handleReset = () => {
    updateBoardState(prev => ({
      ...prev,
      viewport: { scale: 1, x: 0, y: 0 },
    }));
  };

  const handleDeleteBoard = async () => {
    if (!boardId) return;
    
    if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
      try {
        await boardAPI.deleteBoard(boardId);
        router.push("/board");
      } catch (error) {
        alert("Failed to delete board");
      }
    }
  };

  // Calculate group bounding box and marquee for rendering
  const groupBoundingBox = boardState.selection.selectedIds.length > 1 
    ? getMultiSelectionBounds(boardState.shapes, boardState.selection.selectedIds) 
    : null;

  const marqueeRect = boardState.selection.marqueeStart && boardState.selection.marqueeEnd
    ? {
        x: Math.min(boardState.selection.marqueeStart.x, boardState.selection.marqueeEnd.x),
        y: Math.min(boardState.selection.marqueeStart.y, boardState.selection.marqueeEnd.y),
        width: Math.abs(boardState.selection.marqueeEnd.x - boardState.selection.marqueeStart.x),
        height: Math.abs(boardState.selection.marqueeEnd.y - boardState.selection.marqueeStart.y),
      }
    : null;

  /* =======================
     RENDER
  ======================= */

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={styles.app}>
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loadingText}>Loading board...</div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div style={styles.errorOverlay}>
          <div style={styles.errorContent}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{error}</span>
            <button style={styles.errorRetry} onClick={() => loadBoard(boardId)}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* GRID */}
      <div 
        style={{
          ...styles.grid,
          backgroundSize: `${30 * boardState.viewport.scale}px ${30 * boardState.viewport.scale}px`,
          backgroundPosition: `${boardState.viewport.x}px ${boardState.viewport.y}px`,
        }} 
      />

      {/* TOP NAV */}
      <div style={styles.topNav}>
        <div style={styles.navLeft}>
          <button 
            style={styles.backButton}
            onClick={() => router.push("/board")}
            title="Back to Boards"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19L5 12l7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={styles.projectTitle}>Board: {boardId}</div>
            <div style={styles.projectSubtitle}>
              {isSaving ? "Saving..." : "Auto-saved"}
            </div>
          </div>
        </div>
        <div style={styles.navRight}>
          <button style={styles.deleteButton} onClick={handleDeleteBoard} title="Delete Board">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <LogoutButton className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-full border border-red-500/30" />
        </div>
      </div>

      {/* CANVAS */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={boardState.viewport.scale}
        scaleY={boardState.viewport.scale}
        x={boardState.viewport.x}
        y={boardState.viewport.y}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        draggable={boardState.activeTool === "select" && !boardState.dragState.isGroupDragging}
        onDragEnd={handleDragEnd}
        style={{ 
          cursor: isMiddlePanning.current 
            ? 'grabbing' 
            : boardState.dragState.isGroupDragging
              ? 'grabbing'
              : boardState.activeTool === 'eraser' 
                ? 'crosshair' 
                : 'default' 
        }}
      >
        <Layer ref={layerRef}>
          {Object.values(boardState.shapes).map(renderShape)}
          
          <Transformer 
            ref={trRef}
            anchorSize={20}
            borderStrokeWidth={3}
            anchorStroke="#80f20d"
            anchorFill="#80f20d"
            borderStroke="#80f20d"
          />
          
          {marqueeRect && (
            <Rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="rgba(128, 242, 13, 0.1)"
              stroke="#80f20d"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
          )}
          
          {groupBoundingBox && (
            <Rect
              x={groupBoundingBox.x}
              y={groupBoundingBox.y}
              width={groupBoundingBox.width}
              height={groupBoundingBox.height}
              fill="transparent"
              stroke="#80f20d"
              strokeWidth={2}
              dash={[8, 4]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* TEXT EDITING INPUT */}
      {boardState.textEditingState.editingId && (() => {
        const textShape = boardState.shapes[boardState.textEditingState.editingId];
        if (!textShape || textShape.type !== "text") return null;

        const x = textShape.x * boardState.viewport.scale + boardState.viewport.x;
        const y = textShape.y * boardState.viewport.scale + boardState.viewport.y;

        return (
          <textarea
            autoFocus
            style={{
              position: 'absolute',
              top: y,
              left: x,
              fontSize: textShape.fontSize * boardState.viewport.scale,
              fontFamily: 'Spline Sans, sans-serif',
              color: textShape.fill,
              background: 'transparent',
              border: '2px dashed rgba(255, 255, 255, 0.3)',
              outline: 'none',
              resize: 'none',
              padding: 4,
              minWidth: 200,
              minHeight: 40,
              zIndex: 1000,
            }}
            value={textShape.text}
            onChange={(e) => handleTextChange(boardState.textEditingState.editingId!, e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleTextBlur();
              }
            }}
          />
        );
      })()}

      {/* SIDE PANEL */}
      <div style={styles.sidePanel}>
        <button 
          style={styles.sidePanelButton} 
          onClick={handleReset}
          title="Reset View (Center)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          style={styles.sidePanelButton} 
          onClick={handleClear}
          title="Clear Board"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          style={{
            ...styles.sidePanelButton,
            ...(boardState.history.past.length === 0 ? { opacity: 0.3, cursor: 'not-allowed' } : {})
          }}
          onClick={() => updateBoardState(undo)}
          disabled={boardState.history.past.length === 0}
          title="Undo (Ctrl+Z)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          style={{
            ...styles.sidePanelButton,
            ...(boardState.history.future.length === 0 ? { opacity: 0.3, cursor: 'not-allowed' } : {})
          }}
          onClick={() => updateBoardState(redo)}
          disabled={boardState.history.future.length === 0}
          title="Redo (Ctrl+Y)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 019 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* BOTTOM TOOLBAR */}
      <div style={styles.toolbar}>
        <button 
          onClick={() => updateBoardState(prev => ({ ...prev, activeTool: "select" }))}
          style={{
            ...styles.toolButton,
            ...(boardState.activeTool === "select" ? styles.toolButtonActive : {}),
          }}
          title="Select Tool"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button 
          onClick={() => updateBoardState(prev => ({ ...prev, activeTool: "pen" }))}
          style={{
            ...styles.toolButton,
            ...(boardState.activeTool === "pen" ? styles.toolButtonActive : {}),
          }}
          title="Freehand Pen"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 21l4-4m0 0L18 6l3-3-3-3-3 3L4 14l3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button 
          onClick={() => updateBoardState(prev => ({ ...prev, activeTool: "line" }))}
          style={{
            ...styles.toolButton,
            ...(boardState.activeTool === "line" ? styles.toolButtonActive : {}),
          }}
          title="Straight Line"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 20L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <button 
          onClick={() => updateBoardState(prev => ({ ...prev, activeTool: "rect" }))}
          style={{
            ...styles.toolButton,
            ...(boardState.activeTool === "rect" ? styles.toolButtonActive : {}),
          }}
          title="Rectangle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        <button 
          onClick={() => updateBoardState(prev => ({ ...prev, activeTool: "circle" }))}
          style={{
            ...styles.toolButton,
            ...(boardState.activeTool === "circle" ? styles.toolButtonActive : {}),
          }}
          title="Circle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        <button 
          onClick={() => updateBoardState(prev => ({ ...prev, activeTool: "text" }))}
          style={{
            ...styles.toolButton,
            ...(boardState.activeTool === "text" ? styles.toolButtonActive : {}),
          }}
          title="Text (T)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button 
          onClick={() => updateBoardState(prev => ({ ...prev, activeTool: "eraser" }))}
          style={{
            ...styles.toolButton,
            ...(boardState.activeTool === "eraser" ? styles.toolButtonActive : {}),
          }}
          title="Eraser (E)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 21h10M5 10l7.5-7.5a2.121 2.121 0 013 0l3 3a2.121 2.121 0 010 3L11 16l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 10l6 6m-3.5-3.5L2 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ZOOM INDICATOR */}
      <div style={styles.zoomIndicator}>
        ZOOM {Math.round(boardState.viewport.scale * 100)}%
      </div>
    </div>
  );
}

/* =======================
   STYLES
======================= */

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: "100vw",
    height: "100vh",
    background: "#121212",
    color: "white",
    overflow: "hidden",
    position: "relative",
    fontFamily: "'Spline Sans', sans-serif",
    touchAction: "none",
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(18, 18, 18, 0.8)",
    backdropFilter: "blur(4px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  loadingSpinner: {
    width: 40,
    height: 40,
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid #80f20d",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 16,
  },

  loadingText: {
    fontSize: 16,
    color: "white",
    fontWeight: 500,
  },

  errorOverlay: {
    position: "absolute",
    top: 80,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: "12px 16px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  errorContent: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  errorIcon: {
    fontSize: 20,
  },

  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: 500,
  },

  errorRetry: {
    background: "#80f20d",
    color: "#121212",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
  },

  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(circle, #333 1px, transparent 1px)",
    backgroundSize: "30px 30px",
    opacity: 0.3,
    pointerEvents: "none",
  },

  topNav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    zIndex: 100,
  },

  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  backButton: {
    background: "transparent",
    border: "none",
    color: "white",
    opacity: 0.7,
    cursor: "pointer",
    padding: 8,
    borderRadius: 8,
  },

  projectTitle: {
    fontSize: 14,
    fontWeight: 700,
  },

  projectSubtitle: {
    fontSize: 11,
    opacity: 0.6,
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  deleteButton: {
    background: "transparent",
    border: "none",
    color: "white",
    opacity: 0.7,
    cursor: "pointer",
    padding: 8,
    borderRadius: 8,
  },

  sidePanel: {
    position: "fixed",
    top: 80,
    right: 12,
    width: 48,
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    border: "2.5px solid rgba(255,255,255,0.1)",
    borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 8,
    zIndex: 100,
  },

  sidePanelButton: {
    background: "transparent",
    border: "none",
    color: "white",
    opacity: 0.7,
    cursor: "pointer",
  },

  toolbar: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: 550,
    height: 64,
    background: "rgba(30,30,30,0.9)",
    backdropFilter: "blur(16px)",
    border: "4px solid rgba(255,255,255,0.1)",
    borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 12px",
    zIndex: 100,
  },

  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "transparent",
    border: "none",
    color: "white",
    opacity: 0.5,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  toolButtonActive: {
    background: "rgba(128,242,13,0.25)",
    color: "#80f20d",
    opacity: 1,
  },

  zoomIndicator: {
    position: "fixed",
    bottom: 16,
    left: 16,
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 10,
    fontWeight: 700,
    opacity: 0.6,
    zIndex: 100,
  },
};