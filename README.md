# AirDay

A family in Bengaluru needs to collect two children, and a neighbour can share the school run. Would the detour actually reduce driving? AirDay compares both routes, pairs the result with a household smoke-source swap and offers a short family briefing.

## Try it

Serve this directory with `python3 -m http.server 8000` and visit http://localhost:8000. The same files run on a static HTTPS host such as GitHub Pages. Use a recent Chrome installation on supported hardware for on-device generation. Select **Generate a family briefing** to start. Chrome manages model availability and the initial download. The calculated plan remains usable on other browsers.

Choose two 4 km round trips and a 4 km combined route. The result is 4 vehicle-km avoided. Change the combined route to 9 km. The result becomes 1 vehicle-km added. Switch to a community event or grocery collection to compare the advice.

## Data and AI

The city button requests the current modelled PM₂.₅ concentration from CAMS through Open-Meteo. It sends only the selected city's fixed coordinates. The timestamp is displayed in India Standard Time. Missing, malformed or stale results produce an explicit unavailable state. The official Indian AQI dashboard is linked in the app. Personal exposure and neighbourhood-level AQI improvements cannot be inferred from driving distance.

Google Antigravity helped design the source-aware runtime prompt. On compatible devices, Chrome's Prompt API runs Gemini Nano locally to explain the calculated plan. There are no API keys, accounts, trackers, build dependencies or stored household profiles.

## Verification

Run `node --test` (Node 22) for six tests covering route savings, detours, invalid inputs, household alternatives and reading validity. The interface uses labelled native controls, keyboard focus outlines, responsive columns and live regions. All provider and model output is rendered as text.

[Open-Meteo and CAMS attribution](https://open-meteo.com/en/docs/air-quality-api) · [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
