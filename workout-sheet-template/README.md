# Workout Sheet Template

Create a Google Sheet with these exact tab names and headers:

- `Blocks`
- `Sessions`
- `Exercises`
- `Templates`
- `Completions`

Copy the CSV files in this folder into matching Google Sheet tabs. Share the Google Sheet with the service account email from `GOOGLE_SERVICE_ACCOUNT_EMAIL`, then set `GOOGLE_WORKOUT_SHEET_ID` to the sheet ID from the URL.

The app reads `Blocks`, `Sessions`, and `Exercises` for v1. `Templates` is included so the spreadsheet can become the planning workspace without changing the app schema later. The app appends completion rows to `Completions` when you mark a session complete or skipped.
