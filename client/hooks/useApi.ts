import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { Quote, Invoice, Reservation, Notification, Service, Analytics, User, Garage } from '@/types';

const POLLING_INTERVAL = 30000;
const FAST_POLLING_INTERVAL = 10000;

// Client API hooks
export function useQuotes() {
  return useQuery<Quote[]>({
    queryKey: ['/api/quotes'],
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useQuote(id: string) {
  return useQuery<Quote>({
    queryKey: ['/api/quotes', id],
    enabled: !!id,
  });
}

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useInvoice(id: string) {
  return useQuery<Invoice>({
    queryKey: ['/api/invoices', id],
    enabled: !!id,
  });
}

export function useReservations() {
  return useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { serviceId: string; date: string; time: string; notes?: string }) => {
      const response = await apiRequest('POST', '/api/reservations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/reservations/${id}`, { status: 'cancelled' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    },
  });
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: FAST_POLLING_INTERVAL,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/notifications/${id}/read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/notifications/read-all', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

export function useServices() {
  return useQuery<Service[]>({
    queryKey: ['/api/prestations'],
  });
}

// Quote actions
export function useApproveQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/quotes/${id}`, { status: 'approved' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/quotes/${id}`, { status: 'rejected' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
    },
  });
}

// Admin API hooks
export function useAdminAnalytics(params?: { startDate?: string; endDate?: string; paymentMethod?: string; serviceId?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
  if (params?.serviceId) queryParams.append('serviceId', params.serviceId);
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/admin/analytics?${queryString}` : '/api/admin/analytics';
  
  return useQuery<Analytics>({
    queryKey: [endpoint],
  });
}

export function useAdminQuotes() {
  return useQuery<Quote[]>({
    queryKey: ['/api/admin/quotes'],
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Quote>) => {
      const response = await apiRequest('POST', '/api/admin/quotes', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du devis');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Quote> }) => {
      const response = await apiRequest('PATCH', `/api/admin/quotes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
    },
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await apiRequest('POST', `/api/admin/quotes/${quoteId}/generate-invoice`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
    },
  });
}

export function useAdminInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ['/api/admin/invoices'],
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Invoice>) => {
      const response = await apiRequest('POST', '/api/admin/invoices', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de la facture');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Invoice> }) => {
      const response = await apiRequest('PATCH', `/api/admin/invoices/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invoices'] });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/invoices/${id}`, { 
        status: 'paid', 
        paymentMethod 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invoices'] });
    },
  });
}

export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/admin/invoices/${id}/send-email`, {});
      return response.json();
    },
  });
}

export function useAdminReservations() {
  return useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations'],
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useConfirmReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/admin/reservations/${id}`, { status: 'confirmed' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Reservation> }) => {
      const response = await apiRequest('PATCH', `/api/admin/reservations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
    },
  });
}

export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${id}`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
  });
}

export function useAdminGarages() {
  return useQuery<Garage[]>({
    queryKey: ['/api/admin/garages'],
  });
}

export function useCreateGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Garage>) => {
      const response = await apiRequest('POST', '/api/admin/garages', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/garages'] });
    },
  });
}

export function useUpdateGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Garage> }) => {
      const response = await apiRequest('PATCH', `/api/admin/garages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/garages'] });
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Service>) => {
      const response = await apiRequest('POST', '/api/admin/prestations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prestations'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const response = await apiRequest('PATCH', `/api/admin/prestations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prestations'] });
    },
  });
}

// Media Upload hooks
export function useRequestUploadUrl() {
  return useMutation({
    mutationFn: async (data: { name: string; size: number; contentType: string }) => {
      const response = await apiRequest('POST', '/api/uploads/request-url', data);
      return response.json();
    },
  });
}

export function useLinkQuoteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, fileName, filePath, fileType }: { 
      quoteId: string; 
      fileName: string; 
      filePath: string; 
      fileType: string; 
    }) => {
      const response = await apiRequest('POST', `/api/admin/quotes/${quoteId}/media`, {
        fileName,
        filePath,
        fileType,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
    },
  });
}

export function useDeleteQuoteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, mediaId }: { quoteId: string; mediaId: string }) => {
      await apiRequest('DELETE', `/api/admin/quotes/${quoteId}/media/${mediaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
    },
  });
}

export function useQuoteMedia(quoteId: string) {
  return useQuery<any[]>({
    queryKey: ['/api/quotes', quoteId, 'media'],
    queryFn: async () => {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/quotes/${quoteId}/media`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!quoteId,
  });
}

export function useLinkInvoiceMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, fileName, filePath, fileType }: { 
      invoiceId: string; 
      fileName: string; 
      filePath: string; 
      fileType: string; 
    }) => {
      const response = await apiRequest('POST', `/api/admin/invoices/${invoiceId}/media`, {
        fileName,
        filePath,
        fileType,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invoices'] });
    },
  });
}

export function useDeleteInvoiceMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, mediaId }: { invoiceId: string; mediaId: string }) => {
      await apiRequest('DELETE', `/api/admin/invoices/${invoiceId}/media/${mediaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invoices'] });
    },
  });
}

export function useInvoiceMedia(invoiceId: string) {
  return useQuery<any[]>({
    queryKey: ['/api/invoices', invoiceId, 'media'],
    queryFn: async () => {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/invoices/${invoiceId}/media`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!invoiceId,
  });
}

export function useGarageSettings() {
  return useQuery<any>({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/admin/settings`, { credentials: 'include' });
      if (!response.ok) return {};
      return response.json();
    },
  });
}

export function useUpdateGarageSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest('PUT', '/api/admin/settings', settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
  });
}
