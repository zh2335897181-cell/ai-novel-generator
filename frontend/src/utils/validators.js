/**
 * 表单验证工具函数
 */

/**
 * 验证必填项
 */
export const required = (message = '此项为必填项') => {
  return {
    required: true,
    message,
    trigger: 'blur'
  };
};

/**
 * 验证最小长度
 */
export const minLength = (min, message) => {
  return {
    min,
    message: message || `长度不能小于${min}个字符`,
    trigger: 'blur'
  };
};

/**
 * 验证最大长度
 */
export const maxLength = (max, message) => {
  return {
    max,
    message: message || `长度不能超过${max}个字符`,
    trigger: 'blur'
  };
};

/**
 * 验证邮箱
 */
export const email = (message = '请输入正确的邮箱地址') => {
  return {
    type: 'email',
    message,
    trigger: 'blur'
  };
};

/**
 * 验证手机号
 */
export const phone = (message = '请输入正确的手机号') => {
  return {
    pattern: /^1[3-9]\d{9}$/,
    message,
    trigger: 'blur'
  };
};

/**
 * 验证数字范围
 */
export const numberRange = (min, max, message) => {
  return {
    validator: (rule, value, callback) => {
      if (value < min || value > max) {
        callback(new Error(message || `数值必须在${min}到${max}之间`));
      } else {
        callback();
      }
    },
    trigger: 'blur'
  };
};

/**
 * 验证JSON格式
 */
export const jsonFormat = (message = '请输入正确的JSON格式') => {
  return {
    validator: (rule, value, callback) => {
      if (!value) {
        callback();
        return;
      }
      try {
        JSON.parse(value);
        callback();
      } catch (error) {
        callback(new Error(message));
      }
    },
    trigger: 'blur'
  };
};

/**
 * 自定义验证器
 */
export const custom = (validator, message) => {
  return {
    validator: (rule, value, callback) => {
      if (validator(value)) {
        callback();
      } else {
        callback(new Error(message));
      }
    },
    trigger: 'blur'
  };
};

