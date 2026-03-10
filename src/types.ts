export type BlockType = 'text' | 'horizontal_math' | 'vertical_math' | 'number_line' | 'shapes' | 'comparison' | 'pattern' | 'text_to_number' | 'previous_next' | 'ordering_grid';

export interface BaseBlock {
  id: string;
  type: BlockType;
  marginTop?: number;
  marginBottom?: number;
  scale?: number;
  questionFontSize?: number;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface Equation {
  id: string;
  num1: string;
  num2: string;
  operator: '+' | '-' | '×' | '÷';
  result?: string;
  missingField?: 'num1' | 'num2' | 'result';
}

export interface HorizontalMathBlock extends BaseBlock {
  type: 'horizontal_math';
  question: string;
  equations: Equation[];
  columns?: number;
}

export interface VerticalMathBlock extends BaseBlock {
  type: 'vertical_math';
  question: string;
  equations: Equation[];
}

export interface NumberLineBlock extends BaseBlock {
  type: 'number_line';
  question: string;
  start: number;
  end: number;
  step: number;
  equation?: Equation;
}

export interface ShapesBlock extends BaseBlock {
  type: 'shapes';
  question: string;
  groups: { id: string, shapeType: string, count: number }[];
}

export interface ComparisonBlock extends BaseBlock {
  type: 'comparison';
  question: string;
  pairs: { id: string, left: string, right: string }[];
  columns?: number;
}

export interface PatternBlock extends BaseBlock {
  type: 'pattern';
  question: string;
  sequence: string[];
}

export interface TextToNumberBlock extends BaseBlock {
  type: 'text_to_number';
  question: string;
  items: { id: string, text: string }[];
  columns?: number;
}

export interface PreviousNextBlock extends BaseBlock {
  type: 'previous_next';
  question: string;
  boxType: 'previous' | 'next';
  cells: { id: string, number: string }[];
  columns?: number;
}

export interface OrderingGridBlock extends BaseBlock {
  type: 'ordering_grid';
  question: string;
  grids: {
    id: string;
    label: string;
    numbers: string;
  }[];
}

export type Block = TextBlock | HorizontalMathBlock | VerticalMathBlock | NumberLineBlock | ShapesBlock | ComparisonBlock | PatternBlock | TextToNumberBlock | PreviousNextBlock | OrderingGridBlock;

export interface HeaderText {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
}

export interface DocumentHeader {
  schoolName: string;
  studentNameLabel: string;
  testTitle: string;
  gradeLabel: string;
  scoreLabel: string;
  useImageHeader?: boolean;
  imageScale?: number;
  headerTexts?: HeaderText[];
}
