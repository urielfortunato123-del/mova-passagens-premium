import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, MapPin, Navigation, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCreateBooking } from '@/hooks/useBookings';
import { useFavorites } from '@/hooks/useFavorites';
import { ScheduleFormData } from '@/types';
import { PricePreview } from './PricePreview';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';

const formSchema = z.object({
  pickupAddress: z.string().min(5, 'Endereço muito curto'),
  dropoffAddress: z.string().min(5, 'Endereço muito curto'),
  pickupDate: z.date({ required_error: 'Selecione uma data' }),
  pickupHour: z.string().min(1, 'Selecione um horário'),
  pickupMinute: z.string().min(1, 'Selecione os minutos'),
});

type FormValues = z.infer<typeof formSchema>;

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = ['00', '15', '30', '45'];

export function ScheduleForm() {
  const [showPreview, setShowPreview] = useState(false);
  const { data: favorites = [] } = useFavorites();
  const createBooking = useCreateBooking();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupAddress: '',
      dropoffAddress: '',
      pickupHour: '',
      pickupMinute: '',
    },
  });

  const watchedValues = form.watch();
  const isFormValid = form.formState.isValid;

  const handleFavoriteSelect = (address: string, field: 'pickupAddress' | 'dropoffAddress') => {
    form.setValue(field, address, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    const pickupTime = new Date(values.pickupDate);
    pickupTime.setHours(parseInt(values.pickupHour), parseInt(values.pickupMinute), 0, 0);

    const data: ScheduleFormData = {
      pickupAddress: values.pickupAddress,
      dropoffAddress: values.dropoffAddress,
      pickupTime,
    };

    await createBooking.mutateAsync(data);
    form.reset();
    setShowPreview(false);
  };

  const handlePreviewConfirm = () => {
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => setShowPreview(true))} className="space-y-4">
          {/* Pickup Address */}
          <FormField
            control={form.control}
            name="pickupAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Endereço de origem
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <AddressAutocomplete
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Digite o endereço de partida"
                    />
                    {favorites.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {favorites.slice(0, 3).map((fav) => (
                          <button
                            key={fav.id}
                            type="button"
                            onClick={() => handleFavoriteSelect(fav.address, 'pickupAddress')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                          >
                            <Star className="w-3 h-3" />
                            {fav.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dropoff Address */}
          <FormField
            control={form.control}
            name="dropoffAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-status-completed" />
                  Endereço de destino
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <AddressAutocomplete
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Digite o endereço de destino"
                    />
                    {favorites.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {favorites.slice(0, 3).map((fav) => (
                          <button
                            key={fav.id}
                            type="button"
                            onClick={() => handleFavoriteSelect(fav.address, 'dropoffAddress')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                          >
                            <Star className="w-3 h-3" />
                            {fav.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Picker */}
          <FormField
            control={form.control}
            name="pickupDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  Data da corrida
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full h-12 justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          'Selecione a data'
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pickupHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickupMinute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minutos</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {minutes.map((min) => (
                        <SelectItem key={min} value={min}>
                          {min}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base font-semibold"
            disabled={!isFormValid}
          >
            Ver estimativa
          </Button>
        </form>
      </Form>

      <PricePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        pickupAddress={watchedValues.pickupAddress}
        dropoffAddress={watchedValues.dropoffAddress}
        pickupTime={
          watchedValues.pickupDate && watchedValues.pickupHour && watchedValues.pickupMinute
            ? (() => {
                const date = new Date(watchedValues.pickupDate);
                date.setHours(parseInt(watchedValues.pickupHour), parseInt(watchedValues.pickupMinute));
                return date;
              })()
            : undefined
        }
        onConfirm={handlePreviewConfirm}
        isLoading={createBooking.isPending}
      />
    </div>
  );
}
