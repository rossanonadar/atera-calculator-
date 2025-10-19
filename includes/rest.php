<?php
/**
 * REST API integration for the Atera Compact Calculator block.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

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

function atera_compact_calculator_get_slider_config( WP_REST_Request $request ) {
    $config = atera_compact_calculator_load_config();

    if ( is_wp_error( $config ) ) {
        return $config;
    }

    return rest_ensure_response( $config );
}
