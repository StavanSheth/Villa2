import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';

export function useOptimisticMutation<TData, TError, TVariables, TContext = any>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    queryKey: string[];
    optimisticUpdate: (oldData: any, variables: TVariables) => any;
  }
) {
  const queryClient = useQueryClient();
  const { queryKey, optimisticUpdate, onMutate, onError, onSettled, ...rest } = options;

  return useMutation({
    ...rest,
    onMutate: async (variables): Promise<any> => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: any) => optimisticUpdate(old, variables));

      // Execute external onMutate if provided
      const customContext = onMutate ? await (onMutate as any)(variables) : {};

      return { previousData, ...customContext };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      // Dispatch a toast or global event to notify the user
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('network-error', {
          detail: { message: "Server not working. Changes not saved, but you can continue browsing." }
        }));
      }

      if (onError) (onError as any)(err, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Sync with server once settled
      queryClient.invalidateQueries({ queryKey });
      if (onSettled) (onSettled as any)(data, error, variables, context);
    },
  });
}
