# Atera Compact Calculator

Atera Compact Calculator is a WordPress plugin that ships a single dynamic block for estimating the annual savings teams can achieve when moving to Atera. The block renders a calculator shell in PHP, fetches its slider configuration from a bundled JSON file via REST, and hydrates the UI with vanilla JavaScript.

## Requirements
- WordPress 6.1 or later (block editor enabled)
- PHP 7.4 or later
- A modern browser for the block editor experience

## Installation
1. Copy the plugin directory into `wp-content/plugins/atera` (or clone the repository into that location).
2. Log in to the WordPress admin dashboard.
3. Activate **Atera Compact Calculator** from *Plugins → Installed Plugins*.

## Usage
- Insert the **Atera Compact Calculator** block in the editor (Add block → Widgets).
- Adjust the title, summary kicker, CTA label, footer note, and other copy via the block sidebar or inline fields.
- Publish or update the page. On the front end, the block fetches its configuration and replaces the loading state with the interactive calculator.

## How It Works
- The block markup is rendered server-side by `atera_compact_calculator_render_block()` (see `includes/render.php`). This keeps the initial layout accessible and crawlable.
- Slider configuration is defined in `calc-sliders.json` and exposed through the REST endpoint `/wp-json/atera/v1/calculator-config`.
- `assets/js/frontend.js` fetches the configuration, builds the sliders, and updates the summary figures in response to user input.
- Shared calculator utilities (formatting, math, gradients) live in `assets/js/utils.js` and are reused by both the editor and frontend scripts.
- Editor-side behaviour is handled by `assets/js/block.js`, which mirrors the frontend calculator so authors see live estimates while editing.

## Customisation
- Update `calc-sliders.json` to change slider labels, ranges, defaults, or formatting. These act as built-in defaults and are used whenever the remote config cannot be reached.
- Supply a remote configuration URL so the calculator stays synchronised with an external JSON file: go to **Settings → General → Calculator config URL** and enter the endpoint (e.g. `https://example.com/path/to/calc-sliders.json`). You can also provide it via the `ATERA_CALC_REMOTE_CONFIG_URL` environment variable/constant or the `atera_compact_calculator_remote_config_url` filter.
- Control the CTA link per instance via the block sidebar (Summary CTA link). Leave it blank to fall back to the remote configuration or the `ATERA_CALC_CTA_HREF` env/constant and `atera_compact_calculator_cta_href` filter.
- Styles can be adjusted in `assets/css/style.css` (frontend) and `assets/css/editor.css` (editor preview).
- The summary CTA currently links to `#start-trial`. Replace or augment this in `includes/render.php` if a different target is required.

## Development Notes
- Scripts are written in plain ES5/ESNext compatible JavaScript and do not require a build step. If you introduce a bundler, remember to update the enqueue logic in `includes/init.php`.
- The render callback and helpers are loaded via `atera-compact-calculator.php`, which defines `ATERA_CALC_PLUGIN_FILE` and requires the files under `includes/`.
- All user-facing strings support translation through the `atera` text domain. Call `wp i18n make-pot` against the plugin directory to regenerate POT files.

## Troubleshooting
- If the calculator displays the loading message indefinitely, confirm that `/wp-json/atera/v1/calculator-config` returns the bundled JSON (check REST API output via browser or `curl`).
- When editing `calc-sliders.json`, ensure the file remains valid JSON; malformed JSON returns an error and surfaces a REST error notice in the editor.

## License
Released under the GNU General Public License v2 or later. See `LICENSE` for details.
