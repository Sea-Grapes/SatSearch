<script lang="ts">
  import { onMount } from 'svelte'
  import Download from './icons/Download.svelte'
  import Load from './icons/Load.svelte'
  import { Status } from './status'
  import Warn from './icons/Warn.svelte'
  import { fly } from 'svelte/transition'

  let status: Status = $state(Status.None)
  status = Status.None

  async function load_data() {
    status = Status.Loading

    setTimeout(() => {
      status = Status.Recieved
    }, 1000)

    try {
    } catch (e) {}
  }

  let distance = $state(25)
  let zip = $state('')
  let zip_regex = '^\\d{5}(-\\d{4})?$'

  interface DateData {
    displayDate: string
    schools: SchoolData[]
  }

  interface SchoolData {
    name: string
    distance: number
    address: string
    city: string
    state: string
    zip: string
  }

  let dates: DateData[] = $state([
    // {
    //   displayDate: 'August 23',
    //   schools: [
    //     {
    //       name: 'test',
    //       distance: 10,
    //       address: '123 anywhere',
    //       city: 'Sammamish',
    //       state: 'WA',
    //       zip: '12345'
    //     }
    //   ]
    // }
  ])

  onMount(() => {
    let saved_dates = localStorage.getItem('data')
  })
</script>

<main class="max-w-8xl mx-auto flex flex-col gap-8 p-f lg:flex-row">
  <section class="shrink-0">
    <header class="rounded-lg border border-slate-300 p-6 align-top">
      <div class="mb-10 space-y-1">
        <h1 class="text-2xl font-semibold">SAT Testing Lookup</h1>
        <p class="text-sm text-slate-500">Search for SAT testing locations near you</p>
      </div>
      <form class="space-y-5">
        <div>
          <label for="zipcode" class="mb-2 block font-medium text-slate-600">Zip code</label>
          <input
            id="zipcode"
            placeholder="Enter a valid zip code"
            bind:value={zip}
            pattern={zip_regex}
            required
            class="h-9 w-full rounded-lg border border-slate-300 px-3 py-1 text-sm outline-none focus:border-slate-500 invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500"
            type="text"
          />
        </div>
        <div>
          <label for="distance" class="mb-2 block font-medium text-slate-600"
            >Max distance (miles)</label
          >
          <input
            id="distance"
            placeholder="Enter distance"
            bind:value={distance}
            min="0"
            max="10000"
            type="number"
            class="h-9 w-full rounded-lg border border-slate-300 px-3 py-1 text-sm outline-none focus:border-slate-500 invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500"
          />
        </div>
        <button
          type="button"
          onclick={load_data}
          class="flex min-w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-slate-300 bg-slate-100 p-2 text-center font-medium text-slate-400 transition hover:bg-slate-200 active:translate-y-0.5"
        >
          Download data <Download />
        </button>
      </form>
    </header>
  </section>
  <section class="grow">
    <div class="overflow-hidden rounded-lg border border-slate-300">
      <table class="min-w-full">
        <thead>
          <tr>
            <th colspan="3" class="bg-slate-100 px-6 py-4 text-left font-medium text-slate-400">
              {#if status == Status.Recieved}
                <span in:fly={{ y: 10 }}>
                  Results for {zip}
                </span>
              {:else if status === Status.Loading}
                <span in:fly={{ y: 10 }} class="flex items-center gap-3">
                  <Load />
                  Downloading data for {zip}...
                </span>
              {:else if status == Status.Error}
                <span in:fly={{ y: 10 }} class="flex items-center gap-3">
                  <Warn /> An error occurred
                </span>
              {:else}
                Results will appear here
              {/if}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-300 border-t border-slate-300">
          {#each dates as date}
            <tr>
              <td colspan="3" class="bg-slate-50 px-6 py-4 text-center font-medium text-slate-400"
                >{date.displayDate}</td
              >
            </tr>
            {#each date.schools.filter((school) => school.distance <= distance) as school}
              <tr class="divide-x divide-slate-300 *:px-6 *:py-4">
                <td>{school.name}</td>
                <td
                  ><a
                    class="text-blue-600 underline visited:text-purple-600 hover:text-blue-800"
                    href="https://www.google.com/maps/search/?api=1&query={school.address}"
                    target="_blank">{school.address}</a
                  >
                </td>
                <td>{school.distance} mi</td>
              </tr>
            {/each}
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</main>
