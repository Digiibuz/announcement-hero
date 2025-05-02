import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTicket } from '@/hooks/tickets';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  subject: z.string().min(3, {
    message: 'Le sujet doit comporter au moins 3 caractères.',
  }),
  message: z.string().min(10, {
    message: 'Le message doit comporter au moins 10 caractères.',
  }),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const CreateTicketForm = () => {
  const { user } = useAuth();
  const { mutate: createTicket, isPending } = useCreateTicket();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      message: '',
      priority: 'medium',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user?.id || !user?.name) {
      toast.error('Vous devez être connecté pour créer un ticket.');
      return;
    }

    createTicket({
      user_id: user.id,
      username: user.name,
      subject: values.subject,
      message: values.message,
      priority: values.priority,
      status: 'open',
      created_at: new Date().toISOString(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un nouveau ticket</CardTitle>
        <CardDescription>
          Décrivez votre problème ou question ici.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sujet</FormLabel>
                  <FormControl>
                    <Input placeholder="Sujet du ticket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre problème ici..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une priorité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Création...' : 'Créer le ticket'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTicketForm;
