import React, { useState, useEffect, useCallback } from 'react';
import './JigsawPuzzleGame.css';

const JigsawPuzzleGame = ({ puzzleImages, onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [pieces, setPieces] = useState([]);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [gridSlots, setGridSlots] = useState(Array(9).fill(null)); // Stores piece ID in each slot
  const [showFeedback, setShowFeedback] = useState(false);

  // Helper to determine piece size based on screen width
  const getPieceAndStartPosition = useCallback(() => {
    const isMobile = window.innerWidth <= 480;
    const isSmallMobile = window.innerWidth <= 360;
    const pieceSize = isSmallMobile ? 80 : isMobile ? 90 : 100;
    const startPos = isSmallMobile ? 15 : 20; // X and Y start position for the grid
    return { pieceSize, startPos };
  }, []);

  // Function to get a scrambled position for pieces not in the grid
  const getScrambledPosition = useCallback(() => {
    const { pieceSize, startPos } = getPieceAndStartPosition();
    
    // Define the area where scrambled pieces will appear
    // This area should be below the puzzle grid
    const scrambledAreaStartX = startPos; // Align with the grid's left edge
    const scrambledAreaStartY = startPos + (3 * pieceSize) + 50; // 3 rows of pieces + some padding
    
    // Define the width and height of the scrambled area
    // Let's make it roughly 3 pieces wide
    const scrambledAreaWidth = (3 * pieceSize) + 20; // 3 pieces width + some padding
    const scrambledAreaHeight = (2 * pieceSize) + 20; // Enough for 2 rows of pieces, or adjust as needed

    const randX = scrambledAreaStartX + Math.random() * (scrambledAreaWidth - pieceSize);
    const randY = scrambledAreaStartY + Math.random() * (scrambledAreaHeight - pieceSize);

    return {
      x: randX,
      y: randY,
    };
  }, [getPieceAndStartPosition]);

  // Create puzzle pieces with individual images and initial scrambled positions
  useEffect(() => {
    if (gameStarted) {
      const initialPieces = [];
      const scrambledPositionsList = [];
      
      // Generate 9 distinct scrambled positions
      while (scrambledPositionsList.length < 9) {
        const newPos = getScrambledPosition();
        // Simple check to avoid too much overlap initially (can be improved)
        let isOverlapping = false;
        for (const existingPos of scrambledPositionsList) {
          const dist = Math.sqrt(
            Math.pow(newPos.x - existingPos.x, 2) + Math.pow(newPos.y - existingPos.y, 2)
          );
          if (dist < getPieceAndStartPosition().pieceSize / 2) { // If centers are too close
            isOverlapping = true;
            break;
          }
        }
        if (!isOverlapping) {
          scrambledPositionsList.push(newPos);
        }
      }

      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const scrambledPos = scrambledPositionsList[i]; // Use pre-generated distinct position

        initialPieces.push({
          id: i,
          correctRow: row,
          correctCol: col,
          currentX: scrambledPos.x,
          currentY: scrambledPos.y,
          isInGrid: false,
          gridSlot: null,
          imageUrl: puzzleImages[i],
        });
      }
      setPieces(initialPieces);
      setGridSlots(Array(9).fill(null)); // Reset grid slots
    }
  }, [gameStarted, puzzleImages, getScrambledPosition, getPieceAndStartPosition]); // Added getPieceAndStartPosition to dependencies

  const getSlotPosition = useCallback((slotIndex) => {
    const { pieceSize, startPos } = getPieceAndStartPosition();
    const row = Math.floor(slotIndex / 3);
    const col = slotIndex % 3;
    return {
      x: startPos + col * pieceSize,
      y: startPos + row * pieceSize,
    };
  }, [getPieceAndStartPosition]);

  const findClosestSlot = useCallback((x, y) => {
    let closestSlot = -1;
    let minDistance = Infinity;
    const SNAP_DISTANCE = 120; // Increased snapping radius

    for (let i = 0; i < 9; i++) {
      const slotPos = getSlotPosition(i);
      // Calculate center of the piece for distance calculation
      const { pieceSize } = getPieceAndStartPosition();
      const pieceCenterX = x + pieceSize / 2;
      const pieceCenterY = y + pieceSize / 2;
      const slotCenterX = slotPos.x + pieceSize / 2;
      const slotCenterY = slotPos.y + pieceSize / 2;

      const distance = Math.sqrt(
        Math.pow(pieceCenterX - slotCenterX, 2) + Math.pow(pieceCenterY - slotCenterY, 2)
      );

      if (distance < minDistance && distance < SNAP_DISTANCE) {
        minDistance = distance;
        closestSlot = i;
      }
    }
    return closestSlot;
  }, [getSlotPosition, getPieceAndStartPosition]);

  const handleMouseDown = useCallback((e, piece) => {
    e.preventDefault();
    const pieceRect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - pieceRect.left,
      y: e.clientY - pieceRect.top,
    });
    setDraggedPiece(piece);
  }, []);

  const handleTouchStart = useCallback((e, piece) => {
    e.preventDefault();
    const pieceRect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - pieceRect.left,
      y: touch.clientY - pieceRect.top,
    });
    setDraggedPiece(piece);
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!draggedPiece) return;

    const containerRect = document.querySelector('.puzzle-container').getBoundingClientRect();
    const newX = clientX - containerRect.left - dragOffset.x;
    const newY = clientY - containerRect.top - dragOffset.y;

    setPieces((prev) =>
      prev.map((p) =>
        p.id === draggedPiece.id
          ? { ...p, currentX: newX, currentY: newY, isInGrid: false, gridSlot: null } // Temporarily remove from grid
          : p
      )
    );
  }, [draggedPiece, dragOffset]);

  const handleMouseMove = useCallback((e) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleDrop = useCallback(() => {
    if (!draggedPiece) return;

    setPieces((prevPieces) => {
      let updatedPieces = [...prevPieces];
      const pieceIndex = updatedPieces.findIndex((p) => p.id === draggedPiece.id);
      const piece = updatedPieces[pieceIndex];
      const closestSlot = findClosestSlot(piece.currentX, piece.currentY);

      setGridSlots((prevGridSlots) => {
        let newGridSlots = [...prevGridSlots];

        // 1. If the piece was in a grid slot previously, clear that slot
        if (piece.gridSlot !== null && newGridSlots[piece.gridSlot] === piece.id) {
          newGridSlots[piece.gridSlot] = null;
        }

        if (closestSlot !== -1) {
          const slotOccupiedBy = newGridSlots[closestSlot];

          // 2. If the target slot is occupied by another piece, move that piece to a scrambled position
          if (slotOccupiedBy !== null && slotOccupiedBy !== piece.id) {
            const occupyingPieceIndex = updatedPieces.findIndex((p) => p.id === slotOccupiedBy);
            if (occupyingPieceIndex !== -1) {
              const occupyingPiece = updatedPieces[occupyingPieceIndex];
              const scrambledPos = getScrambledPosition(); // Get a new random scrambled position

              updatedPieces[occupyingPieceIndex] = {
                ...occupyingPiece,
                currentX: scrambledPos.x,
                currentY: scrambledPos.y,
                isInGrid: false,
                gridSlot: null,
              };
            }
          }

          // 3. Snap the dragged piece to the closest slot
          const slotPos = getSlotPosition(closestSlot);
          updatedPieces[pieceIndex] = {
            ...piece,
            currentX: slotPos.x,
            currentY: slotPos.y,
            isInGrid: true,
            gridSlot: closestSlot,
          };
          newGridSlots[closestSlot] = piece.id; // Place the piece in the new slot
        } else {
          // 4. If no closest slot found, move the dragged piece back to a scrambled position
          const scrambledPos = getScrambledPosition(); // Get a new random scrambled position
          updatedPieces[pieceIndex] = {
            ...piece,
            currentX: scrambledPos.x,
            currentY: scrambledPos.y,
            isInGrid: false,
            gridSlot: null,
          };
        }

        // Check for completion after all updates are done
        const isComplete = newGridSlots.every((pieceIdInSlot, slotIndex) => {
          if (pieceIdInSlot === null) return false;
          const placedPiece = updatedPieces.find((p) => p.id === pieceIdInSlot);
          if (!placedPiece) return false;
          const correctSlot = placedPiece.correctRow * 3 + placedPiece.correctCol;
          return slotIndex === correctSlot;
        });

        if (isComplete && !showFeedback) { // Only trigger onComplete once
          setTimeout(() => {
            setShowFeedback(true);
            setTimeout(() => {
              onComplete();
            }, 2000);
          }, 500);
        }
        return newGridSlots;
      });
      return updatedPieces;
    });
    setDraggedPiece(null);
  }, [draggedPiece, findClosestSlot, getSlotPosition, getScrambledPosition, onComplete, showFeedback]);

  const handleMouseUp = useCallback(() => {
    handleDrop();
  }, [handleDrop]);

  const handleTouchEnd = useCallback(() => {
    handleDrop();
  }, [handleDrop]);

  useEffect(() => {
    if (draggedPiece) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draggedPiece, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setShowFeedback(false); // Reset feedback on new game
  }, []);

  const getPieceStyle = useCallback((piece) => {
    const { pieceSize } = getPieceAndStartPosition();
    return {
      backgroundImage: `url(${piece.imageUrl})`,
      backgroundSize: `${pieceSize}px ${pieceSize}px`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      left: `${piece.currentX}px`,
      top: `${piece.currentY}px`,
      width: `${pieceSize}px`,
      height: `${pieceSize}px`,
      zIndex: draggedPiece && draggedPiece.id === piece.id ? 1000 : piece.isInGrid ? 10 : 1,
      cursor: 'grab',
      transition: draggedPiece && draggedPiece.id === piece.id ? 'none' : 'all 0.3s ease',
    };
  }, [draggedPiece, getPieceAndStartPosition]);

  const getCompletedCount = useCallback(() => {
    return gridSlots.filter((pieceId, slotIndex) => {
      if (pieceId === null) return false;
      const piece = pieces.find(p => p.id === pieceId);
      if (!piece) return false;
      const correctSlot = piece.correctRow * 3 + piece.correctCol;
      return slotIndex === correctSlot;
    }).length;
  }, [gridSlots, pieces]);

  if (!gameStarted) {
    return (
      <div className="jigsaw-intro">
        <div className="intro-content">
          <h2>Третя гра: Пазл</h2>
          <p>Збери пазл з найкрасивішої дівчини у світі.</p>
          <p>Перетягни частинки в правильне місце!</p>
          <button className="start-game-button" onClick={startGame}>
            Почати гру
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jigsaw-puzzle-game">
      <div className="game-header">
        <h3>Збери пазл</h3>
        <p>Перетягни частинки в сірі квадрати</p>
        <p className="hint">Можна перетягувати пазли між ячейками!</p>
        <div className="progress-text">
          Правильно розміщено: {getCompletedCount()}/9
        </div>
      </div>

      <div className="puzzle-container">
        <div className="puzzle-grid">
          {Array.from({ length: 9 }, (_, i) => {
            const { pieceSize, startPos } = getPieceAndStartPosition();
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isOccupied = gridSlots[i] !== null;
            const isCorrect =
              isOccupied &&
              (() => {
                const piece = pieces.find((p) => p.id === gridSlots[i]);
                return piece && piece.correctRow * 3 + piece.correctCol === i;
              })();

            return (
              <div
                key={i}
                className={`grid-slot ${isOccupied ? 'occupied' : ''} ${isCorrect ? 'correct' : ''}`}
                style={{
                  left: `${startPos + col * pieceSize}px`,
                  top: `${startPos + row * pieceSize}px`,
                  width: `${pieceSize}px`,
                  height: `${pieceSize}px`,
                }}
              />
            );
          })}
        </div>

        {pieces.map((piece) => (
          <div
            key={piece.id}
            className={`puzzle-piece ${piece.isInGrid ? 'in-grid' : 'in-scrambled'} ${
              draggedPiece && draggedPiece.id === piece.id ? 'dragging' : ''
            }`}
            style={getPieceStyle(piece)}
            onMouseDown={(e) => handleMouseDown(e, piece)}
            onTouchStart={(e) => handleTouchStart(e, piece)}
          />
        ))}
      </div>

      {showFeedback && (
        <div className="feedback success">
          <div className="feedback-content">
            <h4>Молодець!</h4>
            <p>Ти зібрала пазл найкрасивішої дівчини у світі!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JigsawPuzzleGame;