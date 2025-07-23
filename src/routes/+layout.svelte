<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

<svelte:head>
  <title>SatSearch</title>
</svelte:head>

{@render children()}
