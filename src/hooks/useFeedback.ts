import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FeedbackReportPayload, FeedbackReportResponse } from '../types/feedback';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Ensure the base URL ends with /api (removes trailing slash if any, then adds /api if not present)
const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FeedbackReportPayload) => {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al enviar reporte');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'my-reports'] });
    },
  });
};

export const useMyFeedbackReports = () => {
  return useQuery<FeedbackReportResponse[]>({
    queryKey: ['feedback', 'my-reports'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/feedback/my-reports`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al cargar historial de reportes');
      }

      return response.json();
    },
  });
};
