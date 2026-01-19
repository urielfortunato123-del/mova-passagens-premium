import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPermission {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  isGranted: boolean;
}

export function useNotifications() {
  const { toast } = useToast();
  const [permissionState, setPermissionState] = useState<NotificationPermission>({
    isSupported: false,
    permission: 'default',
    isGranted: false,
  });

  useEffect(() => {
    const isSupported = 'Notification' in window;

    if (isSupported) {
      setPermissionState({
        isSupported: true,
        permission: Notification.permission as NotificationPermission['permission'],
        isGranted: Notification.permission === 'granted',
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!permissionState.isSupported) {
      toast({
        variant: 'destructive',
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações.',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const isGranted = permission === 'granted';

      setPermissionState((prev) => ({
        ...prev,
        permission: permission as NotificationPermission['permission'],
        isGranted,
      }));

      if (isGranted) {
        toast({
          title: 'Notificações ativadas!',
          description: 'Você receberá alertas sobre suas corridas.',
        });
      }

      return isGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [permissionState.isSupported, toast]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!permissionState.isGranted) {
        console.warn('Notification permission not granted');
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        });

        return notification;
      } catch (error) {
        console.error('Error sending notification:', error);
        return null;
      }
    },
    [permissionState.isGranted]
  );

  const notifyRideStatus = useCallback(
    (status: string, driverName?: string) => {
      const messages: Record<string, { title: string; body: string }> = {
        confirmed: {
          title: 'Corrida Confirmada! ✓',
          body: driverName
            ? `${driverName} foi designado para sua corrida.`
            : 'Um motorista foi designado para sua corrida.',
        },
        enroute: {
          title: 'Motorista a Caminho 🚗',
          body: driverName
            ? `${driverName} está indo até você.`
            : 'Seu motorista está a caminho.',
        },
        arrived: {
          title: 'Motorista Chegou! 📍',
          body: driverName
            ? `${driverName} está te aguardando.`
            : 'Seu motorista chegou ao local.',
        },
        in_progress: {
          title: 'Viagem Iniciada 🛣️',
          body: 'Boa viagem! Acompanhe no app.',
        },
        completed: {
          title: 'Viagem Concluída ✨',
          body: 'Obrigado por viajar com a MOVA!',
        },
        cancelled: {
          title: 'Corrida Cancelada',
          body: 'Sua corrida foi cancelada.',
        },
      };

      const message = messages[status];
      if (message) {
        sendNotification(message.title, { body: message.body });
      }
    },
    [sendNotification]
  );

  return {
    ...permissionState,
    requestPermission,
    sendNotification,
    notifyRideStatus,
  };
}
