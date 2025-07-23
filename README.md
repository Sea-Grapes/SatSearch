# SatSearch

A simple web app to search for sat test centers in bulk. Uses the CollegeBoard API to find locations, currently only works for the US.

![Example search](/github/image_2.png 'Example search')

## Features

- Input zip code to search around the area
- Input a max distance to limit displayed data
- Auto-refreshes data every 1 hour when you reload/reopen the page
- Links to google map school locations

## Why?

The CollegeBoard search page requires you to manually look through each test day rather than displaying everything at once. Centralized searching helps prevent students from missing out on new available sessions.

**Todo list**

- [ ] Highlight new locations when data updates
- [ ] Non-US support
- [ ] add dark mode/refresh ui
