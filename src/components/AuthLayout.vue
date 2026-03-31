<template>
  <div class="auth-layout">
    <aside class="auth-visual" :style="{ backgroundImage: 'var(--auth-gradient)' }">
      <slot name="visual" />
    </aside>
    <main class="auth-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
// purely presentational layout; gradient provided via CSS var: --auth-gradient
</script>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
}
.auth-visual {
  flex: 1.2;
  background-size: cover;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}
.auth-content {
  flex: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

@media (max-width: 900px) {
  .auth-layout {
    flex-direction: column;
  }
  .auth-visual {
    width: 100%;
    height: 220px;
    padding: 20px;
  }
  .auth-content {
    padding: 20px;
  }
}
</style>
