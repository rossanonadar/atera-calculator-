<?php
/**
 * Settings registration for Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
// Register settings
function atera_compact_calculator_sanitize_remote_url( $value ) {
    $value = trim( (string) $value );

    if ( '' === $value ) {
        return '';
    }

    return esc_url_raw( $value );
}
// Register the setting
function atera_compact_calculator_remote_url_field() {
    $value = get_option( 'atera_compact_calculator_remote_url', '' );

    printf(
        '<input type="url" id="atera_compact_calculator_remote_url" name="atera_compact_calculator_remote_url" class="regular-text" value="%s" placeholder="https://example.com/path/to/calc-sliders.json" />',
        esc_attr( $value )
    );

    echo '<p class="description">' . esc_html__( 'URL of the JSON configuration for the compact calculator. Leave empty to use the bundled defaults.', 'atera' ) . '</p>';
}
// Add settings section and field
function atera_compact_calculator_flush_cached_config() {
    delete_transient( 'atera_compact_calculator_config_v1' );
}
add_action( 'update_option_atera_compact_calculator_remote_url', 'atera_compact_calculator_flush_cached_config' );
add_action( 'add_option_atera_compact_calculator_remote_url', 'atera_compact_calculator_flush_cached_config' );
