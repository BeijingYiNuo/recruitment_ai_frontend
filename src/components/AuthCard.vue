<template>
  <div class="auth-card">
    <header class="card-header">
      <slot name="header" />
    </header>
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
// simple presentational card for auth forms
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
  padding: 28px;
}
.card-header {
  text-align: center;
  margin-bottom: 12px;
}
.card-body {
  margin-top: 8px;
}
@media (max-width: 600px) {
  .auth-card {
    padding: 20px;
    border-radius: 8px;
  }
}
</style>
