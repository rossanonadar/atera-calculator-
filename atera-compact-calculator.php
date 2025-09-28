<?php
/**
 * Plugin Name:       Atera Compact Calculator
 * Description:       Provides the "Atera Compact Calculator" Gutenberg block for estimating savings.
 * Version:           1.0.0
 * Author:            Atera
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// die();


/**
 * Safely resolve an asset version based on modification time.
 */
function atera_compact_calculator_asset_version( $relative_path ) {
    $absolute_path = plugin_dir_path( __FILE__ ) . ltrim( $relative_path, '/' );

    if ( file_exists( $absolute_path ) ) {
        return filemtime( $absolute_path );
    }

    return '1.0.0';
}

function atera_compact_calculator_register_block() {
    $asset_url = plugins_url( 'assets/', __FILE__ );

    wp_register_script(
        'atera-compact-calculator-block',
        $asset_url . 'js/block.js',
        array( 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-components', 'wp-block-editor', 'wp-api-fetch' ),
        atera_compact_calculator_asset_version( 'assets/js/block.js' ),
        true
    );

    wp_register_script(
        'atera-compact-calculator-frontend',
        $asset_url . 'js/frontend.js',
        array(),
        atera_compact_calculator_asset_version( 'assets/js/frontend.js' ),
        true
    );

    wp_register_style(
        'atera-compact-calculator-style',
        $asset_url . 'css/style.css',
        array(),
        atera_compact_calculator_asset_version( 'assets/css/style.css' )
    );

    wp_register_style(
        'atera-compact-calculator-editor-style',
        $asset_url . 'css/editor.css',
        array( 'wp-edit-blocks' ),
        atera_compact_calculator_asset_version( 'assets/css/editor.css' )
    );

    register_block_type(
        'atera/compact-calculator',
        array(
            'editor_script' => 'atera-compact-calculator-block',
            'script'        => 'atera-compact-calculator-frontend',
            'style'         => 'atera-compact-calculator-style',
            'editor_style'  => 'atera-compact-calculator-editor-style',
        )
    );
}
add_action( 'init', 'atera_compact_calculator_register_block' );

/**
 * Register REST API routes for the calculator.
 */
function atera_compact_calculator_register_rest_routes() {
    register_rest_route(
        'atera/v1',
        '/calculator-config',
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'atera_compact_calculator_get_slider_config',
            'permission_callback' => '__return_true',
        )
    );
}
add_action( 'rest_api_init', 'atera_compact_calculator_register_rest_routes' );

/**
 * Provide the slider configuration from the bundled JSON file.
 */
function atera_compact_calculator_get_slider_config( WP_REST_Request $request ) {
    $config_path = plugin_dir_path( __FILE__ ) . 'calc-sliders.json';

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

    if ( null === $data ) {
        return new WP_Error(
            'atera_calculator_invalid_config',
            __( 'The calculator configuration is invalid.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    return rest_ensure_response( $data );
}
