<?php
/**
 * Core hooks and helpers for the Atera Compact Calculator block.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Safely resolve an asset version based on modification time.
 *
 * @param string $relative_path Asset path relative to the plugin root.
 * @return string|int
 */
function atera_compact_calculator_asset_version( $relative_path ) {
    $absolute_path = plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . ltrim( $relative_path, '/' );

    if ( file_exists( $absolute_path ) ) {
        return filemtime( $absolute_path );
    }

    return '1.0.0';
}

/**
 * Load the calculator configuration from the bundled JSON file.
 *
 * @return array|WP_Error
 */
function atera_compact_calculator_load_config() {
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

/**
 * Register block assets and configuration.
 */
function atera_compact_calculator_register_block() {
    $asset_url = plugins_url( 'assets/', ATERA_CALC_PLUGIN_FILE );

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
            'editor_script'   => 'atera-compact-calculator-block',
            'script'          => 'atera-compact-calculator-frontend',
            'style'           => 'atera-compact-calculator-style',
            'editor_style'    => 'atera-compact-calculator-editor-style',
            'attributes'      => array(
                'title'         => array(
                    'type'    => 'string',
                    'default' => __( 'Calculate how much you save with <br>Atera', 'atera' ),
                ),
                'summaryKicker' => array(
                    'type'    => 'string',
                    'default' => __( 'You save', 'atera' ),
                ),
                'summaryCta'    => array(
                    'type'    => 'string',
                    'default' => __( 'Start free trial', 'atera' ),
                ),
                'summarySubtext' => array(
                    'type'    => 'string',
                    'default' => __( 'annually — estimated based on Atera’s Pro Plan', 'atera' ),
                ),
                'summaryBreakdownHeader' => array(
                    'type'    => 'string',
                    'default' => __( 'Average annual cost', 'atera' ),
                ),
                'labelAtera' => array(
                    'type'    => 'string',
                    'default' => __( 'Atera', 'atera' ),
                ),
                'labelCurrentProvider' => array(
                    'type'    => 'string',
                    'default' => __( 'Current provider', 'atera' ),
                ),
            ),
            'render_callback' => 'atera_compact_calculator_render_block',
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
 * Provide the slider configuration from the bundled JSON file via REST.
 */
function atera_compact_calculator_get_slider_config( WP_REST_Request $request ) {
    $config = atera_compact_calculator_load_config();

    if ( is_wp_error( $config ) ) {
        return $config;
    }

    return rest_ensure_response( $config );
}
