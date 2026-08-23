import { useConfirmDialog, ConfirmDialog } from './confirm-dialog';
export const ConfirmDialogContainer = () => {
  const dialog = useConfirmDialog();
  return !dialog ? null : <ConfirmDialog id={dialog.id} title={dialog.title} message={dialog.message} yesLabel={dialog.yesLabel} cancelLabel={dialog.cancelLabel} resolver={dialog.resolver} />;
};