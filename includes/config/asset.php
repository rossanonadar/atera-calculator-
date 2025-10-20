<?php
/**
 * Asset helper functions for Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
/**
 * Get the version of an asset based on its file modification time.
 *
 * @param string $relative_path The relative path to the asset file.
 * @return int|string The file modification time as version or '1.0.0' if file doesn't exist.
 */
function atera_compact_calculator_asset_version( $relative_path ) {
    $absolute_path = plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . ltrim( $relative_path, '/' );

    if ( file_exists( $absolute_path ) ) {
        return filemtime( $absolute_path );
    }

    return '1.0.0';
}
