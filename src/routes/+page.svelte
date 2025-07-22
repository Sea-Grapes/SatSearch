<script lang="ts">
  import { onMount } from 'svelte'
  import Download from './icons/Download.svelte'
  import Load from './icons/Load.svelte'
  import { Status } from './status'
  import Warn from './icons/Warn.svelte'
  import { fly } from 'svelte/transition'

  let form: HTMLFormElement

  let status: Status = $state(Status.None)
  status = Status.None

  let distance = $state(25)
  let zip = $state('')
  let zip_regex = '^\\d{5}(-\\d{4})?$'

  interface Session {
    timestamp: number
    displayDate: string
    schools: School[]
  }

  interface School {
    name: string
    distance: number
    address: string
  }

  let sessions: Session[] = $state([])

  let filtered_sessions = $derived.by(() => {
    return $state
      .snapshot(sessions)
      .map((session) => {
        session.schools = session.schools.filter((school) => school.distance <= distance)
        return session
      })
      .filter((session) => session.schools.length > 0)
  })

  // let filtered_sessions: Session[] = $derived(
  //   sessions
  //     .map((session) => {
  //       session.schools = session.schools.filter((school) => school.distance <= distance)
  //       return session
  //     })
  //     .filter((session) => session.schools.length >= 0)
  // )

  const capitalize = (str: string) => str.toLowerCase().replaceAll(/\b./g, (s) => s.toUpperCase())

  async function load_data() {
    try {
      if (!form.checkValidity()) return
      status = Status.Loading

      let res: Session[] = []

      let sessions_data = await (await fetch(`https://sat-admin-dates.collegeboard.org/`)).json()

      interface SessionRes {
        eventFormattedDate: string
        eventDisplayDate: string
      }

      await Promise.all(
        sessions_data.map(
          async ({ eventFormattedDate: api_date, eventDisplayDate: displayDate }: SessionRes) => {
            let schools: School[] = (
              await (
                await fetch(
                  `https://aru-test-center-search.collegeboard.org/prod/test-centers?date=${api_date}&zip=${zip}&country=US`
                )
              ).json()
            )
              .filter((school: any) => school.seatAvailability)
              .map(
                ({
                  name = 'Unknown School',
                  distance = 0,
                  address1 = 'Address',
                  city = 'City',
                  state = 'State',
                  zip = 'Zip'
                }) => ({
                  name: capitalize(name),
                  address: `${capitalize(address1)} ${capitalize(city)} ${state.toUpperCase()} ${zip}`,
                  distance: Number(distance.toFixed(2))
                })
              )
            res.push({
              timestamp: new Date(api_date).getTime(),
              displayDate: displayDate,
              schools
            })
          }
        )
      )

      res.sort((a, b) => a.timestamp - b.timestamp)
      sessions.push(...res)

      status = Status.Recieved

      localStorage.setItem('sessions', JSON.stringify($state.snapshot(sessions)))

      // setTimeout(() => {
      //   status = Status.Recieved
      // }, 1000)
    } catch (e) {
      status = Status.Error
    }
  }

  onMount(() => {
    let saved_sessions = localStorage.getItem('sessions')
    if (saved_sessions) {
      let json = JSON.parse(saved_sessions)
      sessions.push(...json)
    }
  })
</script>

<main class="max-w-8xl mx-auto flex flex-col gap-8 p-f lg:flex-row">
  <section class="shrink-0">
    <header class="rounded-lg border border-slate-300 p-6 align-top">
      <div class="mb-10 space-y-1">
        <h1 class="text-2xl font-semibold">SAT Testing Lookup</h1>
        <p class="text-sm text-slate-500">Search for SAT testing locations near you</p>
      </div>
      <form bind:this={form} class="space-y-5">
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
          {#each filtered_sessions as session}
            <tr>
              <td colspan="3" class="bg-slate-50 px-6 py-4 text-center font-medium text-slate-400"
                >{session.displayDate}</td
              >
            </tr>
            {#each session.schools as school}
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
