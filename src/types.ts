export interface UnusedFile {
  type: 'unused_file';
  path: string;
  content: string;
}

export interface UnusedComponent {
  type: 'unused_component';
  filePath: string;
  componentName: string;
  code: string;
  startLine: number;
  endLine: number;
}

export interface UnusedUtility {
  type: 'unused_utility';
  filePath: string;
  functionName: string;
  code: string;
  startLine: number;
  endLine: number;
}

export type AnalysisResult = (UnusedFile | UnusedComponent | UnusedUtility)[];