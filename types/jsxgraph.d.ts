declare module 'jsxgraph' {
    export interface JXGOptions {
      boundingbox?: number[];
      axis?: boolean;
      showCopyright?: boolean;
      showNavigation?: boolean;
      // Add other options as needed
    }
  
    export class Board {
      constructor(box: string, options: JXGOptions);
      create(type: string, points: any[], options?: any): any;
      // Add other methods as needed
    }
  
    export function initBoard(box: string, options: JXGOptions): Board;
    // Add other functions as needed
  }
  