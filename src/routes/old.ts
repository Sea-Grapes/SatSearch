const log = (msg: string) => console.log(`[SAT] ${msg}`);
const capitalize = (str: string) => str.toLowerCase().replaceAll(/\b./g, (s) => s.toUpperCase());

async function fetchData() {
	try {
		log('Updating data...');
		header.textContent = 'Fetching data';
		data = [];

		let sessions = await (await fetch(`https://sat-admin-dates.collegeboard.org/`)).json();

		log('Recieved testing dates, scanning for sessions');

		await Promise.all(
			sessions.map(async ({ eventFormattedDate: dateAPI, eventDisplayDate: displayDate }) => {
				let schools = await (
					await fetch(
						`https://aru-test-center-search.collegeboard.org/prod/test-centers?date=${dateAPI}&zip=${zipInput.value}&country=US`
					)
				).json();
				schools = schools
					.filter((school) => school.seatAvailability)
					.map(
						({
							name = 'Unknown School',
							distance = 0,
							address1 = 'Address',
							city = 'City',
							state = 'State',
							zip = 'Zip'
						}) => [
							capitalize(name),
							`${capitalize(address1)} ${capitalize(city)} ${state.toUpperCase()} ${zip}`,
							distance.toFixed(2)
						]
					);
				data.push({
					date: new Date(dateAPI),
					displayDate,
					schools
				});
				log(`Added schools from ${dateAPI} to data`);
			})
		);

		data.sort((a, b) => a.date - b.date);

		log('Finished fetching data');

		localStorage.setItem('data', JSON.stringify(data));
		localStorage.setItem('time', Date.now());
	} catch (e) {
		alert('Error with CollegeBoard API');
		throw e;
	}
}

const table = document.querySelector('tbody');
const header = document.querySelector('th');

function setUI() {
	if (!data) return;

	table.innerHTML = '';
	header.textContent = `Search results for ${zipInput.value}`;

	data.forEach(({ dateAPI, displayDate, schools }) => {
		schools = schools.filter(([n, a, distance]) => distance <= +distanceInput.value);
		if (!schools.length) return;

		make(table, 'tr', (tr) => {
			make(tr, 'td', (td) => {
				td.colSpan = 3;
				td.textContent = displayDate;
				td.classList = 'text-center font-medium bg-slate-50 text-slate-400 py-4 px-6';
			});
		});

		schools.forEach(([school, address, distance]) => {
			const row = make(table, 'tr', (tr) => (tr.classList = '*:py-4 *:px-6'));
			make(row, 'td', (td) => (td.textContent = school));
			make(row, 'td', (td) => {
				make(td, 'a', (a) => {
					a.classList = 'underline text-blue-600 hover:text-blue-800 visited:text-purple-600';
					a.href = `https://www.google.com/maps/search/?api=1&query=${address}`;
					a.textContent = address;
				});
			});
			make(row, 'td', (td) => (td.textContent = `${distance} mi`));
		});
	});
}

const form = document.querySelector('form');

const zipInput = document.querySelector('#zipcode');
zipInput.value = localStorage.getItem('zipInput');
zipInput.pastValue = zipInput.value;
const distanceInput = document.querySelector('#distance');
distanceInput.value = localStorage.getItem('distanceInput') ?? 25;

document.querySelector('button').addEventListener('click', async (e) => {
	if (form.checkValidity()) {
		localStorage.setItem('zipInput', zipInput.value);
		if (zipInput.value !== zipInput.pastValue) {
			await fetchData();
			zipInput.pastValue = zipInput.value;
		}
		setUI();
	}
});

distanceInput.addEventListener('change', (e) => {
	setUI();
	localStorage.setItem('distanceInput', distanceInput.value);
});

const currentTime = Date.now();
log(`Systems online ${currentTime}ms`);

const previousTime = localStorage.getItem('time') ?? currentTime;
log(`Last updated ${previousTime}ms`);

const delayMS = currentTime - previousTime;
const delayH = delayMS / (1000 * 60 * 60);
log(`It has been ${delayH.toFixed(3)}h since last fetched`);

let data = JSON.parse(localStorage.getItem('data'));
if (delayH > 12) {
	fetchData().then(() => setUI());
} else if (data) setUI();
