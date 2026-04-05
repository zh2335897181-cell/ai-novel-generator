import { ref, reactive } from 'vue';

/**
 * 表单管理 Composable
 * 封装表单状态和验证逻辑
 */
export function useForm(initialValues = {}, validationRules = {}) {
  const form = reactive({ ...initialValues });
  const errors = reactive({});
  const loading = ref(false);

  // 重置表单
  const reset = () => {
    Object.keys(initialValues).forEach(key => {
      form[key] = initialValues[key];
    });
    clearErrors();
  };

  // 清除错误
  const clearErrors = () => {
    Object.keys(errors).forEach(key => {
      delete errors[key];
    });
  };

  // 设置字段值
  const setField = (field, value) => {
    form[field] = value;
    // 清除该字段的错误
    if (errors[field]) {
      delete errors[field];
    }
  };

  // 验证表单
  const validate = () => {
    clearErrors();
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = form[field];

      for (const rule of rules) {
        if (rule.required && !value) {
          errors[field] = rule.message || `${field}不能为空`;
          isValid = false;
          break;
        }

        if (rule.min && value.length < rule.min) {
          errors[field] = rule.message || `${field}长度不能小于${rule.min}`;
          isValid = false;
          break;
        }

        if (rule.max && value.length > rule.max) {
          errors[field] = rule.message || `${field}长度不能大于${rule.max}`;
          isValid = false;
          break;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = rule.message || `${field}格式不正确`;
          isValid = false;
          break;
        }

        if (rule.validator && !rule.validator(value)) {
          errors[field] = rule.message || `${field}验证失败`;
          isValid = false;
          break;
        }
      }
    });

    return isValid;
  };

  return {
    form,
    errors,
    loading,
    reset,
    clearErrors,
    setField,
    validate
  };
}
