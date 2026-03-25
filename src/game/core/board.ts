/**
 * Board类 - 五子棋棋盘数据结构
 * Week 2 - WO 2.1
 */

export type BoardCell = 'black' | 'white' | null;
export type BoardData = BoardCell[][];

export const BOARD_SIZE = 15;

export class Board {
  private cells: BoardData;
  private size: number;

  constructor(size: number = BOARD_SIZE) {
    this.size = size;
    this.cells = this.createEmptyBoard();
  }

  private createEmptyBoard(): BoardData {
    return Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(null));
  }

  getCell(x: number, y: number): BoardCell {
    this.validatePosition(x, y);
    return this.cells[y][x];
  }

  setCell(x: number, y: number, value: BoardCell): void {
    this.validatePosition(x, y);
    this.cells[y][x] = value;
  }

  isEmpty(x: number, y: number): boolean {
    return this.getCell(x, y) === null;
  }

  isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  private validatePosition(x: number, y: number): void {
    if (!this.isValid(x, y)) {
      throw new Error(`Invalid position: (${x}, ${y})`);
    }
  }

  getOccupiedPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.cells[y][x] !== null) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  clear(): void {
    this.cells = this.createEmptyBoard();
  }

  getSize(): number {
    return this.size;
  }

  clone(): Board {
    const newBoard = new Board(this.size);
    (newBoard as any).cells = this.cells.map((row) => [...row]);
    return newBoard;
  }
}
