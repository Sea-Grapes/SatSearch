<script lang="ts">
  import { onMount } from 'svelte'
  import Download from './icons/Download.svelte'
  import Load from './icons/Load.svelte'
  import { Status } from './status'
  import Warn from './icons/Warn.svelte'
  import { fly } from 'svelte/transition'
  import { PersistedState } from 'runed'

  const log = (msg: string) => console.log(`[SAT] ${msg}`)

  let form: HTMLFormElement

  let status: Status = $state(Status.None)
  status = Status.None

  let distance = new PersistedState('distance', '25')
  let zip = new PersistedState('zip', '')
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

  let sessions = new PersistedState<Session[]>('sessions', [])
  if (sessions.current.length) status = Status.Recieved

  // stores data about last fetch
  interface FetchData {
    zip: string
    time: number
  }

  let session_meta = new PersistedState<FetchData>('session_meta', {
    zip: '',
    time: 0
  })

  onMount(() => {
    const current_time = new Date().getTime()
    const last_time = session_meta.current.time
    const elapsed = current_time - last_time
    const elapsed_hrs = elapsed / (1000 * 60 * 60)

    if (elapsed_hrs > 1) {
      log(`It has been ${elapsed_hrs.toFixed(3)}h since last fetched, auto-reloading data`)

      load_data()
      session_meta.current.time = current_time
    } else {
      log(`It has been ${elapsed_hrs.toFixed(3)}h since last fetched, no need to auto-reload`)
    }
  })

  let filtered_sessions = $derived.by(() => {
    return $state
      .snapshot(sessions.current)
      .map((session) => {
        session.schools = session.schools.filter(
          (school) => school.distance <= Number(distance.current)
        )
        return session
      })
      .filter((session) => session.schools.length > 0)
  })

  const capitalize = (str: string) => str.toLowerCase().replaceAll(/\b./g, (s) => s.toUpperCase())

  async function load_data() {
    log('loading data')
    try {
      if (!form.checkValidity()) return
      session_meta.current.zip = zip.current
      status = Status.Loading

      let res: Session[] = []

      let sessions_data = await (
        await fetch(`https://sat-admin-dates.collegeboard.org/`, { cache: 'no-store' })
      ).json()

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
                  `https://aru-test-center-search.collegeboard.org/prod/test-centers?date=${api_date}&zip=${zip.current}&country=US`,
                  {
                    cache: 'no-store'
                  }
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
      sessions.current = res

      status = Status.Recieved
    } catch (e) {
      status = Status.Error
      throw e
    }
  }
</script>

<main class="max-w-8xl mx-auto flex min-h-screen flex-col gap-32 p-f pb-f2">
  <div class="flex grow flex-col gap-8 lg:flex-row">
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
              bind:value={zip.current}
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
              bind:value={() => distance.current, (v) => (distance.current = '' + (v || ''))}
              min="0"
              max="10000"
              type="number"
              class="h-9 w-full rounded-lg border border-slate-300 px-3 py-1 text-sm outline-none focus:border-slate-500 invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500"
            />
          </div>
          <button
            type="button"
            onclick={load_data}
            class="flex min-w-full cursor-pointer items-center justify-center gap-2 rounded-lg
          border border-slate-300 bg-slate-100 p-2 text-center font-medium text-slate-400 transition outline-none hover:bg-slate-200 focus:ring-2 focus:ring-slate-300/60 active:translate-y-0.5"
          >
            Refresh data <Download />
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
                    Results for {session_meta.current.zip}
                  </span>
                {:else if status === Status.Loading}
                  <span in:fly={{ y: 10 }} class="flex items-center gap-3">
                    <Load />
                    Fetching latest data for {session_meta.current.zip}...
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
  </div>
  <footer class="flex justify-between text-sm text-slate-400">
    <div>Blurp Tech.</div>
    <a class="underline" href="https://github.com/Sea-Grapes/sat-test-search" target="_blank"
      >Source</a
    >
  </footer>
</main>
