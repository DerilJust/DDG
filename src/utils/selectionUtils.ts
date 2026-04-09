export const normalizeSelection = (rect, gridWidth, gridHeight) => {
  const x1 = Math.max(0, Math.min(gridWidth - 1, rect.x1));
  const y1 = Math.max(0, Math.min(gridHeight - 1, rect.y1));
  const x2 = Math.max(0, Math.min(gridWidth - 1, rect.x2));
  const y2 = Math.max(0, Math.min(gridHeight - 1, rect.y2));

  return {
    type: 'area',
    x1,
    y1,
    x2,
    y2
  };
};

export const clampPointToGrid = (x, y, gridWidth, gridHeight) => {
  return {
    x: Math.max(0, Math.min(gridWidth - 1, x)),
    y: Math.max(0, Math.min(gridHeight - 1, y))
  };
};

export const getPendingCells = (pendingSelection, gridWidth, gridHeight) => {
  if (!pendingSelection) return [];

  if (pendingSelection.type === 'cell') {
    const x = Math.max(0, Math.min(gridWidth - 1, pendingSelection.x));
    const y = Math.max(0, Math.min(gridHeight - 1, pendingSelection.y));
    return [{ x, y }];
  }

  const x1 = Math.max(0, Math.min(gridWidth - 1, Math.min(pendingSelection.x1, pendingSelection.x2)));
  const y1 = Math.max(0, Math.min(gridHeight - 1, Math.min(pendingSelection.y1, pendingSelection.y2)));
  const x2 = Math.max(0, Math.min(gridWidth - 1, Math.max(pendingSelection.x1, pendingSelection.x2)));
  const y2 = Math.max(0, Math.min(gridHeight - 1, Math.max(pendingSelection.y1, pendingSelection.y2)));

  const cells = [];
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      cells.push({ x, y });
    }
  }

  return cells;
};
