import { useConfirmDialog, ConfirmDialog } from './confirm-dialog';

export function ConfirmDialogContainer() {
  const dialog = useConfirmDialog();

  if (!dialog) return null;

  return (
    <ConfirmDialog
      id={dialog.id}
      title={dialog.title}
      message={dialog.message}
      yesLabel={dialog.yesLabel}
      cancelLabel={dialog.cancelLabel}
      resolver={dialog.resolver}
    />
  );
}
