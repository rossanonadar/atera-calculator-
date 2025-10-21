<?php
/**
 * Remote configuration loader for Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
// Filter to determine the remote configuration URL.
function atera_compact_calculator_filter_remote_url( $url ) {
    // Priority 1: Direct filter application
    if ( ! empty( $url ) ) {
        return $url;
    }

    // Priority 2: WordPress option
    $option = get_option( 'atera_compact_calculator_remote_url', '' );
    // Priority 3: Environment variable
    if ( ! empty( $option ) ) {
        return trim( $option );
    }

    $env = getenv( 'ATERA_CALC_REMOTE_CONFIG_URL' );
    // Priority 4: Constant definition
    if ( ! empty( $env ) ) {
        return trim( $env );
    }

    // Priority 5: PHP constant
    if ( defined( 'ATERA_CALC_REMOTE_CONFIG_URL' ) ) {
        return trim( (string) constant( 'ATERA_CALC_REMOTE_CONFIG_URL' ) );
    }

    return $url;
}
// Apply the filter with high priority.
add_filter( 'atera_compact_calculator_remote_config_url', 'atera_compact_calculator_filter_remote_url', 5 );

// Load the remote JSON configuration for the calculator.
function atera_compact_calculator_load_remote_config() {
    $remote_url = get_option( 'atera_compact_calculator_remote_url', '' );
    $remote_url = apply_filters( 'atera_compact_calculator_remote_config_url', $remote_url );

    // If no remote URL is defined, return an error.
    if ( empty( $remote_url ) ) {
        return new WP_Error(
            'atera_calculator_remote_disabled',
            __( 'No remote configuration URL has been defined.', 'atera' ),
            array( 'status' => 404 )
        );
    }

    $response = wp_remote_get(
        $remote_url,
        array(
            'timeout' => 10,
            'headers' => array( 'Accept' => 'application/json' ),
        )
    );
    // Check for HTTP errors.
    if ( is_wp_error( $response ) ) {
        return $response;
    }

    $code = wp_remote_retrieve_response_code( $response );
    // Validate HTTP status code.
    if ( 200 !== (int) $code ) {
        return new WP_Error(
            'atera_calculator_remote_http_error',
            sprintf( __( 'Remote configuration returned HTTP %d.', 'atera' ), (int) $code ),
            array( 'status' => $code )
        );
    }

    $body = wp_remote_retrieve_body( $response );
    $data = json_decode( $body, true );

    // Validate the decoded data.
    if ( null === $data || ! is_array( $data ) ) {
        return new WP_Error(
            'atera_calculator_remote_invalid',
            __( 'The remote calculator configuration is invalid.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    return $data;
}
