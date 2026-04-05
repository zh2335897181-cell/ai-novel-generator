import { ref } from 'vue';

/**
 * 对话框管理 Composable
 * 统一管理对话框的显示/隐藏状态
 */
export function useDialog() {
  const visible = ref(false);

  const open = () => {
    visible.value = true;
  };

  const close = () => {
    visible.value = false;
  };

  const toggle = () => {
    visible.value = !visible.value;
  };

  return {
    visible,
    open,
    close,
    toggle
  };
}

/**
 * 多对话框管理
 */
export function useDialogs(dialogNames = []) {
  const dialogs = {};

  dialogNames.forEach(name => {
    dialogs[name] = useDialog();
  });

  return dialogs;
}
