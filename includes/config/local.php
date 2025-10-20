<?php
/**
 * Local configuration loader for Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function atera_compact_calculator_load_local_config() {
    $config_path = plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'calc-sliders.json';

    if ( ! file_exists( $config_path ) ) {
        return new WP_Error(
            'atera_calculator_missing_config',
            __( 'The calculator configuration could not be found.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    if ( ! is_readable( $config_path ) ) {
        return new WP_Error(
            'atera_calculator_unreadable_config',
            __( 'The calculator configuration file is not readable.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    $data = function_exists( 'wp_json_file_decode' )
        ? wp_json_file_decode( $config_path, array( 'associative' => true ) )
        : json_decode( file_get_contents( $config_path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

    if ( null === $data || ! is_array( $data ) ) {
        return new WP_Error(
            'atera_calculator_invalid_config',
            __( 'The calculator configuration is invalid.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    return $data;
}
// End of file public/wp-content/plugins/atera/includes/config/local.php
