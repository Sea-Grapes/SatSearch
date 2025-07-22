<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

<svelte:head>
  <title>SAT Test Search</title>
</svelte:head>

{@render children()}
