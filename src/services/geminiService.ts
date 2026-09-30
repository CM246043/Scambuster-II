export interface ScamIndicator {
  label: string;
  status: 'PASS' | 'FAIL';
}

export interface ScamAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  scamType: string;
  verdict: string;
  indicators: ScamIndicator[];
  explanation: string;
  recommendations: string[];
  supervisorThought: string;
  reputationFindings?: string;
}

export async function analyzeScam(content: string): Promise<ScamAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis request failed with status ${response.status}`);
  }

  return response.json();
}
