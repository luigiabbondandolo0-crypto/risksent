import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (msg: string, description?: string) =>
    sonnerToast.success(msg, { description }),
  error: (msg: string, description?: string) =>
    sonnerToast.error(msg, { description }),
  info: (msg: string, description?: string) =>
    sonnerToast(msg, { description }),
  warning: (msg: string, description?: string) =>
    sonnerToast.warning(msg, { description }),
  promise: <T>(
    promise: Promise<T>,
    opts: { loading: string; success: string; error: string }
  ) => sonnerToast.promise(promise, opts),
};
