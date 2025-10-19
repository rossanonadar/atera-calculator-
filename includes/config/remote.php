<?php
/**
 * Remote configuration loader for Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function atera_compact_calculator_filter_remote_url( $url ) {
    if ( ! empty( $url ) ) {
        return $url;
    }

    $option = get_option( 'atera_compact_calculator_remote_url', '' );
    if ( ! empty( $option ) ) {
        return trim( $option );
    }

    $env = getenv( 'ATERA_CALC_REMOTE_CONFIG_URL' );
    if ( ! empty( $env ) ) {
        return trim( $env );
    }

    if ( defined( 'ATERA_CALC_REMOTE_CONFIG_URL' ) ) {
        return trim( (string) ATERA_CALC_REMOTE_CONFIG_URL );
    }

    return $url;
}
add_filter( 'atera_compact_calculator_remote_config_url', 'atera_compact_calculator_filter_remote_url', 5 );

function atera_compact_calculator_load_remote_config() {
    $remote_url = get_option( 'atera_compact_calculator_remote_url', '' );
    $remote_url = apply_filters( 'atera_compact_calculator_remote_config_url', $remote_url );

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

    if ( is_wp_error( $response ) ) {
        return $response;
    }

    $code = wp_remote_retrieve_response_code( $response );
    if ( 200 !== (int) $code ) {
        return new WP_Error(
            'atera_calculator_remote_http_error',
            sprintf( __( 'Remote configuration returned HTTP %d.', 'atera' ), (int) $code ),
            array( 'status' => $code )
        );
    }

    $body = wp_remote_retrieve_body( $response );
    $data = json_decode( $body, true );

    if ( null === $data || ! is_array( $data ) ) {
        return new WP_Error(
            'atera_calculator_remote_invalid',
            __( 'The remote calculator configuration is invalid.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    return $data;
}
