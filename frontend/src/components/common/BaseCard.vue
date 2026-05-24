<template>
  <div
    :class="['base-card', { 'is-hoverable': hoverable, 'is-clickable': clickable }]"
    @click="clickable && $emit('click')"
  >
    <div v-if="title || $slots.header" class="card-header">
      <slot name="header">
        <div class="header-row">
          <span class="card-title">{{ title }}</span>
          <span v-if="subtitle" class="card-subtitle">{{ subtitle }}</span>
        </div>
        <slot name="extra" />
      </slot>
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hoverable: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false }
});

defineEmits(['click']);
</script>

<style scoped>
.base-card {
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: all var(--transition-spring);
}

.base-card.is-hoverable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-accent);
}

.base-card.is-clickable {
  cursor: pointer;
}
.base-card.is-clickable:active {
  transform: scale(0.985);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(180deg, var(--bg-elevated), transparent);
}

.header-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.card-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.card-body {
  padding: 24px;
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  background: linear-gradient(0deg, rgba(248,250,252,0.5), transparent);
}
</style>
