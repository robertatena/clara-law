export type ContractType =
  | "rental"              // aluguel
  | "stable_union"        // união estável
  | "loan"                // empréstimo/financiamento
  | "service"             // prestação de serviço
  | "health_plan"         // plano de saúde
  | "employment"          // trabalho
  | "sale"                // compra e venda
  | "unknown";

export type Severity = "ok" | "attention" | "high";

export type Finding = {
  title: string;
  whyItMatters: string;
  whatToDo: string;
  legalHint?: string;
  severity: Severity;
  points: 0 | 5 | 10;
  evidence?: string[]; // trechos curtos
};

export type Classification = {
  type: ContractType;
  confidence: number; // 0..1
  signals: string[];
};

export type AnalysisResult = {
  classification: Classification;
  findings: Finding[];
  summary: string;
  nextQuestions: string[];
};